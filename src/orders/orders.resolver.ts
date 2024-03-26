import { Resolver, Mutation, Args } from '@nestjs/graphql'
import { OrdersService } from './orders.service'
import { Order } from './models/order.model'
import { ValidationPipe } from '@nestjs/common'
import { ShopifyOrderInput } from './dtos/shopify-order-input.dto'

@Resolver(() => Order)
export class OrdersResolver {
  constructor(private ordersService: OrdersService) {}

  @Mutation(() => Order)
  async placeOrder(
    @Args('orderInput', new ValidationPipe({ transform: true }))
    shopifyOrderInput: ShopifyOrderInput,
  ) {
    return this.ordersService.placeOrder(shopifyOrderInput)
  }
}
