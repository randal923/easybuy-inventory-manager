import { Injectable } from '@nestjs/common'
import { HttpService } from '../http/http.service'
import { OrderInput } from '../orders/dtos/boa-gestao-order-input.dto'
import { translateOrderToPortuguese } from '../utils/orders'
import { AxiosHeaders } from 'axios'

export interface OrderResponse {
  id: string
}
@Injectable()
export class BoagestaoService {
  constructor(private readonly httpService: HttpService) {}

  async placeOrder(
    orderInput: OrderInput,
    headers: AxiosHeaders,
  ): Promise<OrderResponse> {
    if (!orderInput) return

    const orderUrl = 'https://boagestao.app/api/pedido'

    const portugueseTranslation = translateOrderToPortuguese(orderInput)
    const placedOrder = await this.httpService.post<PortugueseOrder, OrderResponse>(
      orderUrl,
      portugueseTranslation,
      { headers },
    )

    return placedOrder.data
  }

  async findProductsBySkus(skus: string[], headers: AxiosHeaders) {
    const productsUrl = 'https://boagestao.app/api/produtos'

    const response = await this.httpService.get<BoaGestaoProductsResponse>(productsUrl, {
      headers,
    })

    return response.data.rows
  }
}
