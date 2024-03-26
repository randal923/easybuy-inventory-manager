import { Module } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { OrdersController } from './orders.controller'
import { BoagestaoService } from 'src/boagestao/boagestao.service'
import { HttpService } from 'src/http/http.service'

@Module({
  providers: [OrdersService, BoagestaoService, HttpService],
  controllers: [OrdersController],
})
export class OrdersModule {}
