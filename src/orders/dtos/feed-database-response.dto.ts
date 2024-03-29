import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class FeedDatabaseResponseDto {
  @Field(() => Number)
  status: number

  @Field(() => String)
  message: string
}
