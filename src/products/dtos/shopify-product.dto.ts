import { IsBoolean, IsInt, IsString, ValidateNested, IsArray, IsObject } from 'class-validator'
import { Type } from 'class-transformer'

export class ShopifyProduct {
  @IsString()
  id: string

  @IsString()
  title: string

  @IsArray()
  @IsString({ each: true })
  tags: string[]

  @IsInt()
  totalInventory: number

  @IsBoolean()
  tracksInventory: boolean

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantEdge)
  variants: {
    edges: ProductVariantEdge[]
  }
}

class ProductVariantEdge {
  @IsObject()
  @ValidateNested()
  @Type(() => ProductVariantNode)
  node: ProductVariantNode
}

class ProductVariantNode {
  @IsString()
  id: string

  @IsString()
  title: string

  @IsInt()
  inventoryQuantity: number

  @IsString()
  sku: string
}
