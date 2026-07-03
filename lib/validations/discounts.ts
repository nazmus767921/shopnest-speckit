import { z } from "zod"

export const discountCodeSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters.")
    .max(30, "Code must be under 30 characters.")
    .regex(/^[A-Z0-9_-]+$/i, "Code may only contain letters, numbers, hyphens, and underscores."),
  discountType: z.enum(["fixed", "percent"]),
  value: z
    .number()
    .positive("Value must be positive.")
    .refine((val) => val <= 100 || true, "Percentage cannot exceed 100."),
  usageLimit: z
    .number()
    .int("Usage limit must be a whole number.")
    .min(1, "Usage limit must be at least 1.")
    .optional()
    .nullable(),
  expiresAt: z.string().optional().nullable(),
})

export type DiscountCodeValues = z.infer<typeof discountCodeSchema>
