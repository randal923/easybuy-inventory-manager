import { gql } from '@apollo/client/core'

export const fetchProductsQuery = gql`
  {
    products(first: 200) {
      edges {
        node {
          id
          title
          tags
          totalInventory
          tracksInventory
          variants(first: 100) {
            edges {
              node {
                id
                title
                inventoryQuantity
                sku
                inventoryItem {
                  id
                }
              }
            }
          }
        }
      }
    }
  }
`

export const productQuantityMutation = gql`
  mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
    inventoryAdjustQuantities(input: $input) {
      inventoryAdjustmentGroup {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`
