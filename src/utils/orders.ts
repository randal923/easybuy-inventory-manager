import {
  ItemsInput,
  OrderInput,
} from 'src/orders/dtos/boa-gestao-order-input.dto'

export function translateOrderToPortuguese(order: OrderInput): PortugueseOrder {
  return {
    DataHora: order.dateTime,
    ClienteId: order.clientId,
    TotalProdutos: order.totalProducts,
    Total: order.total,
    Itens: order.items.map(translateOrderItemToPortuguese),
  }
}

export function translateOrderItemToPortuguese(
  item: ItemsInput,
): PortugueseItem {
  return {
    ProdutoId: item.productId,
    Unidade: item.unity,
    Quantidade: item.quantity,
    ValorUnitario: item.unityPrice,
    TotalItem: item.totalItem,
    Total: item.total,
  }
}
