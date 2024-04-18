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

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name)
  private taskScheduled: NodeJS.Timeout
  private timer = 61000

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
          this.httpService.get<BoaGestaoProductsResponse>(BOA_GESTAO_PRODUCTS_URL, {
            headers: panebrasHeaders,
          }),
          this.httpService.get<BoaGestaoProductsResponse>(BOA_GESTAO_PRODUCTS_URL, {
            headers: zapHeaders,
          }),
          this.httpService.get<BoaGestaoInventoryResponse>(BOA_GESTAO_INVENTORY_URL, {
            headers: panebrasHeaders,
          }),
          this.httpService.get<BoaGestaoInventoryResponse>(BOA_GESTAO_INVENTORY_URL, {
            headers: zapHeaders,
          }),
        ])

      const mergedBoaGestaoProducts = [
        ...panebrasProducts.data.rows,
        ...zapProducts.data.rows,
      ].filter((row) => row.SKU === 'LACTA-0001-0001' || row.SKU === 'LACTA-0001-0002')

      const mergedBoaGestaoInventory = [
        ...panebrasInventory.data.rows,
        ...zapInventory.data.rows,
      ]

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

      await this.productsService.upsertProduct(mergedProducts)
      await this.shopifyService.updateStockLevels(mergedProducts)
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
