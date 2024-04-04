import { Test, TestingModule } from '@nestjs/testing'
import { OrdersService } from '../orders/orders.service'
import { BoagestaoService } from '../boagestao/boagestao.service'
import { PrismaService } from '../prisma/prisma.service'
import { ShopifyOrderInput } from './dtos/shopify-order-input.dto'
import { Product } from '@prisma/client'
const mockBoaGestaoProducts: BoaGestaoProduct[] = [
  {
    Id: 1,
    Tipo: 2,
    Descricao: 'Product 1',
    CodigoBarras: '1234567890123',
    SKU: 'SKU123',
    Fabricante: 'Manufacturer1',
    GrupoId: 101,
    Grupo: 'Group1',
    CategoriaPrincipalId: 201,
    CategoriaPrincipal: 'Category1',
    Unidade: 'Un',
    PrecoVista: 50.5,
    PrecoPrazo: 55,
    Destaque: 0,
    Fracionado: 0,
    QuantidadePacote: 20,
    UnidadeItem: null,
    ImagemId: null,
    ImagemURL: null,
  },
]
const nonFractionedProduct: Product = {
  id: 1,
  sku: 'SKU123',
  packageQuantity: 20,
  fractionedQuantity: 0,
  shopifyCurrentStock: 30,
  boaGestaoCurrentStock: 30,
  inventoryItemId: 'inventoryItemId',
  isFractioned: false,
  isZap: true,
  isPanebras: false,
}

const fractionedProduct: Product = {
  id: 2,
  sku: 'EBSKU123',
  packageQuantity: 20,
  fractionedQuantity: 5,
  shopifyCurrentStock: 605,
  boaGestaoCurrentStock: 30,
  inventoryItemId: 'inventoryItemId2',
  isFractioned: true,
  isZap: true,
  isPanebras: false,
}

describe('OrdersService', () => {
  let ordersService: OrdersService
  let prismaService: PrismaService

  beforeEach(async () => {
    jest.clearAllMocks()
    const mockBoagestaoService = {
      findProductsBySkus: jest
        .fn()
        .mockResolvedValue([{ SKU: 'SKU123' }, { SKU: 'SKU456' }]),
    }

    const mockPrismaService = {
      findProductBySku: jest.fn().mockImplementation((sku) => {
        if (sku === 'SKU123') return nonFractionedProduct
        if (sku === 'EBSKU123') return fractionedProduct
      }),
      updateProductFractionedQuantity: jest.fn(),
      updateShopifyCurrentStock: jest.fn(),
      updateBoaGestaoCurrentStock: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: BoagestaoService, useValue: mockBoagestaoService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile()

    ordersService = module.get<OrdersService>(OrdersService)
    prismaService = module.get<PrismaService>(PrismaService)
  })

  it('should be defined', () => {
    expect(ordersService).toBeDefined()
  })

  it('should correctly generate order input for 1 product', async () => {
    const mockShopifyOrderInput: ShopifyOrderInput = {
      products: [{ sku: 'SKU123', quantity: 1, isFractioned: false }],
    }

    const result = await ordersService.getOrderInput(
      mockBoaGestaoProducts,
      mockShopifyOrderInput,
    )

    expect(result).toEqual({
      dateTime: expect.any(String),
      clientId: 26,
      totalProducts: 50.5,
      total: 50.5,
      items: [
        {
          productId: 1,
          quantity: 1,
          sku: 'SKU123',
          total: 50.5,
          totalItem: 50.5,
          unity: 'Un',
          unityPrice: 50.5,
        },
      ],
    })
  })

  it('should correctly merged similar products in order input', async () => {
    const mockShopifyOrderInput: ShopifyOrderInput = {
      products: [
        { sku: 'SKU123', quantity: 1, isFractioned: false },
        { sku: 'EBSKU123', quantity: 15, isFractioned: true },
      ],
    }

    const result = await ordersService.getOrderInput(
      mockBoaGestaoProducts,
      mockShopifyOrderInput,
    )

    expect(result).toEqual({
      dateTime: expect.any(String),
      clientId: 26,
      totalProducts: 101,
      total: 101,
      items: [
        {
          productId: 1,
          quantity: 2,
          sku: 'SKU123',
          total: 101,
          totalItem: 101,
          unity: 'Un',
          unityPrice: 50.5,
        },
      ],
    })
  })

  it(`should return correct items for order with non fractioned products 
      and it should update the database correctly`, async () => {
    const shopifyOrderInput = {
      products: [{ sku: 'SKU123', quantity: 1, isFractioned: false }],
    }

    const result = await ordersService.getOrderItems(
      mockBoaGestaoProducts,
      shopifyOrderInput,
    )

    expect(prismaService.updateBoaGestaoCurrentStock).toHaveBeenCalledWith({
      sku: 'SKU123',
      boaGestaoCurrentStock: 29,
    })

    expect(prismaService.updateShopifyCurrentStock).toHaveBeenCalledWith({
      sku: 'SKU123',
      shopifyCurrentStock: 29,
    })

    expect(result).toEqual([
      {
        productId: 1,
        quantity: 1,
        sku: 'SKU123',
        total: 50.5,
        totalItem: 50.5,
        unity: 'Un',
        unityPrice: 50.5,
      },
    ])
  })

  it(`should return no items if product is fractioned 
      and there is enough items in open boxes`, async () => {
    const result = await ordersService.getOrderItems(mockBoaGestaoProducts, {
      products: [{ sku: 'EBSKU123', quantity: 1, isFractioned: true }],
    })

    expect(result).toEqual([])
  })

  it(`should only return non-fractioned items if order has fractioned 
      items and there is enough items in open boxes`, async () => {
    const result = await ordersService.getOrderItems(mockBoaGestaoProducts, {
      products: [
        { sku: 'SKU123', quantity: 4, isFractioned: false },
        { sku: 'EBSKU123', quantity: 1, isFractioned: true },
      ],
    })

    expect(result).toEqual([
      {
        productId: 1,
        quantity: 4,
        sku: 'SKU123',
        total: 202,
        totalItem: 202,
        unity: 'Un',
        unityPrice: 50.5,
      },
    ])
  })

  it(`should returm all items if fractioned items are not enough`, async () => {
    const result = await ordersService.getOrderItems(mockBoaGestaoProducts, {
      products: [
        { sku: 'SKU123', quantity: 1, isFractioned: false },
        { sku: 'EBSKU123', quantity: 10, isFractioned: true },
      ],
    })

    const expectedItem = {
      productId: 1,
      quantity: 1,
      sku: 'SKU123',
      total: 50.5,
      totalItem: 50.5,
      unity: 'Un',
      unityPrice: 50.5,
    }

    expect(result).toEqual([expectedItem, expectedItem])
  })

  it(`should calculate number of boxes needed for fractioned items
      and update database correctly`, async () => {
    const result = await ordersService.getOrderItems(mockBoaGestaoProducts, {
      products: [
        { sku: 'SKU123', quantity: 1, isFractioned: false },
        { sku: 'EBSKU123', quantity: 50, isFractioned: true },
      ],
    })

    expect(result).toEqual([
      {
        productId: 1,
        quantity: 1,
        sku: 'SKU123',
        total: 50.5,
        totalItem: 50.5,
        unity: 'Un',
        unityPrice: 50.5,
      },
      {
        productId: 1,
        quantity: 3,
        sku: 'SKU123',
        total: 151.5,
        totalItem: 151.5,
        unity: 'Un',
        unityPrice: 50.5,
      },
    ])

    expect(prismaService.updateProductFractionedQuantity).toHaveBeenCalledWith({
      sku: 'EBSKU123',
      fractionedQuantity: 15,
    })
    expect(prismaService.updateBoaGestaoCurrentStock).toHaveBeenCalledWith({
      sku: 'EBSKU123',
      boaGestaoCurrentStock: 27,
    })
    expect(prismaService.updateShopifyCurrentStock).toHaveBeenCalledWith({
      sku: 'EBSKU123',
      shopifyCurrentStock: 545,
    })
  })

  it(`should open new box if there is not enough fractioned items`, async () => {
    const result = await ordersService.getOrderItems(mockBoaGestaoProducts, {
      products: [
        { sku: 'SKU123', quantity: 1, isFractioned: false },
        { sku: 'EBSKU123', quantity: 70, isFractioned: true },
      ],
    })

    expect(result).toEqual([
      {
        productId: 1,
        quantity: 1,
        sku: 'SKU123',
        total: 50.5,
        totalItem: 50.5,
        unity: 'Un',
        unityPrice: 50.5,
      },
      {
        productId: 1,
        quantity: 4,
        sku: 'SKU123',
        total: 202,
        totalItem: 202,
        unity: 'Un',
        unityPrice: 50.5,
      },
    ])
  })
})
