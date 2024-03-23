import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient, Product } from '@prisma/client'

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

  async upsertProduct(productData: Product) {
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
}
