"use server"

import { getCategories } from "@/db/queries/categories"
import { getNewArrivals, getFeaturedProducts, getExclusiveProducts, getProductsByIds } from "@/lib/products/data"

export async function fetchCategories(merchantId: string) {
  return getCategories(merchantId)
}

export async function fetchFeaturedProducts(merchantId: string, limit: number) {
  return getFeaturedProducts(merchantId, limit)
}

export async function fetchProductsByIds(merchantId: string, ids: string[]) {
  return getProductsByIds(merchantId, ids)
}
