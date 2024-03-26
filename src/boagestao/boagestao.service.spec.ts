import { Test, TestingModule } from '@nestjs/testing'
import { BoagestaoService } from './boagestao.service'

describe('BoagestaoService', () => {
  let service: BoagestaoService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BoagestaoService],
    }).compile()

    service = module.get<BoagestaoService>(BoagestaoService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
