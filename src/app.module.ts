import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { join } from 'path'
import { ProductsModule } from './products/products.module'
import { ProductsResolver } from './products/produts.resolver'
import { ProductsService } from './products/products.service'

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    }),
    ProductsModule,
  ],
  controllers: [],
  providers: [ProductsService, ProductsResolver],
})
export class AppModule {}
