import { Injectable } from '@nestjs/common'
import { HttpService } from 'src/http/http.service'
import { OrderInput } from 'src/orders/dtos/order-input.dto'
import { translateOrderToPortuguese } from 'src/utils/orders'

interface OrderResponse {
  id: string
}

@Injectable()
export class BoagestaoService {
  constructor(private readonly httpService: HttpService) {}

  async placeOrder(orderInput: OrderInput) {
    const orderUrl = 'https://boagestao.app/api/pedido'

    const portugueseTranslation = translateOrderToPortuguese(orderInput)

    const placedOrder = await this.httpService.post<PortugueseOrder, OrderResponse>(orderUrl, {
      ...portugueseTranslation,
    })

    if (!placedOrder.data.id) {
      throw new Error('Failed to place order')
    }
  }
}
