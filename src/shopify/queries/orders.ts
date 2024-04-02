import { gql } from '@apollo/client/core'

export const subscribeToOrderPaidMutation = gql`
  mutation webhookSubscriptionCreate($callbackUrl: String!) {
    webhookSubscriptionCreate(
      topic: ORDERS_PAID
      webhookSubscription: { callbackUrl: $callbackUrl, format: JSON }
    ) {
      userErrors {
        field
        message
      }
      webhookSubscription {
        id
      }
    }
  }
`
