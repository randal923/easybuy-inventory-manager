interface PortugueseOrder {
  DataHora: Date
  ClienteId: number
  TotalProdutos: number
  Total: number
  Itens: PortugueseItem[]
}

interface PortugueseItem {
  ProdutoId: string
  Unidade: string
  Quantidade: number
  ValorUnitario: number
  TotalItem: number
  Total: number
}
