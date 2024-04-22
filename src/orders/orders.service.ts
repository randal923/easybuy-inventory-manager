import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ShopifyOrderInput } from '../orders/dtos/shopify-order-input.dto'
import { BoagestaoService } from '../boagestao/boagestao.service'
import { AxiosHeaders } from 'axios'

@Injectable()
export class OrdersService {
  constructor(
    private boaGestaoService: BoagestaoService,
    private prismaService: PrismaService,
  ) {}

  async placeOrder(shopifyOrderInput: ShopifyOrderInput) {
    const { panebrasSkus, zapSkus } = this.getProductsSkus(shopifyOrderInput)

    const panebrasHeaders = new AxiosHeaders({
      Authorization: `Bearer ${process.env.BOA_GESTAO_PANEBRAS_API_KEY}`,
    })

    const zapHeaders = new AxiosHeaders({
      Authorization: `Bearer ${process.env.BOA_GESTAO_ZAP_API_KEY}`,
    })

    const panebrasProducts = await this.boaGestaoService.findProductsBySkus(
      panebrasSkus,
      panebrasHeaders,
    )

    const zapProducts = await this.boaGestaoService.findProductsBySkus(
      zapSkus,
      zapHeaders,
    )

    const panebrasOrderInput = await this.getOrderInput(
      panebrasProducts,
      shopifyOrderInput,
    )

    const zapOrderInput = await this.getOrderInput(zapProducts, shopifyOrderInput)

    const panebrasOrderResponse = await this.boaGestaoService.placeOrder(
      panebrasOrderInput,
      panebrasHeaders,
    )

    const zapOrderResponse = await this.boaGestaoService.placeOrder(
      zapOrderInput,
      zapHeaders,
    )

    return {
      status: 200,
      message: 'Order placed on Boa Gestão',
      iat: new Date().toISOString(),
      id: `${panebrasOrderResponse?.id}, ${zapOrderResponse?.id}`,
    }
  }

  async getOrderInput(
    boaGestaoProducts: BoaGestaoProduct[],
    shopifyOrderInput: ShopifyOrderInput,
  ) {
    if (boaGestaoProducts.length === 0) return

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
    const panebrasSkus = shopifyOrderInput.products
      .filter((product) => product.sku && product.isPanebras === true)
      .map((product) =>
        product.sku.startsWith('FR-') ? product.sku.substring(3) : product.sku,
      )

    const zapSkus = shopifyOrderInput.products
      .filter((product) => product.sku && product.isZap === true)
      .map((product) =>
        product.sku.startsWith('FR-') ? product.sku.substring(3) : product.sku,
      )

    return { panebrasSkus, zapSkus }
  }

  async getOrderItems(
    boaGestaoProducts: BoaGestaoProduct[],
    shopifyOrderInput: ShopifyOrderInput,
  ): Promise<OrderItem[]> {
    const items = []

    for (const shopifyProduct of shopifyOrderInput.products) {
      const matchSkuWithBoaGestao = (sku: string) =>
        sku.startsWith('FR-') ? sku.substring(3) : sku

      const boaGestaoProduct = boaGestaoProducts.find(
        (product) => product.SKU === matchSkuWithBoaGestao(shopifyProduct.sku),
      )

      if (!boaGestaoProduct) {
        console.error('Could not find boa gestao product for sku:', shopifyProduct.sku)
        continue
      }

      const isFractioned = shopifyProduct.isFractioned
      const productInDb = await this.prismaService.findProductBySku(shopifyProduct.sku)
      const isThereFractionedProductForThisSku =
        await this.prismaService.findProductBySku(`FR-${shopifyProduct.sku}`)

      const isThereNonFractionedProductForThisSku = shopifyProduct.sku?.startsWith('FR-')
        ? await this.prismaService.findProductBySku(shopifyProduct.sku.substring(3))
        : false
      const isFractionedQuantityEnough =
        productInDb.fractionedQuantity >= shopifyProduct.quantity

      if (isFractioned && isFractionedQuantityEnough) {
        await this.prismaService.updateProductFractionedQuantity({
          sku: shopifyProduct.sku,
          fractionedQuantity: productInDb.fractionedQuantity - shopifyProduct.quantity,
        })

        await this.prismaService.updateShopifyCurrentStock({
          sku: shopifyProduct.sku,
          shopifyCurrentStock: productInDb.shopifyCurrentStock - shopifyProduct.quantity,
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
          boaGestaoCurrentStock: productInDb.boaGestaoCurrentStock - boxesNeeded,
        })

        await this.prismaService.updateShopifyCurrentStock({
          sku: shopifyProduct.sku,
          shopifyCurrentStock: productInDb.shopifyCurrentStock - shopifyProduct.quantity,
        })

        if (isThereNonFractionedProductForThisSku) {
          const nonFractionedProductInDb = isThereNonFractionedProductForThisSku

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
        shopifyCurrentStock: productInDb.shopifyCurrentStock - shopifyProduct.quantity,
      })

      if (isThereFractionedProductForThisSku) {
        const fractionedProductInDb = isThereFractionedProductForThisSku

        await this.prismaService.updateBoaGestaoCurrentStock({
          sku: fractionedProductInDb.sku,
          boaGestaoCurrentStock:
            fractionedProductInDb.boaGestaoCurrentStock - shopifyProduct.quantity,
        })

        await this.prismaService.updateShopifyCurrentStock({
          sku: fractionedProductInDb.sku,
          shopifyCurrentStock:
            fractionedProductInDb.shopifyCurrentStock -
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

    return items
  }
}
