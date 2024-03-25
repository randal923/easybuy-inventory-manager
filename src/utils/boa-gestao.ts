import { ProductWithoutId } from 'src/@types/prisma'

interface MergeProductsAndInventory {
  products: BoaGestaoProduct[]
  inventoryRows: BoaGestaoInventoryItem[]
  shopifyProductVariants: VariantNode[]
}

export const mergeProductsAndInventory = (
  params: MergeProductsAndInventory,
): ProductWithoutId[] => {
  const { products, inventoryRows, shopifyProductVariants } = params

  const mergedProducts: ProductWithoutId[] = []

  for (const product of products) {
    const variant = shopifyProductVariants.find((variant) => variant.sku === product.SKU)
    const inventory = inventoryRows.find((inv) => inv.ProdutoId === product.Id)

    if (!inventory) return

    const getMetafield = (key: string) =>
      Boolean(variant.metafields.edges.find((metafield) => metafield.node.key === key).node?.value)

    const isFractioned = getMetafield('isfractioned')
    const isZap = getMetafield('iszap')
    const isPanebras = getMetafield('ispanebras')

    const baseProduct: ProductWithoutId = {
      sku: product.SKU,
      packageQuantity: product.QuantidadePacote,
      currentStock: inventory.EstoqueAtual,
      isFractioned: isFractioned,
      isZap: isZap,
      isPanebras: isPanebras,
      fractionedQuantity: null,
    }

    mergedProducts.push(baseProduct)
  }

  return mergedProducts
}
