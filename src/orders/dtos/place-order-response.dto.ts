import { Field, Int, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class PlaceOrderResponseDto {
  @Field(() => String, { nullable: true })
  iat: string

  @Field(() => String, { nullable: true })
  id: string

  @Field(() => Int, { nullable: true })
  status: number

  @Field(() => String, { nullable: true })
  message: string
}
