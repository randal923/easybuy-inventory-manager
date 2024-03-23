interface BoaGestaoProductsResponse {
  iat: number
  page: number
  pagecount: number
  limit: number
  records: number
  rows: BoaGestaoProduct[]
}

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

interface BoaGestaoInventoryResponse {
  iat: number
  page: number
  pagecount: number
  limit: number
  records: number
  rows: BoaGestaoInventoryItem[]
}

interface BoaGestaoInventoryItem {
  ProdutoId: number
  EstoqueAtual: number
  PrevisaoEntrada: number | null
  PrevisaoSaida: number | null
}

interface MergedBoaGestaoProduct {
  type: number
  description: string
  barcode: string
  sku: string | null
  manufacturer: string
  groupId: number | null
  group: string | null
  mainCategoryId: number | null
  mainCategory: string | null
  unit: string
  priceInView: number
  priceOnTerm: number
  highlight: number
  fractioned: number
  packageQuantity: number
  itemUnit: string | null
  imageId: number | null
  imageUrl: string | null
  currentStock: number
  entryForecast: number | null
  exitForecast: number | null
}
