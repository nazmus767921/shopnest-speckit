import { z } from "zod"

export const flashSaleCreateSchema = z.object({
  productId: z.string().uuid("Invalid product reference."),
  variantId: z.string().uuid("Invalid variant reference.").optional().nullable(),
  salePricePaisa: z.number().int().positive("Price must be a positive integer in Paisa."),
  limitQuantity: z.number().int().positive("Limit count must be greater than zero."),
  startTime: z.coerce.date().refine(val => val > new Date(Date.now() - 5000), { // small buffer for latency
    message: "Start time must be in the future."
  }),
  endTime: z.coerce.date(),
}).refine(data => data.endTime > data.startTime, {
  message: "End time must be after the start time.",
  path: ["endTime"]
})

export const flashSaleUpdateSchema = z.object({
  salePricePaisa: z.number().int().positive("Price must be a positive integer in Paisa.").optional(),
  limitQuantity: z.number().int().positive("Limit count must be greater than zero.").optional(),
  endTime: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
})
