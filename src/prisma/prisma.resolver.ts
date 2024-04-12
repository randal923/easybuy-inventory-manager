import { Resolver, Mutation, Args } from '@nestjs/graphql'
import { PrismaService } from './prisma.service'
import { Product } from '@src/products/models/product.model'
import { SetProductFractionedQuantityInput } from './dto/set-product-fractioned-quantity.dto'

@Resolver(() => Product)
export class PrismaResolver {
  constructor(private productsService: PrismaService) {}

  @Mutation(() => Product)
  async setProductFractionedQuantity(
    @Args('SetProductFractionedQuantityInput')
    setProductFractionedQuantityInput: SetProductFractionedQuantityInput,
  ) {
    const { sku, fractionedQuantity } = setProductFractionedQuantityInput

    return this.productsService.updateProductFractionedQuantity({
      sku,
      fractionedQuantity,
    })
  }
}
