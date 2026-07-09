"use cache"
import { db } from "@/db"
import { products } from "@/db/schema"
import { eq, and, isNull, desc, inArray } from "drizzle-orm"
import { cacheLife } from "next/dist/server/use-cache/cache-life"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"

export async function getNewArrivals(merchantId: string, limit: number = 8) {
  cacheLife("hours")
  cacheTag(`merchant-${merchantId}-products`)
  
  return await db.query.products.findMany({
    where: and(
      eq(products.merchantId, merchantId),
      isNull(products.deletedAt),
      eq(products.isPublished, true)
    ),
    with: {
      images: {
        orderBy: (images, { asc }) => [asc(images.displayOrder)],
      },
      promotions: true,
    },
    orderBy: [desc(products.createdAt)],
    limit,
  })
}

export async function getFeaturedProducts(merchantId: string, limit: number = 8) {
  cacheLife("hours")
  cacheTag(`merchant-${merchantId}-products`)

  // Assuming featured logic might be based on some flag or just recent active products for now.
  // In a real implementation, we'd check a 'isFeatured' flag on products, 
  // but since it's not defined in the schema, we'll return top products ordered by something else or just recent ones.
  return await db.query.products.findMany({
    where: and(
      eq(products.merchantId, merchantId),
      isNull(products.deletedAt),
      eq(products.isPublished, true)
    ),
    with: {
      images: {
        orderBy: (images, { asc }) => [asc(images.displayOrder)],
      },
      promotions: true,
    },
    orderBy: [desc(products.stockCount)], // Just as an example for "featured"
    limit,
  })
}

export async function getExclusiveProducts(merchantId: string, limit: number = 8) {
  cacheLife("hours")
  cacheTag(`merchant-${merchantId}-products`)

  return await db.query.products.findMany({
    where: and(
      eq(products.merchantId, merchantId),
      isNull(products.deletedAt),
      eq(products.isPublished, true)
    ),
    with: {
      images: {
        orderBy: (images, { asc }) => [asc(images.displayOrder)],
      },
      promotions: true,
    },
    orderBy: [desc(products.pricePaisa)], // Just as an example for "exclusive"
    limit,
  })
}
export async function getProductsByIds(merchantId: string, productIds: string[]) {
  if (!productIds || productIds.length === 0) return []
  
  cacheLife("hours")
  cacheTag(`merchant-${merchantId}-products`)

  return await db.query.products.findMany({
    where: and(
      eq(products.merchantId, merchantId),
      isNull(products.deletedAt),
      inArray(products.id, productIds)
    ),
    with: {
      images: {
        orderBy: (images, { asc }) => [asc(images.displayOrder)],
      },
      promotions: true,
    },
  })
}
