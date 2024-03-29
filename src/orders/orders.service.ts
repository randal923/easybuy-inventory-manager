import { Injectable } from '@nestjs/common'
import { BoagestaoService } from 'src/boagestao/boagestao.service'
import { ShopifyOrderInput } from './dtos/shopify-order-input.dto'
import { ItemsInput } from './dtos/boa-gestao-order-input.dto'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class OrdersService {
  constructor(
    private boaGestaoService: BoagestaoService,
    private prismaService: PrismaService,
  ) {}

  async placeOrder(shopifyOrderInput: ShopifyOrderInput) {
    const skus = shopifyOrderInput.products.map((product) => product.sku)
    const boaGestaoProducts = await this.boaGestaoService.findProductsBySkus(skus)

    const orderInput = await this.getOrderInput(boaGestaoProducts, shopifyOrderInput)
    if (orderInput.items.length === 0) {
      return {
        status: 200,
        message: 'We already have an open box for this item, no order on Boa Gestão was placed.',
      }
    }

    const response = await this.boaGestaoService.placeOrder(orderInput)

    return response
  }

  async getOrderInput(boaGestaoProducts: BoaGestaoProduct[], shopifyOrderInput: ShopifyOrderInput) {
    const dateTime = new Date().toISOString()
    const clientId = 26
    let totalProducts = 0
    let total = 0

    const matchSkuWithBoaGestao = (sku: string) => (sku.startsWith('EB') ? sku.substring(2) : sku)

    const items = boaGestaoProducts.map(async (boaGestaoProduct): Promise<ItemsInput> => {
      const shopifyOrder = shopifyOrderInput.products.find(
        (product) => matchSkuWithBoaGestao(product.sku) === boaGestaoProduct.SKU,
      )

      if (!shopifyOrder) return null

      const totalItem = shopifyOrder.quantity * boaGestaoProduct.PrecoVista
      const isFractioned = shopifyOrder.isFractioned
      const productInDb = await this.prismaService.findProductBySku(shopifyOrder.sku)
      const thereIsAnOpenBoxInStock = productInDb.fractionedQuantity > 0
      const isFractionedQuantityEnough = productInDb.fractionedQuantity >= shopifyOrder.quantity

      if (isFractioned && thereIsAnOpenBoxInStock && isFractionedQuantityEnough) {
        await this.prismaService.updateProductFractionedQuantity({
          sku: shopifyOrder.sku,
          fractionedQuantity: productInDb.fractionedQuantity - shopifyOrder.quantity,
        })

        await this.prismaService.updateShopifyCurrentStock({
          sku: shopifyOrder.sku,
          shopifyCurrentStock: productInDb.shopifyCurrentStock - shopifyOrder.quantity,
        })

        return null
      }

      if (isFractioned && thereIsAnOpenBoxInStock && !isFractionedQuantityEnough) {
        let quantityNeeded = shopifyOrder.quantity - (productInDb.fractionedQuantity ?? 0)
        let boxesNeeded = 0
        while (quantityNeeded > 0) {
          quantityNeeded = quantityNeeded - boaGestaoProduct.QuantidadePacote
          boxesNeeded++
        }
        quantityNeeded = Math.abs(quantityNeeded)
        await this.prismaService.updateProductFractionedQuantity({
          sku: shopifyOrder.sku,
          fractionedQuantity: quantityNeeded,
        })
        await this.prismaService.updateShopifyCurrentStock({
          sku: shopifyOrder.sku,
          shopifyCurrentStock: productInDb.shopifyCurrentStock - shopifyOrder.quantity,
        })
        await this.prismaService.updateBoaGestaoCurrentStock({
          sku: shopifyOrder.sku,
          boaGestaoCurrentStock: productInDb.boaGestaoCurrentStock - boxesNeeded,
        })

        return {
          productId: boaGestaoProduct.Id,
          sku: boaGestaoProduct.SKU || '',
          unity: boaGestaoProduct.Unidade,
          quantity: productInDb.fractionedQuantity,
          unityPrice: boaGestaoProduct.PrecoVista,
          totalItem: productInDb.fractionedQuantity * boaGestaoProduct.PrecoVista,
          total: productInDb.fractionedQuantity * boaGestaoProduct.PrecoVista,
        }
      }

      if (isFractioned && !thereIsAnOpenBoxInStock) {
        let quantityNeeded = shopifyOrder.quantity - (productInDb.fractionedQuantity ?? 0)
        let boxesNeeded = 0
        while (quantityNeeded > 0) {
          quantityNeeded = quantityNeeded - boaGestaoProduct.QuantidadePacote
          boxesNeeded++
        }
        quantityNeeded = Math.abs(quantityNeeded)

        await this.prismaService.updateProductFractionedQuantity({
          sku: shopifyOrder.sku,
          fractionedQuantity:
            boaGestaoProduct.QuantidadePacote * boxesNeeded -
            (shopifyOrder.quantity - (productInDb.fractionedQuantity ?? 0)),
        })

        await this.prismaService.updateShopifyCurrentStock({
          sku: shopifyOrder.sku,
          shopifyCurrentStock: productInDb.shopifyCurrentStock - shopifyOrder.quantity,
        })

        await this.prismaService.updateBoaGestaoCurrentStock({
          sku: shopifyOrder.sku,
          boaGestaoCurrentStock: productInDb.boaGestaoCurrentStock - boxesNeeded,
        })
      }

      totalProducts += shopifyOrder.quantity
      total += totalItem

      return {
        productId: boaGestaoProduct.Id,
        sku: boaGestaoProduct.SKU || '',
        unity: boaGestaoProduct.Unidade,
        quantity: shopifyOrder.quantity,
        unityPrice: boaGestaoProduct.PrecoVista,
        totalItem: totalItem,
        total: totalItem,
      }
    })

    const finishedItems = (await Promise.all(items)).filter((item) => item !== null)

    const orderInput = {
      dateTime,
      clientId,
      totalProducts,
      total,
      items: finishedItems,
    }

    return orderInput
  }
}
