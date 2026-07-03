import { z } from "zod"

export const planSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be under 100 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug must be under 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric and hyphens only")
    .refine((val) => !val.startsWith("-") && !val.endsWith("-"), "Slug cannot start or end with a hyphen"),
  pricePaisa: z.number().int().min(0, "Price must be non-negative"),
  features: z.object({
    max_products: z.number().int().positive("Max products must be positive").nullable(),
    max_orders_per_month: z.number().int().positive("Max orders must be positive").nullable(),
    max_categories: z.number().int().positive("Max categories must be positive").nullable(),
    max_variants_per_product: z.number().int().positive("Max variants must be positive").nullable(),
    max_images_per_product: z.number().int().min(1, "Must allow at least 1 image per product"),
    image_size_limit_mb: z.number().int().min(1, "Must be at least 1MB"),
    discount_codes: z.boolean(),
    telegram_notifications: z.boolean(),
    cod: z.boolean(),
  }),
})

export type PlanInput = z.infer<typeof planSchema>
