import { Injectable } from '@nestjs/common'
import { BoagestaoService } from 'src/boagestao/boagestao.service'
import { ShopifyOrderInput } from './dtos/shopify-order-input.dto'
import { ItemsInput } from './dtos/boa-gestao-order-input.dto'

@Injectable()
export class OrdersService {
  constructor(private boaGestaoService: BoagestaoService) {}

  async placeOrder(shopifyOrderInput: ShopifyOrderInput) {
    const skus = shopifyOrderInput.products.map((product) => product.sku)
    const boaGestaoProducts = await this.boaGestaoService.findProductsBySkus(skus)

    const orderInput = this.getOrderInput(boaGestaoProducts, shopifyOrderInput)
    const response = await this.boaGestaoService.placeOrder(orderInput)

    return response
  }

  getOrderInput(boaGestaoProducts: BoaGestaoProduct[], shopifyOrderInput: ShopifyOrderInput) {
    const dateTime = new Date().toISOString()
    const clientId = 26
    let totalProducts = 0
    let total = 0

    const items = boaGestaoProducts.map((boaGestaoProduct): ItemsInput => {
      const shopifyOrder = shopifyOrderInput.products.find((p) => p.sku === boaGestaoProduct.SKU)
      const totalItem = shopifyOrder.quantity * boaGestaoProduct.PrecoVista

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

    const orderInput = {
      dateTime,
      clientId,
      totalProducts,
      total,
      items,
    }

    return orderInput
  }
}
