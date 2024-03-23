interface ShopifyApiResponse {
  data: Data
}

interface Data {
  products: ShopifyProducts
}

interface ShopifyProducts {
  edges: ShopifyProductEdge[]
}

interface ShopifyProductEdge {
  node: ShopifyProductNode
}

interface ShopifyProductNode {
  id: string
  title: string
  tags: string[]
  totalInventory: number
  tracksInventory: boolean
  variants: Variants
}

interface Variants {
  edges: VariantEdge[]
}

interface VariantEdge {
  node: VariantNode
}

interface VariantNode {
  id: string
  title: string
  inventoryQuantity: number
  sku: string
  inventoryItem: {
    id: string
  }
}
