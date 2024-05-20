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
      if (!variant.sku) return false

      const cleanedSku = variant.sku.substring(3)

      return (
        variant.sku === boaGestaoProduct.SKU ||
        (cleanedSku && cleanedSku === boaGestaoProduct.SKU)
      )
    })

    if (shopifyVariants.length === 0) continue

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
        unityPrice: calculateUnityPrice(isFractioned, boaGestaoProduct, isPanebras),
        unityCost: calculateUnityCost(isFractioned, boaGestaoProduct),
        isFractioned,
        isZap,
        isPanebras,
      }

      mergedProducts.push(productVariant)
    })
  }

  return mergedProducts
}

export const calculateUnityPrice = (
  isFractioned: boolean,
  boaGestaoProduct: BoaGestaoProduct,
  isPanebras: boolean,
): number => {
  // Build the price with the margin
  const shopifyMargin = isPanebras
    ? Number(process.env.SHOPIFY_PRICE_MARKUP_PANEBRAS)
    : Number(process.env.SHOPIFY_PRICE_MARKUP_ZAP)
  const costPrice = boaGestaoProduct.PrecoVista
  const productQuantity = boaGestaoProduct.QuantidadePacote

  const calculatePriceWithMargin = (price: number) => {
    const finalPrice = price / (1 - shopifyMargin / 100)
    return parseFloat(finalPrice.toFixed(2))
  }

  if (isFractioned) {
    const unitCost = costPrice / productQuantity
    return calculatePriceWithMargin(unitCost)
  }

  return calculatePriceWithMargin(costPrice)
}

export const calculateUnityCost = (
  isFractioned: boolean,
  boaGestaoProduct: BoaGestaoProduct,
) => {
  if (isFractioned) {
    const unitCost = boaGestaoProduct.PrecoVista / boaGestaoProduct.QuantidadePacote
    return parseFloat(unitCost.toFixed(2))
  }

  return parseFloat(boaGestaoProduct.PrecoVista.toFixed(2))
}
