import { Injectable } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { HttpService } from '../http/http.service'
import {
  BOA_GESTAO_INVENTORY_URL,
  BOA_GESTAO_PRODUCTS_URL,
} from '../constants/boa-gestao-urls'
import { mergeProductsAndInventory } from '../utils/boa-gestao'
import { ProductsService } from 'src/products/services/products.service'
import { ShopifyService } from 'src/shopify/shopify.service'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class SchedulerService {
  constructor(
    private readonly httpService: HttpService,
    private readonly productsService: ProductsService,
    private readonly shopifyService: ShopifyService,
    private readonly prismaService: PrismaService,
  ) {}

  @Interval(3000000)
  async handleInterval() {
    console.info('Updating stock levels...')
    const headers = {
      Authorization: `Bearer ${process.env.BOA_GESTAO_API_KEY}`,
    }

    const boaGestaoProducts =
      await this.httpService.get<BoaGestaoProductsResponse>(
        BOA_GESTAO_PRODUCTS_URL,
        {
          headers,
        },
      )

    // Filter products by SKU for testing purposes
    const filteredProducts = boaGestaoProducts.data.rows.filter(
      (product) =>
        product.SKU === 'ECT24 glow' ||
        product.SKU === 'ECL24 ELITE glow' ||
        product.SKU === '25501' ||
        product.SKU === '25500',
    )

    const boaGestaoInventory =
      await this.httpService.get<BoaGestaoInventoryResponse>(
        BOA_GESTAO_INVENTORY_URL,
        {
          headers,
        },
      )

    const shopifyProductVariants =
      await this.shopifyService.fetchProductsVariants()

    const skus = shopifyProductVariants.map((variant) => variant.sku)
    const validSkus = skus.filter((sku) => sku && sku.trim().length > 0)
    const productsInDb = await this.prismaService.findProductsBySkus(validSkus)

    const mergedProducts = mergeProductsAndInventory({
      boaGestaoProducts: filteredProducts,
      boaGestaoInventoryRows: boaGestaoInventory.data.rows,
      shopifyProductVariants: shopifyProductVariants,
      productsInDb,
    })

    await this.productsService.upsertProduct(mergedProducts)
    await this.shopifyService.updateStockLevels(mergedProducts)
  }
}
