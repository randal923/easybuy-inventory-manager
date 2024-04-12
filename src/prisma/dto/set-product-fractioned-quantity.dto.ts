import { InputType, Field, Int } from '@nestjs/graphql'
import { IsInt, IsString } from 'class-validator'

@InputType()
export class SetProductFractionedQuantityInput {
  @Field(() => String)
  @IsString()
  sku: string

  @Field(() => Int)
  @IsInt()
  fractionedQuantity: number
}
