import { Test, TestingModule } from '@nestjs/testing'
import { ProductsService } from './products.service'
import { PrismaService } from '../../prisma/prisma.service'

describe('ProductsService', () => {
  let service: ProductsService
  let prisma: PrismaService

  beforeEach(async () => {
    const prismaServiceProvider = {
      provide: PrismaService,
      useFactory: () => ({
        product: {
          upsert: jest.fn().mockResolvedValue({}),
        },
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, prismaServiceProvider],
    }).compile()

    service = module.get<ProductsService>(ProductsService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
    expect(prisma).toBeDefined()
  })
})
