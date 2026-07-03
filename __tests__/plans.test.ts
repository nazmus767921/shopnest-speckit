import { describe, it, expect } from "vitest"
import { planSchema } from "@/lib/validations/plans"

describe("Plan validation schema", () => {
  it("should validate a correct plan payload", () => {
    const validPayload = {
      name: "Starter Plus",
      slug: "starter-plus",
      pricePaisa: 99900,
      features: {
        max_products: 150,
        max_orders_per_month: 500,
        max_categories: 10,
        max_variants_per_product: 5,
        max_images_per_product: 8,
        image_size_limit_mb: 4,
        discount_codes: true,
        telegram_notifications: false,
        cod: true,
      },
    }

    const res = planSchema.safeParse(validPayload)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.name).toBe("Starter Plus")
      expect(res.data.slug).toBe("starter-plus")
      expect(res.data.pricePaisa).toBe(99900)
    }
  })

  it("should validate and allow null for unlimited resource features", () => {
    const unlimitedPayload = {
      name: "Enterprise Pro",
      slug: "enterprise-pro",
      pricePaisa: 2500000,
      features: {
        max_products: null,
        max_orders_per_month: null,
        max_categories: null,
        max_variants_per_product: null,
        max_images_per_product: 20,
        image_size_limit_mb: 10,
        discount_codes: true,
        telegram_notifications: true,
        cod: true,
      },
    }

    const res = planSchema.safeParse(unlimitedPayload)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.features.max_products).toBeNull()
      expect(res.data.features.max_orders_per_month).toBeNull()
    }
  })

  it("should reject an invalid slug with uppercase letters or leading/trailing hyphens", () => {
    const invalidSlugPayload = {
      name: "Starter Plus",
      slug: "-starter-Plus-",
      pricePaisa: 99900,
      features: {
        max_products: 150,
        max_orders_per_month: 500,
        max_categories: 10,
        max_variants_per_product: 5,
        max_images_per_product: 8,
        image_size_limit_mb: 4,
        discount_codes: true,
        telegram_notifications: false,
        cod: true,
      },
    }

    const res = planSchema.safeParse(invalidSlugPayload)
    expect(res.success).toBe(false)
  })

  it("should reject a negative price", () => {
    const negativePricePayload = {
      name: "Starter Plus",
      slug: "starter-plus",
      pricePaisa: -100,
      features: {
        max_products: 150,
        max_orders_per_month: 500,
        max_categories: 10,
        max_variants_per_product: 5,
        max_images_per_product: 8,
        image_size_limit_mb: 4,
        discount_codes: true,
        telegram_notifications: false,
        cod: true,
      },
    }

    const res = planSchema.safeParse(negativePricePayload)
    expect(res.success).toBe(false)
  })
})

describe("validateDowngrade", () => {
  const targetFeatures = {
    max_products: 50,
    max_orders_per_month: 200,
    max_categories: 5,
    max_variants_per_product: 10,
    max_images_per_product: 2,
    image_size_limit_mb: 1,
    discount_codes: false,
    telegram_notifications: true,
    cod: true,
  }

  it("should return violations when products exceed limit", async () => {
    const { validateDowngrade } = await import("@/lib/plans/validateDowngrade")
    const counts = {
      productsCount: 60,
      categoriesCount: 3,
      discountCodesCount: 0,
      maxImagesOnAnyProduct: 1,
      monthlyOrdersCount: 150,
    }
    const violations = validateDowngrade(counts, targetFeatures, "Starter")
    expect(violations.length).toBe(1)
    expect(violations[0].field).toBe("products")
    expect(violations[0].message).toContain("maximum of 50")
  })

  it("should return violations when categories exceed limit", async () => {
    const { validateDowngrade } = await import("@/lib/plans/validateDowngrade")
    const counts = {
      productsCount: 30,
      categoriesCount: 8,
      discountCodesCount: 0,
      maxImagesOnAnyProduct: 1,
      monthlyOrdersCount: 150,
    }
    const violations = validateDowngrade(counts, targetFeatures, "Starter")
    expect(violations.length).toBe(1)
    expect(violations[0].field).toBe("categories")
    expect(violations[0].message).toContain("maximum of 5")
  })

  it("should return violations when discount codes exist but are disabled in target", async () => {
    const { validateDowngrade } = await import("@/lib/plans/validateDowngrade")
    const counts = {
      productsCount: 30,
      categoriesCount: 3,
      discountCodesCount: 2,
      maxImagesOnAnyProduct: 1,
      monthlyOrdersCount: 150,
    }
    const violations = validateDowngrade(counts, targetFeatures, "Starter")
    expect(violations.length).toBe(1)
    expect(violations[0].field).toBe("discountCodes")
    expect(violations[0].message).toContain("does not include discount codes")
  })

  it("should return violations when product images per product exceed target", async () => {
    const { validateDowngrade } = await import("@/lib/plans/validateDowngrade")
    const counts = {
      productsCount: 30,
      categoriesCount: 3,
      discountCodesCount: 0,
      maxImagesOnAnyProduct: 4,
      monthlyOrdersCount: 150,
    }
    const violations = validateDowngrade(counts, targetFeatures, "Starter")
    expect(violations.length).toBe(1)
    expect(violations[0].field).toBe("imagesPerProduct")
    expect(violations[0].message).toContain("max 2 per product")
  })

  it("should succeed with empty array when counts are within limits", async () => {
    const { validateDowngrade } = await import("@/lib/plans/validateDowngrade")
    const counts = {
      productsCount: 45,
      categoriesCount: 4,
      discountCodesCount: 0,
      maxImagesOnAnyProduct: 2,
      monthlyOrdersCount: 250, // exceeded order limit but it shouldn't block
    }
    const violations = validateDowngrade(counts, targetFeatures, "Starter")
    expect(violations.length).toBe(0)
  })
})
