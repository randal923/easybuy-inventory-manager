import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { Product } from '@prisma/client'

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async upsertProduct(productData: Product[]) {
    for (const product of productData) {
      await this.prisma.upsertProduct(product)
    }
  }

  async getAllProducts() {
    return this.prisma.product.findMany()
  }
}
