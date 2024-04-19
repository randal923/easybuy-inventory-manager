import { Module, Global } from '@nestjs/common'
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client/core'
import fetch from 'cross-fetch'

const apolloClientProvider = {
  provide: 'APOLLO_CLIENT',
  useFactory: () => {
    return new ApolloClient({
      link: new HttpLink({
        uri: process.env.SHOPIFY_API_URL,
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_KEY,
        },
        fetch,
      }),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'network-only',
          errorPolicy: 'ignore',
        },
        query: {
          fetchPolicy: 'network-only',
          errorPolicy: 'all',
        },
      },
    })
  },
}

@Global()
@Module({
  providers: [apolloClientProvider],
  exports: [apolloClientProvider],
})
export class ApolloClientModule {}
