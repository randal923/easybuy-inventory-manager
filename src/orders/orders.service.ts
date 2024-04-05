import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ShopifyOrderInput } from '../orders/dtos/shopify-order-input.dto'
import { BoagestaoService } from '../boagestao/boagestao.service'

@Injectable()
export class OrdersService {
  constructor(
    private boaGestaoService: BoagestaoService,
    private prismaService: PrismaService,
  ) {}

  async placeOrder(shopifyOrderInput: ShopifyOrderInput) {
    console.log('shopifyOrderInput', shopifyOrderInput)
    const skus = this.getProductsSkus(shopifyOrderInput)
    const boaGestaoProducts =
      await this.boaGestaoService.findProductsBySkus(skus)

    const orderInput = await this.getOrderInput(
      boaGestaoProducts,
      shopifyOrderInput,
    )

    console.log('orderInput', orderInput)

    if (orderInput.items.length === 0) {
      return {
        status: 200,
        message:
          'No order placed on Boa Gestão because there was enough fractioned items for this order',
      }
    }

    const response = await this.boaGestaoService.placeOrder(orderInput)
    console.log('response', response)
    return response
  }

  async getOrderInput(
    boaGestaoProducts: BoaGestaoProduct[],
    shopifyOrderInput: ShopifyOrderInput,
  ) {
    const dateTime = new Date().toISOString()
    const clientId = 26
    const items = await this.getOrderItems(boaGestaoProducts, shopifyOrderInput)
    const mergedItems = this.mergeSimilarItems(items)

    const total = mergedItems.reduce((acc, item) => acc + item?.total, 0)

    const orderInput = {
      dateTime,
      clientId,
      totalProducts: total,
      total,
      items: mergedItems,
    }

    return orderInput
  }

  mergeSimilarItems(items: OrderItem[]) {
    const mergedProducts = new Map()

    items.forEach((product) => {
      const { productId, quantity, unityPrice } = product

      if (mergedProducts.has(productId)) {
        const existingProduct = mergedProducts.get(productId)
        existingProduct.quantity += quantity
        existingProduct.total = existingProduct.quantity * unityPrice
        existingProduct.totalItem = existingProduct.total
      } else {
        const newProduct = {
          ...product,
          total: quantity * unityPrice,
          totalItem: quantity * unityPrice,
        }
        mergedProducts.set(productId, newProduct)
      }
    })

    return Array.from(mergedProducts.values())
  }

  getProductsSkus(shopifyOrderInput: ShopifyOrderInput) {
    return shopifyOrderInput.products.map((product) => product.sku)
  }

  async getOrderItems(
    boaGestaoProducts: BoaGestaoProduct[],
    shopifyOrderInput: ShopifyOrderInput,
  ): Promise<OrderItem[]> {
    const items = []

    for (const shopifyProduct of shopifyOrderInput.products) {
      const matchSkuWithBoaGestao = (sku: string) =>
        sku.startsWith('EB') ? sku.substring(2) : sku

      const boaGestaoProduct = boaGestaoProducts.find(
        (product) => product.SKU === matchSkuWithBoaGestao(shopifyProduct.sku),
      )

      if (!boaGestaoProduct) {
        console.error(
          'Could not find boa gestao product for sku:',
          shopifyProduct.sku,
        )
        continue
      }

      const isFractioned = shopifyProduct.isFractioned
      const productInDb = await this.prismaService.findProductBySku(
        shopifyProduct.sku,
      )
      const isThereFractionedProductForThisSku =
        await this.prismaService.findProductBySku(`EB${shopifyProduct.sku}`)

      const isThereNonFractionedProductForThisSku =
        shopifyProduct.sku.startsWith('EB')
          ? await this.prismaService.findProductBySku(
              shopifyProduct.sku.replace(/EB/g, ''),
            )
          : false
      const isFractionedQuantityEnough =
        productInDb.fractionedQuantity >= shopifyProduct.quantity

      if (isFractioned && isFractionedQuantityEnough) {
        await this.prismaService.updateProductFractionedQuantity({
          sku: shopifyProduct.sku,
          fractionedQuantity:
            productInDb.fractionedQuantity - shopifyProduct.quantity,
        })

        await this.prismaService.updateShopifyCurrentStock({
          sku: shopifyProduct.sku,
          shopifyCurrentStock:
            productInDb.shopifyCurrentStock - shopifyProduct.quantity,
        })

        continue
      }

      if (isFractioned && !isFractionedQuantityEnough) {
        let quantityNeeded =
          shopifyProduct.quantity - (productInDb.fractionedQuantity ?? 0)
        let boxesNeeded = 0
        while (quantityNeeded > 0) {
          quantityNeeded = quantityNeeded - boaGestaoProduct.QuantidadePacote
          boxesNeeded++
        }
        quantityNeeded = Math.abs(quantityNeeded)

        await this.prismaService.updateProductFractionedQuantity({
          sku: shopifyProduct.sku,
          fractionedQuantity: quantityNeeded,
        })

        await this.prismaService.updateBoaGestaoCurrentStock({
          sku: shopifyProduct.sku,
          boaGestaoCurrentStock:
            productInDb.boaGestaoCurrentStock - boxesNeeded,
        })

        await this.prismaService.updateShopifyCurrentStock({
          sku: shopifyProduct.sku,
          shopifyCurrentStock:
            productInDb.shopifyCurrentStock - shopifyProduct.quantity,
        })

        if (isThereNonFractionedProductForThisSku) {
          const nonFractionedProductInDb =
            await this.prismaService.findProductBySku(
              shopifyProduct.sku.replace(/EB/g, ''),
            )

          await this.prismaService.updateShopifyCurrentStock({
            sku: nonFractionedProductInDb.sku,
            shopifyCurrentStock:
              nonFractionedProductInDb.shopifyCurrentStock - boxesNeeded,
          })

          await this.prismaService.updateBoaGestaoCurrentStock({
            sku: nonFractionedProductInDb.sku,
            boaGestaoCurrentStock:
              nonFractionedProductInDb.boaGestaoCurrentStock - boxesNeeded,
          })
        }

        items.push({
          productId: boaGestaoProduct.Id,
          sku: boaGestaoProduct.SKU || '',
          unity: boaGestaoProduct.Unidade,
          quantity: boxesNeeded,
          unityPrice: boaGestaoProduct.PrecoVista,
          totalItem: boxesNeeded * boaGestaoProduct.PrecoVista,
          total: boxesNeeded * boaGestaoProduct.PrecoVista,
        })

        continue
      }

      const totalItem = shopifyProduct.quantity * boaGestaoProduct.PrecoVista

      await this.prismaService.updateBoaGestaoCurrentStock({
        sku: shopifyProduct.sku,
        boaGestaoCurrentStock:
          productInDb.boaGestaoCurrentStock - shopifyProduct.quantity,
      })

      await this.prismaService.updateShopifyCurrentStock({
        sku: shopifyProduct.sku,
        shopifyCurrentStock:
          productInDb.shopifyCurrentStock - shopifyProduct.quantity,
      })

      if (!isThereFractionedProductForThisSku) {
        const fractionedProductInDb = await this.prismaService.findProductBySku(
          shopifyProduct.sku.replace(/EB/g, ''),
        )

        await this.prismaService.updateBoaGestaoCurrentStock({
          sku: fractionedProductInDb.sku,
          boaGestaoCurrentStock:
            fractionedProductInDb.boaGestaoCurrentStock -
            shopifyProduct.quantity,
        })
        await this.prismaService.updateShopifyCurrentStock({
          sku: fractionedProductInDb.sku,
          shopifyCurrentStock:
            fractionedProductInDb.shopifyCurrentStock *
              boaGestaoProduct.QuantidadePacote -
            shopifyProduct.quantity * boaGestaoProduct.QuantidadePacote,
        })
      }

      items.push({
        productId: boaGestaoProduct.Id,
        sku: boaGestaoProduct.SKU || '',
        unity: boaGestaoProduct.Unidade,
        quantity: shopifyProduct.quantity,
        unityPrice: boaGestaoProduct.PrecoVista,
        totalItem,
        total: totalItem,
      })
    }

    console.log('items', items)
    return items
  }
}
