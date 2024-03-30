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
    const items = await this.getOrderItems(boaGestaoProducts, shopifyOrderInput)
    const total = items.reduce((acc, item) => acc + item.total, 0)

    const orderInput = {
      dateTime,
      clientId,
      totalProducts: total,
      total,
      items,
    }

    return orderInput
  }

  async getOrderItems(boaGestaoProducts: BoaGestaoProduct[], shopifyOrderInput: ShopifyOrderInput) {
    const matchSkuWithBoaGestao = (sku: string) => (sku.startsWith('EB') ? sku.substring(2) : sku)

    const items = boaGestaoProducts.map(async (boaGestaoProduct): Promise<ItemsInput> => {
      const shopifyProduct = shopifyOrderInput.products.find(
        (product) => matchSkuWithBoaGestao(product.sku) === boaGestaoProduct.SKU,
      )

      if (!shopifyProduct) return null

      const totalItem = shopifyProduct.quantity * boaGestaoProduct.PrecoVista
      const isFractioned = shopifyProduct.isFractioned
      const productInDb = await this.prismaService.findProductBySku(shopifyProduct.sku)
      const thereIsAnOpenBoxInStock = productInDb.fractionedQuantity > 0
      const isFractionedQuantityEnough = productInDb.fractionedQuantity >= shopifyProduct.quantity

      if (isFractioned && thereIsAnOpenBoxInStock && isFractionedQuantityEnough) {
        await this.prismaService.updateProductFractionedQuantity({
          sku: shopifyProduct.sku,
          fractionedQuantity: productInDb.fractionedQuantity - shopifyProduct.quantity,
        })

        await this.prismaService.updateShopifyCurrentStock({
          sku: shopifyProduct.sku,
          shopifyCurrentStock: productInDb.shopifyCurrentStock - shopifyProduct.quantity,
        })

        return null
      }

      if (isFractioned && thereIsAnOpenBoxInStock && !isFractionedQuantityEnough) {
        let quantityNeeded = shopifyProduct.quantity - (productInDb.fractionedQuantity ?? 0)
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
        await this.prismaService.updateShopifyCurrentStock({
          sku: shopifyProduct.sku,
          shopifyCurrentStock: productInDb.shopifyCurrentStock - shopifyProduct.quantity,
        })
        await this.prismaService.updateBoaGestaoCurrentStock({
          sku: shopifyProduct.sku,
          boaGestaoCurrentStock: productInDb.boaGestaoCurrentStock - boxesNeeded,
        })

        return {
          productId: boaGestaoProduct.Id,
          sku: boaGestaoProduct.SKU || '',
          unity: boaGestaoProduct.Unidade,
          quantity: boxesNeeded,
          unityPrice: boaGestaoProduct.PrecoVista,
          totalItem: boxesNeeded * boaGestaoProduct.PrecoVista,
          total: boxesNeeded * boaGestaoProduct.PrecoVista,
        }
      }

      if (isFractioned && !thereIsAnOpenBoxInStock) {
        let quantityNeeded = shopifyProduct.quantity

        let boxesNeeded = 0
        while (quantityNeeded > 0) {
          quantityNeeded = quantityNeeded - boaGestaoProduct.QuantidadePacote
          boxesNeeded++
        }

        quantityNeeded = Math.abs(quantityNeeded)

        await this.prismaService.updateProductFractionedQuantity({
          sku: shopifyProduct.sku,
          fractionedQuantity:
            boaGestaoProduct.QuantidadePacote * boxesNeeded - shopifyProduct.quantity,
        })

        await this.prismaService.updateShopifyCurrentStock({
          sku: shopifyProduct.sku,
          shopifyCurrentStock: productInDb.shopifyCurrentStock - shopifyProduct.quantity,
        })

        await this.prismaService.updateBoaGestaoCurrentStock({
          sku: shopifyProduct.sku,
          boaGestaoCurrentStock: productInDb.boaGestaoCurrentStock - boxesNeeded,
        })

        return {
          productId: boaGestaoProduct.Id,
          sku: boaGestaoProduct.SKU || '',
          unity: boaGestaoProduct.Unidade,
          quantity: boxesNeeded,
          unityPrice: boaGestaoProduct.PrecoVista,
          totalItem: boxesNeeded * boaGestaoProduct.PrecoVista,
          total: boxesNeeded * boaGestaoProduct.PrecoVista,
        }
      }

      return {
        productId: boaGestaoProduct.Id,
        sku: boaGestaoProduct.SKU || '',
        unity: boaGestaoProduct.Unidade,
        quantity: shopifyProduct.quantity,
        unityPrice: boaGestaoProduct.PrecoVista,
        totalItem: totalItem,
        total: totalItem,
      }
    })

    const finishedItems = (await Promise.all(items)).filter((item) => item !== null)

    return finishedItems
  }
}
