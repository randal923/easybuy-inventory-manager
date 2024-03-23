import { ApolloClient } from '@apollo/client/core'
import { Inject, Injectable } from '@nestjs/common'
import { fetchProductsQuery, productQuantityMutation } from 'src/graphql/queries/products'

@Injectable()
export class ShopifyService {
  constructor(@Inject('APOLLO_CLIENT') private apolloClient: ApolloClient<any>) {}

  async updateStockLevels(mergedBoaGestaoProducts: MergedBoaGestaoProduct[]) {
    const shopifyProductVariants = await this.fetchProductsVariants()

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

  async updateProduct(
    shopifyProductVariant: VariantNode,
    mergedBoaGestaoProducts: MergedBoaGestaoProduct[],
  ) {
    const boaGestaoProduct = mergedBoaGestaoProducts.find(
      (boaGestaoProduct) => boaGestaoProduct.sku === shopifyProductVariant.sku,
    )

    if (!boaGestaoProduct) return
    // console.log('Boa gestao product:', boaGestaoProduct)
    // console.log('shopifyProductVariant', shopifyProductVariant)

    const currentStock = boaGestaoProduct?.currentStock
    const inventoryQuantity = shopifyProductVariant.inventoryQuantity
    console.log('currentStock', currentStock)
    console.log('inventoryQuantity', inventoryQuantity)

    if (currentStock === inventoryQuantity) return

    const delta = Math.round(currentStock - inventoryQuantity)

    console.log('delta', delta)
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
