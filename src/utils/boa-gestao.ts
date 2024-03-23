interface MergeProductsAndInventory {
  products: BoaGestaoProduct[]
  inventoryRows: BoaGestaoInventoryItem[]
}

export const mergeProductsAndInventory = (params: MergeProductsAndInventory) => {
  const { products, inventoryRows } = params

  const mergedProducts = []

  for (const product of products) {
    const inventory = inventoryRows.find((inv) => inv.ProdutoId === product.Id)

    if (inventory) {
      const baseProduct = {
        type: product.Tipo,
        description: product.Descricao,
        barcode: product.CodigoBarras,
        sku: product.SKU,
        manufacturer: product.Fabricante,
        groupId: product.GrupoId,
        group: product.Grupo,
        mainCategoryId: product.CategoriaPrincipalId,
        mainCategory: product.CategoriaPrincipal,
        unit: product.Unidade,
        priceInView: product.PrecoVista,
        priceOnTerm: product.PrecoPrazo,
        highlight: product.Destaque,
        fractioned: product.Fracionado,
        packageQuantity: product.QuantidadePacote,
        itemUnit: product.UnidadeItem,
        imageId: product.ImagemId,
        imageUrl: product.ImagemURL,
        currentStock: inventory.EstoqueAtual,
        entryForecast: inventory.PrevisaoEntrada,
        exitForecast: inventory.PrevisaoSaida,
      }

      mergedProducts.push(baseProduct)
    }
  }

  return mergedProducts
}
