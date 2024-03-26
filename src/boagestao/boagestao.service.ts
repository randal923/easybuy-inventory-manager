import { Injectable } from '@nestjs/common'
import { HttpService } from 'src/http/http.service'
import { OrderInput } from 'src/orders/dtos/boa-gestao-order-input.dto'
import { translateOrderToPortuguese } from 'src/utils/orders'

interface OrderResponse {
  id: string
}

@Injectable()
export class BoagestaoService {
  productsUrl = 'https://boagestao.app/api/produtos'

  constructor(private readonly httpService: HttpService) {}

  async placeOrder(orderInput: OrderInput): Promise<OrderResponse> {
    const orderUrl = 'https://boagestao.app/api/pedido'

    const headers = {
      Authorization: `Bearer ${process.env.BOA_GESTAO_API_KEY}`,
    }

    const portugueseTranslation = translateOrderToPortuguese(orderInput)

    const placedOrder = await this.httpService.post<PortugueseOrder, OrderResponse>(
      orderUrl,
      portugueseTranslation,
      { headers },
    )

    return placedOrder.data
  }

  async findProductsBySkus(skus: string[]): Promise<BoaGestaoProduct[]> {
    const headers = {
      Authorization: `Bearer ${process.env.BOA_GESTAO_API_KEY}`,
    }

    const products = await this.httpService.get<BoaGestaoProductsResponse>(this.productsUrl, {
      headers,
    })

    const skusSet = new Set(skus)
    const filteredProducts = products.data.rows.filter((product) => skusSet.has(product.SKU))

    return filteredProducts
  }
}
