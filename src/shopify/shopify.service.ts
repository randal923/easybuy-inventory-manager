import { ApolloClient } from '@apollo/client/core'
import { Inject, Injectable } from '@nestjs/common'
import { MergedProduct } from 'src/@types/prisma'
import { fetchProductsQuery, productQuantityMutation } from 'src/shopify/queries/products'

@Injectable()
export class ShopifyService {
  constructor(@Inject('APOLLO_CLIENT') private apolloClient: ApolloClient<any>) {}

  async updateStockLevels(
    mergedBoaGestaoProducts: MergedProduct[],
    shopifyProductVariants: VariantNode[],
  ) {
    for (const shopifyProductVariant of shopifyProductVariants) {
      await this.updateProduct(shopifyProductVariant, mergedBoaGestaoProducts)
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

  async updateProduct(shopifyProductVariant: VariantNode, mergedProducts: MergedProduct[]) {
    const boaGestaoProduct = mergedProducts.find(
      (boaGestaoProduct) => boaGestaoProduct.sku === shopifyProductVariant.sku,
    )

    if (!boaGestaoProduct) return

    const currentStock = boaGestaoProduct?.currentStock
    const inventoryQuantity = shopifyProductVariant.inventoryQuantity

    if (currentStock === inventoryQuantity) return

    const delta = Math.round(currentStock - inventoryQuantity)

    await this.apolloClient.mutate({
      mutation: productQuantityMutation,
      variables: {
        input: {
          reason: 'correction',
          name: 'available',
          changes: [
            {
              inventoryItemId: shopifyProductVariant.inventoryItem.id,
              locationId: 'gid://shopify/Location/94867161382',
              delta: delta,
            },
          ],
        },
      },
    })
  }
}
