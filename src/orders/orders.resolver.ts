import { Resolver, Mutation, Args, Query } from '@nestjs/graphql'
import { OrdersService } from './orders.service'
import { Order } from './models/order.model'
import { ValidationPipe } from '@nestjs/common'
import { ShopifyOrderInput } from './dtos/shopify-order-input.dto'
import { PlaceOrderResponseDto } from './dtos/place-order-response.dto'
import { HttpService } from 'src/http/http.service'
import { BOA_GESTAO_INVENTORY_URL, BOA_GESTAO_PRODUCTS_URL } from 'src/constants/boa-gestao-urls'
import { ShopifyService } from 'src/shopify/shopify.service'
import { mergeProductsAndInventory } from 'src/utils/boa-gestao'
import { ProductsService } from 'src/products/services/products.service'
import { FeedDatabaseResponseDto } from './dtos/feed-database-response.dto'
import { SubscribeToOrderPaidWebhookResponseDto } from './dtos/subscribe-to-order.dto'

@Resolver(() => Order)
export class OrdersResolver {
  constructor(
    private ordersService: OrdersService,
    private httpService: HttpService,
    private shopifyService: ShopifyService,
    private productsService: ProductsService,
  ) {}

  @Mutation(() => PlaceOrderResponseDto)
  async placeOrder(
    @Args('shopifyOrderInput', new ValidationPipe({ transform: true }))
    shopifyOrderInput: ShopifyOrderInput,
  ) {
    return this.ordersService.placeOrder(shopifyOrderInput)
  }

  @Mutation(() => SubscribeToOrderPaidWebhookResponseDto)
  async subscribeToOrderPaidWebhook() {
    return this.shopifyService.subscribeToOrderPaidWebhook('http://localhost:4000/orders/paid')
  }

  // @Query(() => FeedDatabaseResponseDto)
  // async feedDatabase() {
  //   try {
  //     console.info('Fetching products...')
  //     const headers = {
  //       Authorization: `Bearer ${process.env.BOA_GESTAO_API_KEY}`,
  //     }

  //     const boaGestaoProducts = await this.httpService.get<BoaGestaoProductsResponse>(
  //       BOA_GESTAO_PRODUCTS_URL,
  //       {
  //         headers,
  //       },
  //     )

  //     // Filter products by SKU for testing purposes
  //     const filteredProducts = boaGestaoProducts.data.rows.filter(
  //       (product) =>
  //         product.SKU === 'ECT24 glow' ||
  //         product.SKU === 'ECL24 ELITE glow' ||
  //         product.SKU === '25501' ||
  //         product.SKU === '25500',
  //     )

  //     const boaGestaoInventory = await this.httpService.get<BoaGestaoInventoryResponse>(
  //       BOA_GESTAO_INVENTORY_URL,
  //       {
  //         headers,
  //       },
  //     )

  //     const shopifyProductVariants = await this.shopifyService.fetchProductsVariants()

  //     const mergedProducts = mergeProductsAndInventory({
  //       boaGestaoProducts: filteredProducts,
  //       boaGestaoInventoryRows: boaGestaoInventory.data.rows,
  //       shopifyProductVariants: shopifyProductVariants,
  //     })

  //     await this.productsService.upsertProduct(mergedProducts)
  //     await this.shopifyService.updateStockLevels(mergedProducts)

  //     return {
  //       status: 200,
  //       message: 'Database fed successfully',
  //     }
  //   } catch (error) {
  //     console.error('Error while feeding database', error)
  //     return {
  //       status: 500,
  //       message: 'Error while feeding database',
  //     }
  //   }
  // }
}
