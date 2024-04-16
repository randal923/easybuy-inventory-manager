import { Product } from '@prisma/client'
type ProductWithoutId = Omit<Product, 'id'>

interface MergedProduct {
  sku: string | null
  packageQuantity: number
  fractionedQuantity: number
  shopifyCurrentStock: number
  shopifyLaggingStock?: number
  inventoryItemId: string
  boaGestaoCurrentStock: number
  isFractioned: boolean
  isZap: boolean
  isPanebras: boolean
}

interface UpdateProductFractionedQuantity {
  sku: string
  fractionedQuantity: number
}
interface UpdateShopifyCurrentStock {
  sku: string
  shopifyCurrentStock: number
}
interface UpdateBoaGestaoCurrentStock {
  sku: string
  boaGestaoCurrentStock: number
}
