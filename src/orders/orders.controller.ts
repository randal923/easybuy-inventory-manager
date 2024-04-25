import { Body, Controller, Post } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { PrismaService } from 'src/prisma/prisma.service'

@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private prismaService: PrismaService,
  ) {}

  onModuleInit() {
    setInterval(() => this.processOrders(), 10000)
  }

  @Post('paid')
  async enqueueOrders(@Body() body: OrderPaid) {
    console.log('Received order request', body)
    await this.prismaService.enqueueOrder(body)
    return { message: 'Order enqueued successfully!' }
  }

  async processOrders() {
    const orders = await this.prismaService.fetchUnprocessedOrders(2)
    orders.forEach(async (order) => {
      if (!order) return
      const orderData = JSON.parse(order.orderData) as OrderPaid
      const skus: string[] = orderData.line_items.map((item) => item.sku)
      const productsInDb = await this.prismaService.findProductsBySkus(skus)
      const productsWithMetafields = orderData.line_items.map((product) => {
        const productInDb = productsInDb.find(
          (productInDb) => product.sku === productInDb.sku,
        )
        return {
          ...product,
          isFractioned: productInDb.isFractioned,
          isZap: productInDb.isZap,
          isPanebras: productInDb.isPanebras,
        }
      })

      const shopifyOrderInput = {
        products: productsWithMetafields,
      }

      await this.ordersService.placeOrder(shopifyOrderInput)
      await this.prismaService.markOrderAsProcessed(order.id)
    })
  }
}
