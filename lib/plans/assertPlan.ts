import { getMerchantPlan } from "./getPlan"
import type { PlanFeatures } from "./types"

/**
 * Throws if a boolean feature is not enabled on the merchant's plan.
 * Use for: discount_codes, cod, telegram_notifications.
 */
export async function assertPlanFeature(
  merchantId: string,
  feature: keyof Pick<PlanFeatures, "discount_codes" | "cod" | "telegram_notifications">,
  errorMessage: string
) {
  const plan = await getMerchantPlan(merchantId)
  if (!plan || !plan.features[feature]) {
    throw new Error(errorMessage)
  }
}

/**
 * Throws if the merchant has reached or exceeded a numeric plan limit.
 * Passes silently when limit is null (unlimited).
 */
export async function assertPlanLimit(
  merchantId: string,
  limitKey: keyof Pick<PlanFeatures,
    "max_products" | "max_orders_per_month" | "max_categories" | "max_images_per_product" | "max_variants_per_product"
  >,
  currentCount: number,
  buildErrorMessage: (limit: number) => string
) {
  const plan = await getMerchantPlan(merchantId)
  const limit = plan?.features[limitKey] ?? null
  if (limit !== null && currentCount >= limit) {
    throw new Error(buildErrorMessage(limit))
  }
}
