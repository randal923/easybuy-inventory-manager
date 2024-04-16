import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { MergedProduct } from 'src/@types/prisma'
import { copyObjectWithoutKey } from '@src/utils/product'

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async upsertProduct(productData: MergedProduct[]) {
    for (const product of productData) {
      const productWithoutShopifyLaggingStock = copyObjectWithoutKey(
        product,
        'shopifyLaggingStock',
      )
      await this.prisma.upsertProduct(productWithoutShopifyLaggingStock)
    }
  }

  async getAllProducts() {
    return this.prisma.product.findMany()
  }
}
