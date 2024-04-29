interface ShopifyApiResponse {
  data: Data
}

interface Data {
  products: ShopifyProducts
}

interface ShopifyProducts {
  edges: ShopifyProductEdge[]
  pageInfo: {
    endCursor: string
    hasNextPage: boolean
    hasPreviousPage: boolean
    startCursor: string
  }
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
  price: string
  inventoryItem: {
    id: string
    unitCost: {
      amount: string
    }
  }
  metafields: {
    edges: MetafieldEdge[]
  }
}

interface MetafieldEdge {
  node: MetafieldNode
}

interface MetafieldNode {
  key: string
  value: string
}
