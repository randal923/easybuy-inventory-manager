import { Module } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { BoagestaoService } from 'src/boagestao/boagestao.service'
import { HttpService } from 'src/http/http.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { OrdersController } from './orders.controller'

@Module({
  providers: [OrdersService, BoagestaoService, HttpService, PrismaService],
  controllers: [OrdersController],
})
export class OrdersModule {}
