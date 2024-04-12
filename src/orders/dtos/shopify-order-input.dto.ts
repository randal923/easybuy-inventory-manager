import { InputType, Field, Int } from '@nestjs/graphql'
import { IsBoolean, IsInt, IsString } from 'class-validator'

@InputType()
export class ShopifyOrderInput {
  @Field(() => [ShopifyProductInput])
  products: ShopifyProductInput[]
}

@InputType()
export class ShopifyProductInput {
  @Field(() => String)
  @IsString()
  sku: string

  @Field(() => Int)
  @IsInt()
  quantity: number

  @Field(() => Boolean)
  @IsBoolean()
  isFractioned: boolean

  @Field(() => Boolean)
  @IsBoolean()
  isZap: boolean

  @Field(() => Boolean)
  @IsBoolean()
  isPanebras: boolean
}
