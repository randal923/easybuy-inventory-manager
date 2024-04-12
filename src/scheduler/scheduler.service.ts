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

  @Interval(5000)
  async handleInterval() {
    console.info('Updating stock levels...')
    const headers = {
      Authorization: `Bearer ${process.env.BOA_GESTAO_API_KEY}`,
    }

    const boaGestaoProducts = await this.makeRequestWithRetry(() =>
      this.httpService.get<BoaGestaoProductsResponse>(BOA_GESTAO_PRODUCTS_URL, {
        headers,
      }),
    )

    const filteredProducts = boaGestaoProducts.data.rows.filter(
      (product) =>
        product.SKU === 'ECT24 glow' ||
        product.SKU === 'ECL24 ELITE glow' ||
        product.SKU === '25501' ||
        product.SKU === '25500',
    )

    const boaGestaoInventory = await this.makeRequestWithRetry(() =>
      this.httpService.get<BoaGestaoInventoryResponse>(BOA_GESTAO_INVENTORY_URL, {
        headers,
      }),
    )

    const shopifyProductVariants = await this.shopifyService.fetchProductsVariants()
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

  private async makeRequestWithRetry<T>(
    requestFn: () => Promise<T>,
    maxRetries = 1,
  ): Promise<T> {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        return await requestFn();
      } catch (error) {
        if (error.response && error.response.status === 429) {
          // Assuming the API returns the delay in the response body in seconds
          const retryDelay = error.response.data.time * 1000;
          if (retryDelay > 0) {
            retries++;
            console.warn(`Request failed with status 429. Retrying in ${retryDelay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          } else {
            // No valid retry delay found, log an error and break out of the loop.
            console.error('Request failed with status 429, but no valid retry delay provided.');
            throw new Error('Request failed with status 429, but no valid retry delay provided.');
          }
        } else {
          // For any other errors, rethrow and stop retrying.
          throw error;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }
  
