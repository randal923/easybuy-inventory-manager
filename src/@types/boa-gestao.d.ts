interface BoaGestaoProduct {
  Id: number
  Tipo: number
  Descricao: string
  CodigoBarras: string
  SKU: string | null
  Fabricante: string
  GrupoId: number | null
  Grupo: string | null
  CategoriaPrincipalId: number | null
  CategoriaPrincipal: string | null
  Unidade: string
  PrecoVista: number
  PrecoPrazo: number
  Destaque: number
  Fracionado: number
  QuantidadePacote: number
  UnidadeItem: string | null
  ImagemId: number | null
  ImagemURL: string | null
}

interface BoaGestaoInventoryItem {
  ProdutoId: number
  EstoqueAtual: number
  PrevisaoEntrada: number | null
  PrevisaoSaida: number | null
}
