import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
class UserError {
  @Field(() => String, { nullable: true })
  field?: string

  @Field(() => String, { nullable: false })
  message: string
}

@ObjectType()
class WebhookSubscription {
  @Field(() => String, { nullable: true })
  id?: string
}

@ObjectType()
class WebhookSubscriptionCreateResponse {
  @Field(() => [UserError], { nullable: 'itemsAndList' })
  userErrors: UserError[]

  @Field(() => WebhookSubscription, { nullable: true })
  webhookSubscription?: WebhookSubscription
}

@ObjectType()
export class SubscribeToOrderPaidWebhookResponseDto {
  @Field(() => WebhookSubscriptionCreateResponse, { nullable: false })
  webhookSubscriptionCreate: WebhookSubscriptionCreateResponse
}
