import { Field, Int, ObjectType, Float } from '@nestjs/graphql'
import { Type } from 'class-transformer'
import { IsArray, IsInt, IsNumber, IsString, ValidateNested } from 'class-validator'

@ObjectType()
export class Order {
  @Field(() => Date)
  dateTime: Date

  @Field(() => Int)
  clientId: number

  @Field(() => Float)
  totalProducts: number

  @Field(() => Float)
  total: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Items)
  items: Items[]
}

@ObjectType()
export class Items {
  @Field()
  @IsString()
  productId: string

  @Field()
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
