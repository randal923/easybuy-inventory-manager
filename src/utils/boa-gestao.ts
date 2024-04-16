import { Product } from '@prisma/client'
import { ProductWithoutId } from 'src/@types/prisma'

interface MergeProductsAndInventory {
  boaGestaoProducts: BoaGestaoProduct[]
  boaGestaoInventoryRows: BoaGestaoInventoryItem[]
  shopifyProductVariants: VariantNode[]
  productsInDb: Product[]
}

export const mergeProductsAndInventory = (
  params: MergeProductsAndInventory,
): ProductWithoutId[] => {
  const {
    boaGestaoProducts,
    boaGestaoInventoryRows,
    shopifyProductVariants,
    productsInDb,
  } = params

  const mergedProducts: ProductWithoutId[] = []

  for (const boaGestaoProduct of boaGestaoProducts) {
    const shopifyVariants = shopifyProductVariants.filter((variant) => {
      const cleanedSku = variant.sku ? variant.sku.replace('FR-', '') : null
      return (
        variant.sku === boaGestaoProduct.SKU ||
        (cleanedSku && cleanedSku === boaGestaoProduct.SKU)
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

      const productInDb = productsInDb.find(
        (productInDb) => productInDb.sku === variant.sku,
      )
      const isFractioned = getMetafield('isfractioned')
      const isZap = getMetafield('iszap')
      const isPanebras = getMetafield('ispanebras')

      const calculateShopifyCurrentStock = () => {
        const currentStock =
          boaGestaoInventoryItem.EstoqueAtual -
          Math.abs(boaGestaoInventoryItem.PrevisaoSaida)

        if (isFractioned) {
          return (
            currentStock * boaGestaoProduct.QuantidadePacote +
            (productInDb?.fractionedQuantity ?? 0)
          )
        }

        return currentStock
      }

      const productVariant = {
        sku: variant.sku,
        packageQuantity: boaGestaoProduct.QuantidadePacote,
        boaGestaoCurrentStock:
          boaGestaoInventoryItem.EstoqueAtual -
          Math.abs(boaGestaoInventoryItem.PrevisaoSaida),
        shopifyCurrentStock: calculateShopifyCurrentStock(),
        shopifyLaggingStock: variant.inventoryQuantity,
        inventoryItemId: variant.inventoryItem.id,
        fractionedQuantity: productInDb?.fractionedQuantity ?? 0,
        isFractioned,
        isZap,
        isPanebras,
      }

      mergedProducts.push(productVariant)
    })
  }

  return mergedProducts
}
