import { Test, TestingModule } from '@nestjs/testing'
import { GraphQLService } from './graphql.service'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'

describe('GraphQLService', () => {
  let service: GraphQLService
  let mockApolloClient: ApolloClient<any>

  beforeEach(async () => {
    const queryMock = jest.fn().mockResolvedValue({
      data: {
        products: {
          edges: [
            {
              node: {
                id: '1',
                title: 'Test Product',
                descriptionHtml: '<p>Test Description</p>',
                images: {
                  edges: [
                    {
                      node: {
                        src: 'http://example.com/test.jpg',
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    })

    mockApolloClient = new ApolloClient({
      cache: new InMemoryCache(),
      link: {
        request: queryMock,
      } as any,
    })
    mockApolloClient.query = queryMock

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphQLService,
        {
          provide: 'APOLLO_CLIENT',
          useValue: mockApolloClient,
        },
      ],
    }).compile()

    service = module.get<GraphQLService>(GraphQLService)
  })

  it('should fetch products successfully', async () => {
    const products = await service.fetchProducts()
    expect(products).toHaveLength(1)
    expect(products[0].title).toEqual('Test Product')
    expect(mockApolloClient.query).toHaveBeenCalled()
  })
})
