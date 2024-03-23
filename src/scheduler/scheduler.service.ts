import { Injectable } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { GraphQLService } from '../graphql/graphql.service'
import { HttpService } from '../http/http.service'
import { BOA_GESTAO_INVENTORY_URL, BOA_GESTAO_PRODUCTS_URL } from '../constants/boa-gestao-urls'
import { mergeProductsAndInventory } from '../utils/boa-gestao'
import { ProductsService } from 'src/products/services/products.service'
import { ShopifyService } from 'src/shopify/shopify.service'

@Injectable()
export class SchedulerService {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly httpService: HttpService,
    private readonly productsService: ProductsService,
    private readonly shopifyService: ShopifyService,
  ) {}

  @Interval(10000)
  async handleInterval() {
    console.log('Fetching products...')
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
      (product) => product.SKU === 'ECT24 glow' || product.SKU === 'ECL24 ELITE glow',
    )

    const boaGestaoInventory = await this.httpService.get<BoaGestaoInventoryResponse>(
      BOA_GESTAO_INVENTORY_URL,
      {
        headers,
      },
    )

    const mergedProducts = mergeProductsAndInventory({
      products: filteredProducts,
      inventoryRows: boaGestaoInventory.data.rows,
    })

    await this.productsService.upsertProduct(mergedProducts)
    await this.shopifyService.updateStockLevels(
      mergedProducts as unknown as MergedBoaGestaoProduct[],
    )
  }
}
