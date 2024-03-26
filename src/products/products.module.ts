import { Module } from '@nestjs/common'
import { ProductsService } from './services/products.service'
import { PrismaService } from 'src/prisma/prisma.service'
@Module({
  providers: [ProductsService, PrismaService],
})
export class ProductsModule {}
