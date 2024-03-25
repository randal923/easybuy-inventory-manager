import { gql } from '@apollo/client/core'

export const fetchProductsQuery = gql`
  {
    products(first: 200) {
      edges {
        node {
          id
          title
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
                metafields(first: 20) {
                  edges {
                    node {
                      key
                      value
                    }
                  }
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
