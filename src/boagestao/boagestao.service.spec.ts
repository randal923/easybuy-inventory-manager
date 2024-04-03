import { Test, TestingModule } from '@nestjs/testing'
import { BoagestaoService } from './boagestao.service'
import { HttpService } from '../http/http.service'

describe('BoagestaoService', () => {
  let boaGestaoService: BoagestaoService

  beforeEach(async () => {
    const mockBoagestaoService = {
      findProductsBySkus: jest.fn().mockResolvedValue([
        { SKU: 'SKU123', name: 'Product 1' },
        { SKU: 'SKU456', name: 'Product 2' },
      ]),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: BoagestaoService, useValue: mockBoagestaoService }, HttpService],
    }).compile()

    boaGestaoService = module.get<BoagestaoService>(BoagestaoService)
  })

  it('should be defined', () => {
    expect(boaGestaoService).toBeDefined()
  })

  it('should get all products by SKU', async () => {
    const skus = ['EB123', 'EB456']
    const products = await boaGestaoService.findProductsBySkus(skus)

    expect(products).toBeDefined()
    expect(products).toHaveLength(2)
    expect(products).toEqual([
      { SKU: 'SKU123', name: 'Product 1' },
      { SKU: 'SKU456', name: 'Product 2' },
    ])
  })
})
