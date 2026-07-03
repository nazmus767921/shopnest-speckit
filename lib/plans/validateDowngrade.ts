import type { PlanFeatures } from "./types"

export interface DowngradeViolation {
  field: string
  message: string
}

/**
 * Compares current merchant resource counts against a target plan's limits.
 * Returns an array of per-resource violation messages.
 * An empty array means the downgrade is safe.
 */
export function validateDowngrade(
  currentCounts: {
    productsCount: number
    categoriesCount: number
    discountCodesCount: number
    maxImagesOnAnyProduct: number
    monthlyOrdersCount: number
  },
  targetPlanFeatures: PlanFeatures,
  targetPlanName: string
): DowngradeViolation[] {
  const violations: DowngradeViolation[] = []

  if (
    targetPlanFeatures.max_products !== null &&
    currentCounts.productsCount > targetPlanFeatures.max_products
  ) {
    violations.push({
      field: "products",
      message: `You have ${currentCounts.productsCount} active products, but the ${targetPlanName} plan allows a maximum of ${targetPlanFeatures.max_products}. Please delete or deactivate products before downgrading.`,
    })
  }

  if (
    targetPlanFeatures.max_categories !== null &&
    currentCounts.categoriesCount > targetPlanFeatures.max_categories
  ) {
    violations.push({
      field: "categories",
      message: `You have ${currentCounts.categoriesCount} categories, but the ${targetPlanName} plan allows a maximum of ${targetPlanFeatures.max_categories}. Please delete categories before downgrading.`,
    })
  }

  if (
    !targetPlanFeatures.discount_codes &&
    currentCounts.discountCodesCount > 0
  ) {
    violations.push({
      field: "discountCodes",
      message: `You have ${currentCounts.discountCodesCount} active discount codes, but the ${targetPlanName} plan does not include discount codes. Please delete all discount codes before downgrading.`,
    })
  }

  if (
    targetPlanFeatures.max_images_per_product !== null &&
    currentCounts.maxImagesOnAnyProduct > targetPlanFeatures.max_images_per_product
  ) {
    violations.push({
      field: "imagesPerProduct",
      message: `One or more of your products has more images than the ${targetPlanName} plan allows (max ${targetPlanFeatures.max_images_per_product} per product). Please reduce product images before downgrading.`,
    })
  }

  return violations
}
