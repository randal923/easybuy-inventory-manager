import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { join } from 'path'
import { ProductsModule } from './products/products.module'
import { ProductsResolver } from './products/produts.resolver'
import { ProductsService } from './products/services/products.service'
import { ApolloClientModule } from './apollo/apollo-client.module'
import { ScheduleModule } from '@nestjs/schedule'
import { SchedulerService } from './scheduler/scheduler.service'
import { HttpService } from './http/http.service'
import { PrismaService } from './prisma/prisma.service'
import { ShopifyService } from './shopify/shopify.service'
import { OrdersModule } from './orders/orders.module'
import { BoagestaoService } from './boagestao/boagestao.service'
import { BoagestaoModule } from './boagestao/boagestao.module'
import { OrdersResolver } from './orders/orders.resolver'
import { OrdersService } from './orders/orders.service'
import { PrismaResolver } from './prisma/prisma.resolver'

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    }),
    ProductsModule,
    ApolloClientModule,
    ScheduleModule.forRoot(),
    OrdersModule,
    BoagestaoModule,
  ],
  controllers: [],
  providers: [
    ProductsService,
    ProductsResolver,
    OrdersResolver,
    OrdersService,
    SchedulerService,
    HttpService,
    PrismaResolver,
    PrismaService,
    ShopifyService,
    BoagestaoService,
  ],
})
export class AppModule {}
