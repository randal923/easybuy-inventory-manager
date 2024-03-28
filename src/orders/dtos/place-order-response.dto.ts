import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class PlaceOrderResponseDto {
  @Field(() => String)
  iat: string

  @Field(() => String)
  id: string
}
