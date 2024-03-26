import { Injectable } from '@nestjs/common'
import { OrderInput } from './dtos/order-input.dto'
import { BoagestaoService } from 'src/boagestao/boagestao.service'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class OrdersService {
  constructor(
    private boaGestaoService: BoagestaoService,
    private prismaService: PrismaService,
  ) {}

  async placeOrder(orderInput: OrderInput) {
    const fractionedItems = orderInput.items.map(async (orderItem) => {
      const findOrderItem = await this.prismaService.findProductBySku(orderItem.sku)
      const isFractioned = findOrderItem.isFractioned

      if (!isFractioned) return

      return findOrderItem
    })

    const fractionedItemsResolved = await Promise.all(fractionedItems)

    await this.boaGestaoService.placeOrder(orderInput)
  }
}
