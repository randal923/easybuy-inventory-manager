import { ApolloClient } from '@apollo/client/core'
import { Inject, Injectable } from '@nestjs/common'
import { MergedProduct } from 'src/@types/prisma'
import { fetchProductsQuery, productQuantityMutation } from 'src/shopify/queries/products'
import { subscribeToOrderPaidMutation } from './queries/orders'

@Injectable()
export class ShopifyService {
  constructor(@Inject('APOLLO_CLIENT') private apolloClient: ApolloClient<any>) {}

  async subscribeToOrderPaidWebhook(callbackUrl: string): Promise<any> {
    const response = await this.apolloClient.mutate({
      mutation: subscribeToOrderPaidMutation,
      variables: {
        callbackUrl: callbackUrl,
      },
    })

    return response.data
  }

  async updateStockLevels(mergedProducts: MergedProduct[]) {
    for (const mergedProduct of mergedProducts) {
      const {
        isFractioned,
        inventoryItemId,
        boaGestaoCurrentStock,
        shopifyLaggingStock,
        packageQuantity,
        fractionedQuantity,
      } = mergedProduct
      console.log(mergedProduct)

      const delta = () => {
        if (isFractioned) {
          return (
            boaGestaoCurrentStock * packageQuantity +
            fractionedQuantity -
            Math.abs(shopifyLaggingStock)
          )
        }

        return boaGestaoCurrentStock - Math.abs(shopifyLaggingStock)
      }

      console.log(delta())
      await this.apolloClient.mutate({
        mutation: productQuantityMutation,
        variables: {
          input: {
            reason: 'correction',
            name: 'available',
            changes: [
              {
                inventoryItemId: inventoryItemId,
                locationId: 'gid://shopify/Location/94867161382',
                delta: delta(),
              },
            ],
          },
        },
      })
    }
  }

  async fetchProductsVariants() {
    try {
      const { data }: ShopifyApiResponse = await this.apolloClient.query({
        query: fetchProductsQuery,
      })

      const productVariants = data.products.edges.flatMap((edge: ShopifyProductEdge) => {
        const product = edge.node
        const variants = product.variants.edges

        return variants.map((variant: VariantEdge) => {
          const variantTitle =
            variant.node.title === 'Default Title' ? product.title : variant.node.title

          return {
            ...variant.node,
            title: variantTitle,
          }
        })
      })

      return productVariants
    } catch (error) {
      console.error('Error fetching products from Shopify:', error)
      throw new Error('Failed to fetch products from Shopify')
    }
  }
}
