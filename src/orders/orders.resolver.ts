import { Resolver, Mutation, Args } from '@nestjs/graphql'
import { OrdersService } from './orders.service'
import { Order } from './models/order.model'
import { ValidationPipe } from '@nestjs/common'
import { ShopifyOrderInput } from './dtos/shopify-order-input.dto'
import { PlaceOrderResponseDto } from './dtos/place-order-response.dto'
import { HttpService } from 'src/http/http.service'
import { ShopifyService } from 'src/shopify/shopify.service'
import { ProductsService } from 'src/products/services/products.service'
import { SubscribeToOrderPaidWebhookResponseDto } from './dtos/subscribe-to-order.dto'
import { PrismaService } from '@src/prisma/prisma.service'

@Resolver(() => Order)
export class OrdersResolver {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly httpService: HttpService,
    private readonly shopifyService: ShopifyService,
    private readonly productsService: ProductsService,
    private readonly prismaService: PrismaService,
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
    return this.shopifyService.subscribeToOrderPaidWebhook(
      'http://localhost:4000/orders/paid',
    )
  }
}
