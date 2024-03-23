import { Resolver, Query } from '@nestjs/graphql'
import { ProductsService } from './services/products.service'
import { Product } from './product.model'

@Resolver(() => Product)
export class ProductsResolver {
  constructor(private productsService: ProductsService) {}

  @Query(() => [Product])
  async products() {
    return this.productsService.getAllProducts()
  }
}
