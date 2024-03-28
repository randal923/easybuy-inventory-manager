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
    const response = await this.boaGestaoService.placeOrder(orderInput)

    return response
  }

  async getOrderInput(boaGestaoProducts: BoaGestaoProduct[], shopifyOrderInput: ShopifyOrderInput) {
    const dateTime = new Date().toISOString()
    const clientId = 26
    let totalProducts = 0
    let total = 0

    const items = boaGestaoProducts.map(async (boaGestaoProduct): Promise<ItemsInput> => {
      const shopifyOrder = shopifyOrderInput.products.find((p) => p.sku === boaGestaoProduct.SKU)
      const totalItem = shopifyOrder.quantity * boaGestaoProduct.PrecoVista
      const isFractioned = shopifyOrder.isFractioned
      const productInDb = await this.prismaService.findProductBySku(boaGestaoProduct.SKU)
      const thereIsAnOpenBoxInStock = productInDb.fractionedQuantity > 0

      if (isFractioned && thereIsAnOpenBoxInStock) {
        await this.prismaService.updateProductFractionedQuantity(
          boaGestaoProduct.SKU,
          productInDb.fractionedQuantity - shopifyOrder.quantity,
        )

        return
      }

      if (isFractioned && !thereIsAnOpenBoxInStock) {
        await this.prismaService.updateProductFractionedQuantity(
          boaGestaoProduct.SKU,
          boaGestaoProduct.QuantidadePacote - shopifyOrder.quantity,
        )
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

    const finishedItems = await Promise.all(items)

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
