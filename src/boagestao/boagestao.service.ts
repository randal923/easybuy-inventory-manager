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
    if (!orderInput || orderInput?.items.length === 0) return

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
    if (!skus || skus.length === 0) {
      throw new Error('No skus provided in findProductsBySkus method')
    }

    const productsUrl = 'https://boagestao.app/api/produtos'

    const response = await this.httpService.fetchAllBoaGestaoPages<BoaGestaoProduct>(
      productsUrl,
      {
        headers,
      },
    )

    const filteredSkus = response.filter((row) => skus.includes(row.SKU))
    return filteredSkus
  }
}
