import { Product } from '@prisma/client'
type ProductWithoutId = Omit<Product, 'id'>

interface MergedProduct {
  sku: string | null
  packageQuantity: number
  fractionedQuantity: number
  shopifyCurrentStock: number
  inventoryItemId: string
  boaGestaoCurrentStock: number
  isFractioned: boolean
  isZap: boolean
  isPanebras: boolean
}
