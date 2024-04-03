import { Test, TestingModule } from '@nestjs/testing'
import { OrdersService } from '../orders/orders.service'
import { BoagestaoService } from '../boagestao/boagestao.service'
import { ShopifyOrderInput } from './dtos/shopify-order-input.dto'
import { PrismaService } from '../prisma/prisma.service'

describe('OrdersService', () => {
  let orderService: OrdersService

  beforeEach(async () => {
    const mockBoagestaoService = {
      findProductsBySkus: jest.fn().mockResolvedValue([
        { SKU: 'SKU123', name: 'Product 1' },
        { SKU: 'SKU456', name: 'Product 2' },
      ]),
    }

    const mockPrismaService = {}

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: BoagestaoService, useValue: mockBoagestaoService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile()

    orderService = module.get<OrdersService>(OrdersService)
  })

  it('should be defined', () => {
    expect(orderService).toBeDefined()
  })

  it('should get SKUs from order input', () => {
    const mockShopifyOrderInput: ShopifyOrderInput = {
      products: [
        { sku: 'SKU123', quantity: 1, isFractioned: false },
        { sku: 'SKU45624', quantity: 2, isFractioned: true },
      ],
    }

    const skus = orderService.getProductsSkus(mockShopifyOrderInput)

    expect(skus).toEqual(['SKU123', 'SKU45624'])
  })

  it('should fetch products correctly by SKUs', async () => {
    const mockShopifyOrderInput: ShopifyOrderInput = {
      products: [
        { sku: 'SKU123', quantity: 1, isFractioned: false },
        { sku: 'SKU45624', quantity: 2, isFractioned: true },
      ],
    }

    const products = await orderService.placeOrder(mockShopifyOrderInput)

    expect(products).toHaveLength(2)
    expect(products).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ SKU: 'SKU123', name: 'Product 1' }),
        expect.objectContaining({ SKU: 'SKU456', name: 'Product 2' }),
      ]),
    )
  })
})
