import type { Product } from "@/templates/types"
import type { StorefrontContext } from "@/lib/storefront/types"

/**
 * Transforms raw DB product row into canonical storefront Product format.
 * Currently simply casts and ensures relationships are initialized.
 */
export function formatProduct(raw: any): Product {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description || null,
    pricePaisa: raw.pricePaisa || 0,
    compareAtPricePaisa: raw.compareAtPricePaisa || null,
    stockCount: raw.stockCount || 0,
    lowStockThreshold: raw.lowStockThreshold || 0,
    images: Array.isArray(raw.images) ? raw.images : [],
    category: raw.category ? { 
      id: raw.category.id, 
      name: raw.category.name, 
      slug: raw.category.slug 
    } : null,
    promotions: Array.isArray(raw.promotions) ? raw.promotions : [],
    flashSales: Array.isArray(raw.flashSales) ? raw.flashSales : undefined,
    attributes: Array.isArray(raw.attributes) ? raw.attributes : [],
    variants: Array.isArray(raw.variants) ? raw.variants : [],
  }
}
