import { gql } from '@apollo/client/core'

export const fetchProductsQuery = gql`
  query fetchProducts($after: String) {
    products(first: 200, after: $after) {
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
                price
                inventoryQuantity
                sku
                inventoryItem {
                  id
                  unitCost {
                    amount
                  }
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
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
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

export const updateProductVariant = gql`
  mutation productVariantUpdate($input: ProductVariantInput!) {
    productVariantUpdate(input: $input) {
      productVariant {
        id
        price
      }
      userErrors {
        field
        message
      }
    }
  }
`
