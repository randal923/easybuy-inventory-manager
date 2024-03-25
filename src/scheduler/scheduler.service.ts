import { Injectable } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { HttpService } from '../http/http.service'
import { BOA_GESTAO_INVENTORY_URL, BOA_GESTAO_PRODUCTS_URL } from '../constants/boa-gestao-urls'
import { mergeProductsAndInventory } from '../utils/boa-gestao'
import { ProductsService } from 'src/products/services/products.service'
import { ShopifyService } from 'src/shopify/shopify.service'
import { MergedProduct } from 'src/@types/prisma'

@Injectable()
export class SchedulerService {
  constructor(
    private readonly httpService: HttpService,
    private readonly productsService: ProductsService,
    private readonly shopifyService: ShopifyService,
  ) {}

  @Interval(100000000)
  async handleInterval() {
    console.info('Fetching products...')
    const headers = {
      Authorization: `Bearer ${process.env.BOA_GESTAO_API_KEY}`,
    }

    const boaGestaoProducts = await this.httpService.get<BoaGestaoProductsResponse>(
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

    const boaGestaoInventory = await this.httpService.get<BoaGestaoInventoryResponse>(
      BOA_GESTAO_INVENTORY_URL,
      {
        headers,
      },
    )

    const shopifyProductVariants = await this.shopifyService.fetchProductsVariants()

    const mergedProducts = mergeProductsAndInventory({
      products: filteredProducts,
      inventoryRows: boaGestaoInventory.data.rows,
      shopifyProductVariants: shopifyProductVariants,
    })

    await this.productsService.upsertProduct(mergedProducts)
    await this.shopifyService.updateStockLevels(
      mergedProducts as unknown as MergedProduct[],
      shopifyProductVariants,
    )
  }
}
