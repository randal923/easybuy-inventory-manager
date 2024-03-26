import { Items, Order } from 'src/orders/models/order.model'

export function translateOrderToPortuguese(order: Order): PortugueseOrder {
  return {
    DataHora: order.dateTime,
    ClienteId: order.clientId,
    TotalProdutos: order.totalProducts,
    Total: order.total,
    Itens: order.items.map(translateOrderItemToPortuguese),
  }
}

export function translateOrderItemToPortuguese(item: Items): PortugueseItem {
  return {
    ProdutoId: item.productId,
    Unidade: item.unity,
    Quantidade: item.quantity,
    ValorUnitario: item.unityPrice,
    TotalItem: item.totalItem,
    Total: item.total,
  }
}
