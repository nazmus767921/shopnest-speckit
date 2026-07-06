import { z } from "zod"

export const productFormSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Product name must be at least 2 characters."),
  description: z.string(),
  price: z.number().min(0.01, "Price must be greater than zero."),
  compareAtPrice: z.number().nullable(),
  stockCount: z.number().int().min(0, "Stock count cannot be negative."),
  lowStockThreshold: z.number().int().min(0, "Low stock threshold cannot be negative."),
  isPublished: z.boolean(),
  images: z.array(z.string()),
  categoryId: z.string().nullable(),
  promotionTypes: z.array(z.string()),
}).refine(
  (data) => {
    if (data.compareAtPrice !== undefined && data.compareAtPrice !== null) {
      return data.compareAtPrice > data.price
    }
    return true
  },
  {
    message: "Old price must be greater than current price.",
    path: ["compareAtPrice"],
  }
)

export type ProductFormValues = z.infer<typeof productFormSchema>
