import { cache } from "react"
import { db } from "@/db"
import { subscriptions, subscriptionPlans, merchants } from "@/db/schema"
import { eq } from "drizzle-orm"
import type { ResolvedPlan, PlanFeatures } from "./types"

/**
 * Returns the effective plan for a merchant.
 * Uses React.cache() for per-request deduplication (Invariant: no duplicate DB calls).
 *
 * Resolution order:
 *   1. subscription.plan_id → subscription_plans row  (preferred)
 *   2. Fallback: match subscription_plans.slug = merchants.plan  (legacy)
 */
export const getMerchantPlan = cache(async (merchantId: string): Promise<ResolvedPlan | null> => {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.merchantId, merchantId),
    with: { plan: true },
  })

  if (subscription) {
    const livePlan = subscription.plan  // may be null if plan was archived/deleted

    // Build effective features from snapshot columns (grandfathered limits)
    const hasSnapshot = subscription.snapshotProductLimit !== null
      || subscription.snapshotOrdersPerMonth !== null
      || subscription.snapshotImagesPerProduct !== null

    if (hasSnapshot && livePlan) {
      const snapshotFeatures: PlanFeatures = {
        max_products:             subscription.snapshotProductLimit ?? null,
        max_orders_per_month:     subscription.snapshotOrdersPerMonth ?? null,
        max_categories:           subscription.snapshotCategoryLimit ?? null,
        max_images_per_product:   subscription.snapshotImagesPerProduct ?? livePlan.features.max_images_per_product,
        image_size_limit_mb:      subscription.snapshotImageSizeMb ?? livePlan.features.image_size_limit_mb,
        max_variants_per_product: livePlan.features.max_variants_per_product, // not snapshot-tracked yet
        discount_codes:           subscription.snapshotDiscountLimit !== 0, // 0 = disabled
        telegram_notifications:   livePlan.features.telegram_notifications,
        cod:                      livePlan.features.cod,
      }
      return {
        id: livePlan.id,
        name: livePlan.name,
        slug: livePlan.slug,
        pricePaisa: livePlan.pricePaisa,
        features: snapshotFeatures,
        isGrandfathered: true,
      }
    }

    if (livePlan) {
      return {
        id: livePlan.id,
        name: livePlan.name,
        slug: livePlan.slug,
        pricePaisa: livePlan.pricePaisa,
        features: livePlan.features,
        isGrandfathered: false,
      }
    }
  }

  // Legacy fallback: merchants.plan text slug → plan lookup
  const merchant = await db.query.merchants.findFirst({
    where: eq(merchants.id, merchantId),
  })
  if (!merchant) return null

  const legacyPlan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.slug, merchant.plan),
  })

  return legacyPlan
    ? { id: legacyPlan.id, name: legacyPlan.name, slug: legacyPlan.slug, pricePaisa: legacyPlan.pricePaisa, features: legacyPlan.features, isGrandfathered: false }
    : null
})
