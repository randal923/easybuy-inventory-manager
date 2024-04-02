import { Body, Controller, Post } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { PrismaService } from 'src/prisma/prisma.service'

@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private prismaService: PrismaService,
  ) {}

  @Post('paid')
  async handleOrderPaid(@Body() body: OrderPaid) {
    const skus: string[] = body.line_items.map((item) => item.sku)
    const productsInDb = await this.prismaService.findProductsBySkus(skus)
    const productsWithMetafields = body.line_items.map((product) => {
      const productInDb = productsInDb.find((productInDb) => product.sku === productInDb.sku)
      return {
        ...product,
        isFractioned: productInDb.isFractioned,
      }
    })

    const shopifyOrderInput = {
      products: productsWithMetafields,
    }

    return this.ordersService.placeOrder(shopifyOrderInput)
  }
}
