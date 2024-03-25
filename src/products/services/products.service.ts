import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ProductWithoutId } from 'src/@types/prisma'

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async upsertProduct(productData: ProductWithoutId[]) {
    for (const product of productData) {
      await this.prisma.upsertProduct(product)
    }
  }

  async getAllProducts() {
    return this.prisma.product.findMany()
  }
}
