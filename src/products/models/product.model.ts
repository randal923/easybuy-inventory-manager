import { Field, Int, ObjectType, Float } from '@nestjs/graphql'

@ObjectType()
export class Product {
  @Field(() => Int)
  id: number

  @Field(() => Int)
  type: number

  @Field()
  description: string

  @Field({ nullable: true })
  barcode: string

  @Field()
  sku: string

  @Field()
  manufacturer: string

  @Field(() => Int)
  groupId: number

  @Field()
  group: string

  @Field(() => Int)
  mainCategoryId: number

  @Field()
  mainCategory: string

  @Field()
  unit: string

  @Field(() => Float)
  priceInView: number

  @Field(() => Float)
  priceOnTerm: number

  @Field(() => Int)
  highlight: number

  @Field(() => Int)
  fractioned: number

  @Field(() => Int)
  packageQuantity: number

  @Field({ nullable: true })
  itemUnit: string

  @Field(() => Int)
  imageId: number

  @Field()
  imageUrl: string

  @Field(() => Int)
  currentStock: number

  @Field(() => Int)
  entryForecast: number

  @Field(() => Int)
  exitForecast: number
}
