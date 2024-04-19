import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '../http/http.service'
import {
  BOA_GESTAO_INVENTORY_URL,
  BOA_GESTAO_PRODUCTS_URL,
} from '../constants/boa-gestao-urls'
import { mergeProductsAndInventory } from '../utils/boa-gestao'
import { ProductsService } from 'src/products/services/products.service'
import { ShopifyService } from 'src/shopify/shopify.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { removeDuplicates } from '@src/utils/orders'

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name)
  private taskScheduled: NodeJS.Timeout
  private timer = 11000

  constructor(
    private readonly httpService: HttpService,
    private readonly productsService: ProductsService,
    private readonly shopifyService: ShopifyService,
    private readonly prismaService: PrismaService,
  ) {
    this.scheduleTask(this.timer)
  }

  scheduleTask(interval: number) {
    if (this.taskScheduled) {
      clearInterval(this.taskScheduled)
    }

    this.taskScheduled = setTimeout(() => this.handleInterval(), interval)
  }

  async handleInterval() {
    try {
      this.logger.log('Updating stock levels...')
      const panebrasHeaders = {
        Authorization: `Bearer ${process.env.BOA_GESTAO_PANEBRAS_API_KEY}`,
      }
      const zapHeaders = {
        Authorization: `Bearer ${process.env.BOA_GESTAO_ZAP_API_KEY}`,
      }

      const [panebrasProducts, zapProducts, panebrasInventory, zapInventory] =
        await Promise.all([
          this.httpService.fetchAllBoaGestaoPages<BoaGestaoProduct>(
            BOA_GESTAO_PRODUCTS_URL,
            {
              headers: panebrasHeaders,
            },
          ),
          this.httpService.fetchAllBoaGestaoPages<BoaGestaoProduct>(
            BOA_GESTAO_PRODUCTS_URL,
            {
              headers: zapHeaders,
            },
          ),
          this.httpService.fetchAllBoaGestaoPages<BoaGestaoInventoryItem>(
            BOA_GESTAO_INVENTORY_URL,
            {
              headers: panebrasHeaders,
            },
          ),
          this.httpService.fetchAllBoaGestaoPages<BoaGestaoInventoryItem>(
            BOA_GESTAO_INVENTORY_URL,
            {
              headers: zapHeaders,
            },
          ),
        ])

      const mergedBoaGestaoProducts = [...panebrasProducts, ...zapProducts]
      const mergedBoaGestaoInventory = [...panebrasInventory, ...zapInventory]

      const shopifyProductVariants = await this.shopifyService.fetchProductsVariants()
      const skus = shopifyProductVariants.map((variant) => variant.sku)
      const validSkus = skus.filter((sku) => sku && sku.trim().length > 0)
      const productsInDb = await this.prismaService.findProductsBySkus(validSkus)

      const mergedProducts = mergeProductsAndInventory({
        boaGestaoProducts: mergedBoaGestaoProducts,
        boaGestaoInventoryRows: mergedBoaGestaoInventory,
        shopifyProductVariants: shopifyProductVariants,
        productsInDb,
      })

      if (mergedProducts.length === 0) return

      const undiplicatedMergedProducts = removeDuplicates(mergedProducts, 'sku')
      await this.productsService.upsertProduct(undiplicatedMergedProducts)
      await this.shopifyService.updateStockLevels(undiplicatedMergedProducts)
    } catch (error) {
      if (error.response && error.response.status === 429) {
        const retryAfter = error.response.data.time
        this.logger.error(`Rate limit exceeded. Pausing for ${retryAfter} ms.`)
        this.scheduleTask(retryAfter + this.timer)
        return
      }

      this.logger.error('Failed to fetch products: ' + error.message)
    }

    this.scheduleTask(this.timer)
  }
}
