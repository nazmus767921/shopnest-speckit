import { z } from "zod"

export const storeSettingsSchema = z.object({
  name: z
    .string()
    .min(2, "Store name must be at least 2 characters.")
    .max(80, "Store name must be under 80 characters."),
  phoneNumber: z.string().max(20, "Phone number is too long.").nullable().optional(),
  bkashNumber: z.string().max(20, "bKash number is too long.").nullable().optional(),
  nagadNumber: z.string().max(20, "Nagad number is too long.").nullable().optional(),
  lowStockThresholdDefault: z
    .number({ error: "Low stock threshold must be a number." })
    .int("Low stock threshold must be a whole number.")
    .min(0, "Low stock threshold cannot be negative.")
    .max(9999, "Low stock threshold is too high."),
  codEnabled: z.boolean().default(false),
  payDeliveryChargeFirst: z.boolean().default(false),
  bkashWalletNumber: z.string().max(20, "bKash wallet number is too long.").nullable().optional(),
  nagadWalletNumber: z.string().max(20, "Nagad wallet number is too long.").nullable().optional(),
})

export type StoreSettingsValues = z.infer<typeof storeSettingsSchema>
