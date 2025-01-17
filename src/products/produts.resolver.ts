import { Resolver, Query } from '@nestjs/graphql'
import { ProductsService } from './services/products.service'
import { Product } from './models/product.model'

@Resolver(() => Product)
export class ProductsResolver {
  constructor(private productsService: ProductsService) {}

  @Query(() => [Product])
  async products() {}
}
