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

      const shopifyProductVariants = await this.shopifyService.fetchProductsVariants()

      // this.checkForInvalidSkus(shopifyProductVariants, mergedBoaGestaoProducts)

      const skus = shopifyProductVariants.map((variant) => variant.sku)
      const validSkus = skus.filter((sku) => sku && sku.trim().length > 0)

      const productsInDb = await this.prismaService.findProductsBySkus(validSkus)

      const mergedPanebrasProducts = mergeProductsAndInventory({
        boaGestaoProducts: panebrasProducts,
        boaGestaoInventoryRows: panebrasInventory,
        shopifyProductVariants: shopifyProductVariants,
        productsInDb,
      })

      const mergedZapProducts = mergeProductsAndInventory({
        boaGestaoProducts: zapProducts,
        boaGestaoInventoryRows: zapInventory,
        shopifyProductVariants: shopifyProductVariants,
        productsInDb,
      })

      const mergedProducts = [...mergedPanebrasProducts, ...mergedZapProducts]

      if (mergedProducts.length === 0) {
        this.logger.warn('No products to update.')
        return
      }

      const unduplicatedMergedProducts = removeDuplicates(mergedProducts, 'sku')

      await this.shopifyService.updateProductVariantsPrices(
        shopifyProductVariants,
        unduplicatedMergedProducts,
      )
      await this.productsService.upsertProduct(unduplicatedMergedProducts)
      await this.shopifyService.updateStockLevels(unduplicatedMergedProducts)
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

  checkForInvalidSkus(variants: VariantNode[], boaGestaoProducts: BoaGestaoProduct[]) {
    const boaGestaoSkus = new Map(
      boaGestaoProducts.map((product) => [product.SKU, product]),
    )

    let invalidSkusCount = 0

    for (const variant of variants) {
      if (!variant.sku || variant.sku.trim().length === 0) {
        this.logger.warn(
          `Product with invalid SKU in Shopify: title: ${JSON.stringify(variant.title)}, sku: ${JSON.stringify(variant.sku)}`,
        )
        invalidSkusCount++
        continue
      }

      const matchSkuWithBoaGestao = variant.sku.startsWith('FR-')
        ? variant.sku.substring(3)
        : variant.sku

      const boaGestaoProduct = boaGestaoSkus.get(matchSkuWithBoaGestao)

      if (!boaGestaoProduct) {
        this.logger.warn(
          `SKU mismatch: No matching product in Boa Gestão for Shopify SKU: ${variant.sku}`,
        )
        invalidSkusCount++
        continue
      }

      if (boaGestaoProduct.SKU !== matchSkuWithBoaGestao) {
        this.logger.warn(
          `SKU mismatch: Shopify SKU ${variant.sku} differs from Boa Gestão SKU ${boaGestaoProduct.SKU} for product title ${variant.title}`,
        )
        invalidSkusCount++
        continue
      }
    }

    if (invalidSkusCount > 0) {
      this.logger.log(`${invalidSkusCount} products have invalid SKUs.`)
    }
  }
}
