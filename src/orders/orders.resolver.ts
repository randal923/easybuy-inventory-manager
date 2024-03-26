import { Resolver, Mutation, Args } from '@nestjs/graphql'
import { OrdersService } from './orders.service'
import { Order } from './models/order.model'
import { OrderInput } from './dtos/order-input.dto'
import { ValidationPipe } from '@nestjs/common'

@Resolver(() => Order)
export class ProductsResolver {
  constructor(private ordersService: OrdersService) {}

  @Mutation(() => Order)
  async placeOrder(
    @Args('orderInput', new ValidationPipe({ transform: true })) orderInput: OrderInput,
  ) {
    return this.ordersService.placeOrder(orderInput)
  }
}
