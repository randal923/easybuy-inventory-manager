import { ApolloClient } from '@apollo/client/core'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { MergedProduct, ProductWithoutId } from 'src/@types/prisma'
import {
  fetchProductsQuery,
  productQuantityMutation,
  updateProductVariant,
} from 'src/shopify/queries/products'
import { subscribeToOrderPaidMutation } from './queries/orders'

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name)
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

      const delta = () => {
        if (isFractioned) {
          return Math.floor(
            boaGestaoCurrentStock * packageQuantity +
              fractionedQuantity -
              shopifyLaggingStock,
          )
        }

        return Math.floor(boaGestaoCurrentStock - shopifyLaggingStock)
      }

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

  async updateProductVariantsPrices(
    shopifyProductVariants: VariantNode[],
    mergedProducts: ProductWithoutId[],
  ) {
    for (const mergedProduct of mergedProducts) {
      const shopifyVariant = shopifyProductVariants.find(
        (variant) => variant.sku === mergedProduct.sku,
      )

      if (!shopifyVariant) {
        this.logger.error(`Product with SKU ${mergedProduct.sku} not found in Shopify`)
        continue
      }

      const shopifyVariantPrice = Number(shopifyVariant.price)
      const shopifyVariantCost = Number(shopifyVariant.inventoryItem.unitCost.amount)

      if (
        shopifyVariantPrice === mergedProduct.unityPrice &&
        shopifyVariantCost === mergedProduct.unityCost
      ) {
        continue
      }

      if (shopifyVariantPrice !== mergedProduct.unityPrice) {
        this.logger.log(
          `Updating price of ${shopifyVariant.title} to ${mergedProduct.unityPrice}`,
        )
      }

      if (shopifyVariantCost !== mergedProduct.unityCost) {
        this.logger.log(
          `Updating cost of ${shopifyVariant.title} to ${mergedProduct.unityCost}`,
        )
      }

      await this.apolloClient.mutate({
        mutation: updateProductVariant,
        variables: {
          input: {
            id: shopifyVariant.id,
            price: mergedProduct.unityPrice.toString(),
            inventoryItem: {
              cost: mergedProduct.unityCost.toString(),
            },
          },
        },
      })
    }
  }

  // async fetchProductsVariants() {
  //   try {
  //     const { data }: ShopifyApiResponse = await this.apolloClient.query({
  //       query: fetchProductsQuery,
  //     })

  //     const productVariants = data.products.edges.flatMap((edge: ShopifyProductEdge) => {
  //       const product = edge.node
  //       const variants = product.variants.edges

  //       return variants.map((variant: VariantEdge) => {
  //         const variantTitle =
  //           variant.node.title === 'Default Title' ? product.title : variant.node.title

  //         return {
  //           ...variant.node,
  //           title: variantTitle,
  //         }
  //       })
  //     })

  //     return productVariants
  //   } catch (error) {
  //     this.logger.error('Error fetching products from Shopify:', error)
  //     throw new Error('Failed to fetch products from Shopify')
  //   }
  // }

  async fetchProductsVariants() {
    const allProductVariants: VariantNode[] = []
    let hasNextPage = true
    let endCursor = null

    while (hasNextPage) {
      try {
        const response: ShopifyApiResponse = await this.apolloClient.query({
          query: fetchProductsQuery,
          variables: { after: endCursor },
        })

        const products = response.data.products.edges
        const pageInfo = response.data.products.pageInfo

        products.forEach((edge) => {
          const product = edge.node
          const variants = product.variants.edges

          variants.forEach((variantEdge) => {
            const variant = variantEdge.node
            const variantTitle =
              variant.title === 'Default Title' ? product.title : variant.title

            allProductVariants.push({
              ...variant,
              title: variantTitle,
            })
          })
        })

        hasNextPage = pageInfo.hasNextPage
        endCursor = pageInfo.endCursor
      } catch (error) {
        this.logger.error('Error fetching products from Shopify:', error)
        throw new Error('Failed to fetch products from Shopify')
      }
    }

    return allProductVariants
  }

  async updateProductVariantPrice(variantId: string, price: number) {
    try {
      const response = await this.apolloClient.mutate({
        mutation: updateProductVariant,
        variables: {
          input: {
            id: variantId,
            price: price.toString(),
          },
        },
      })

      return response.data
    } catch (error) {
      this.logger.error('Error updating product variant price:', error)
      throw new Error('Failed to update product variant price')
    }
  }
}
