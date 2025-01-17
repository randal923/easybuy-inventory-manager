import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient, Product } from '@prisma/client'
import {
  ProductWithoutId,
  UpdateBoaGestaoCurrentStock,
  UpdateProductFractionedQuantity,
  UpdateShopifyCurrentStock,
} from '../@types/prisma'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  prisma: PrismaClient

  constructor() {
    super()
    this.prisma = new PrismaClient()
  }
  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }

  async addProduct(productData: Product) {
    return this.prisma.product.create({
      data: productData,
    })
  }

  async addProducts(productsData: Product[]) {
    return this.$transaction(
      productsData.map((product) =>
        this.product.create({
          data: product,
        }),
      ),
    )
  }

  async upsertProduct(productData: ProductWithoutId) {
    return this.prisma.product.upsert({
      where: { sku: productData.sku as any },
      update: {
        ...productData,
      },
      create: {
        ...productData,
      },
    })
  }

  async updateProductFractionedQuantity(params: UpdateProductFractionedQuantity) {
    const { sku, fractionedQuantity } = params
    return this.product.update({
      where: { sku },
      data: { fractionedQuantity },
    })
  }

  async updateShopifyCurrentStock({
    sku,
    shopifyCurrentStock,
  }: UpdateShopifyCurrentStock) {
    return this.product.update({
      where: { sku },
      data: { shopifyCurrentStock },
    })
  }

  async updateBoaGestaoCurrentStock({
    sku,
    boaGestaoCurrentStock,
  }: UpdateBoaGestaoCurrentStock) {
    return this.product.update({
      where: { sku },
      data: { boaGestaoCurrentStock },
    })
  }

  async findProductBySku(sku: string) {
    return this.prisma.product.findUnique({
      where: { sku },
    })
  }

  async setProductFractionedQuantity(sku: string, fractionedQuantity: number) {
    return this.product.update({
      where: { sku },
      data: { fractionedQuantity },
    })
  }

  async findProductsBySkus(skus: string[]): Promise<Product[]> {
    if (!skus || skus.length === 0) {
      throw new Error('No skus provided in findProductsBySkus Prisma method')
    }

    try {
      const products = await this.prisma.product.findMany({
        where: {
          sku: {
            in: skus,
          },
        },
      })

      return products
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  async enqueueOrder(orderData: OrderPaid) {
    return this.orderQueue.create({
      data: {
        orderData: JSON.stringify(orderData),
      },
    })
  }

  async fetchUnprocessedOrders(batchSize: number) {
    return this.orderQueue.findMany({
      where: {
        processed: false,
      },
      take: batchSize,
    })
  }

  async markOrderAsProcessed(id: number) {
    return this.orderQueue.update({
      where: { id },
      data: { processed: true, processedAt: new Date() },
    })
  }
}
