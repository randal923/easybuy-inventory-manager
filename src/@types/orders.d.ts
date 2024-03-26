interface PortugueseOrder {
  DataHora: string
  ClienteId: number
  TotalProdutos: number
  Total: number
  Itens: PortugueseItem[]
}

interface PortugueseItem {
  ProdutoId: number
  Unidade: string
  Quantidade: number
  ValorUnitario: number
  TotalItem: number
  Total: number
}
