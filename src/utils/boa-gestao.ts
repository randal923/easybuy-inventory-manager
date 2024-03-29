import { ProductWithoutId } from 'src/@types/prisma'

interface MergeProductsAndInventory {
  boaGestaoProducts: BoaGestaoProduct[]
  boaGestaoInventoryRows: BoaGestaoInventoryItem[]
  shopifyProductVariants: VariantNode[]
}

export const mergeProductsAndInventory = (
  params: MergeProductsAndInventory,
): ProductWithoutId[] => {
  const { boaGestaoProducts, boaGestaoInventoryRows, shopifyProductVariants } = params

  const mergedProducts: ProductWithoutId[] = []

  for (const boaGestaoProduct of boaGestaoProducts) {
    const shopifyVariants = shopifyProductVariants.filter((variant) => {
      const cleanedSku = variant.sku ? variant.sku.replace('EB', '') : null
      return (
        variant.sku === boaGestaoProduct.SKU || (cleanedSku && cleanedSku === boaGestaoProduct.SKU)
      )
    })

    const boaGestaoInventoryItem = boaGestaoInventoryRows.find(
      (inv) => inv.ProdutoId === boaGestaoProduct.Id,
    )

    if (!boaGestaoInventoryItem) {
      console.error(`Inventory not found for product ${boaGestaoProduct.SKU}`)
      continue
    }

    shopifyVariants.forEach((variant) => {
      const getMetafield = (key: string) => {
        const metafieldEdge = variant.metafields.edges.find(
          (metafield) => metafield.node.key === key,
        )
        if (metafieldEdge) {
          return metafieldEdge.node.value === 'true'
        }
        return false
      }

      const isFractioned = getMetafield('isfractioned')
      const isZap = getMetafield('iszap')
      const isPanebras = getMetafield('ispanebras')

      const productVariant: ProductWithoutId = {
        sku: variant.sku,
        packageQuantity: boaGestaoProduct.QuantidadePacote,
        boaGestaoCurrentStock: boaGestaoInventoryItem.EstoqueAtual,
        shopifyCurrentStock: variant.inventoryQuantity,
        inventoryItemId: variant.inventoryItem.id,
        isFractioned,
        isZap,
        isPanebras,
      }

      mergedProducts.push(productVariant)
    })
  }

  return mergedProducts
}
