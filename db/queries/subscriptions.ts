import { db } from "@/db"
import { subscriptions, subscriptionPayments } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

/**
 * Get the active subscription for a merchant.
 * Returns null if no subscription record exists (fallback: rely on merchants.plan).
 */
export async function getSubscriptionByMerchantId(merchantId: string) {
  return await db.query.subscriptions.findFirst({
    where: eq(subscriptions.merchantId, merchantId),
    orderBy: [desc(subscriptions.createdAt)],
  })
}

/**
 * Get all subscription payment history for a merchant,
 * ordered newest-first.
 */
export async function getSubscriptionPayments(merchantId: string) {
  return await db.query.subscriptionPayments.findMany({
    where: eq(subscriptionPayments.merchantId, merchantId),
    orderBy: [desc(subscriptionPayments.paidAt)],
  })
}

import { products, orders, categories, discountCodes, productImages } from "@/db/schema"
import { and, gte, ne, count, isNull } from "drizzle-orm"
import type { PlanFeatures } from "@/lib/plans/types"

export async function getMerchantUsageCounts(merchantId: string) {
  const [productCountResult] = await db
    .select({ value: count() })
    .from(products)
    .where(and(eq(products.merchantId, merchantId), isNull(products.deletedAt)))

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [orderCountResult] = await db
    .select({ value: count() })
    .from(orders)
    .where(
      and(
        eq(orders.merchantId, merchantId),
        gte(orders.createdAt, startOfMonth),
        ne(orders.status, "draft")
      )
    )

  return {
    productsCount: productCountResult?.value || 0,
    monthlyOrdersCount: orderCountResult?.value || 0,
  }
}

/**
 * Writes or refreshes the limit snapshot on a merchant's subscription row.
 * Called when a subscription is activated, upgraded, switched, or renewed.
 * NOT called when a plan's config is edited — snapshot preserves grandfathered limits.
 */
export async function writeSubscriptionSnapshot(
  merchantId: string,
  planFeatures: PlanFeatures
) {
  await db
    .update(subscriptions)
    .set({
      snapshotProductLimit:     planFeatures.max_products,
      snapshotCategoryLimit:    planFeatures.max_categories,
      snapshotDiscountLimit:    planFeatures.discount_codes ? null : 0,
      snapshotImagesPerProduct: planFeatures.max_images_per_product,
      snapshotImageSizeMb:      planFeatures.image_size_limit_mb,
      snapshotOrdersPerMonth:   planFeatures.max_orders_per_month,
      updatedAt:                new Date(),
    })
    .where(eq(subscriptions.merchantId, merchantId))
}

/**
 * Full resource usage counts for downgrade validation.
 * Extends the existing getMerchantUsageCounts() with categories and discount codes.
 */
export async function getMerchantFullUsageCounts(merchantId: string) {
  const [productCountResult] = await db
    .select({ value: count() })
    .from(products)
    .where(and(eq(products.merchantId, merchantId), isNull(products.deletedAt)))

  const [categoryCountResult] = await db
    .select({ value: count() })
    .from(categories)
    .where(eq(categories.merchantId, merchantId))

  const [discountCountResult] = await db
    .select({ value: count() })
    .from(discountCodes)
    .where(eq(discountCodes.merchantId, merchantId))

  // Max images on any single product (to check images-per-product violation)
  const imageCountsRaw = await db
    .select({ productId: productImages.productId, cnt: count() })
    .from(productImages)
    .where(eq(productImages.merchantId, merchantId))
    .groupBy(productImages.productId)
  const maxImagesOnAnyProduct = imageCountsRaw.reduce((max, row) => Math.max(max, row.cnt), 0)

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [orderCountResult] = await db
    .select({ value: count() })
    .from(orders)
    .where(and(eq(orders.merchantId, merchantId), gte(orders.createdAt, startOfMonth), ne(orders.status, "draft")))

  return {
    productsCount:          productCountResult?.value ?? 0,
    categoriesCount:        categoryCountResult?.value ?? 0,
    discountCodesCount:     discountCountResult?.value ?? 0,
    maxImagesOnAnyProduct:  maxImagesOnAnyProduct,
    monthlyOrdersCount:     orderCountResult?.value ?? 0,
  }
}
