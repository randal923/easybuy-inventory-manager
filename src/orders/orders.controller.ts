import { Controller, Post } from '@nestjs/common'

@Controller('orders')
export class OrdersController {
  @Post('place-order')
  create() {
    return 'This action adds a new order'
  }
}
