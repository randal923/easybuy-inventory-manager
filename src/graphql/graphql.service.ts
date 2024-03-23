import { Injectable, Inject } from '@nestjs/common'
import { ApolloClient } from '@apollo/client/core'
import { fetchProductsQuery } from './queries/products'

@Injectable()
export class GraphQLService {
  constructor(@Inject('APOLLO_CLIENT') private apolloClient: ApolloClient<any>) {}

  async fetchProducts(): Promise<ShopifyApiResponse> {
    try {
      const { data } = await this.apolloClient.query({
        query: fetchProductsQuery,
      })

      return data.products.edges.map((edge: any) => edge.node)
    } catch (error) {
      console.error('Error fetching products from Shopify:', error)
      throw new Error('Failed to fetch products from Shopify')
    }
  }
}
