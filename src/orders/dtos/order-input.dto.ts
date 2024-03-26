import { InputType, Field, Int, Float } from '@nestjs/graphql'
import { IsString, IsInt, IsNumber } from 'class-validator'

@InputType()
export class OrderInput {
  @Field(() => Date)
  dateTime: Date

  @Field(() => Int)
  clientId: number

  @Field(() => Float)
  totalProducts: number

  @Field(() => Float)
  total: number

  @Field(() => [ItemsInput])
  items: ItemsInput[]
}

@InputType()
export class ItemsInput {
  @Field(() => String)
  @IsString()
  productId: string

  @Field(() => String)
  @IsString()
  sku: string

  @Field(() => String)
  @IsString()
  unity: string

  @Field(() => Int)
  @IsInt()
  quantity: number

  @Field(() => Float)
  @IsNumber()
  unityPrice: number

  @Field(() => Float)
  @IsNumber()
  totalItem: number

  @Field(() => Float)
  @IsNumber()
  total: number
}
