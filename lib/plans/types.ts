export interface PlanFeatures {
  // Numeric limits (null = unlimited)
  max_products:            number | null
  max_orders_per_month:    number | null
  max_categories:          number | null
  max_variants_per_product: number | null  // V2 Unit 21 — max variants per product (null = unlimited)

  // Image limits — see "Image & Variant Limit Semantics" section below
  max_images_per_product:  number | null   // applies to product-level gallery ONLY
  image_size_limit_mb:     number | null

  // Boolean feature flags
  discount_codes:          boolean
  telegram_notifications:  boolean
  cod:                     boolean  // Cash on Delivery (V2 Unit 23)
}

export interface ResolvedPlan {
  id: string
  name: string
  slug: string
  pricePaisa: number
  features: PlanFeatures
  isGrandfathered: boolean
}
