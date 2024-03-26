import { Module } from '@nestjs/common'
import { OrdersService } from './orders.service'

import { BoagestaoService } from 'src/boagestao/boagestao.service'
import { HttpService } from 'src/http/http.service'
import { PrismaService } from 'src/prisma/prisma.service'

@Module({
  providers: [OrdersService, BoagestaoService, HttpService, PrismaService],
})
export class OrdersModule {}
