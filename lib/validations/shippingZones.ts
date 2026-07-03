import { z } from "zod"

export const shippingZoneSchema = z.object({
  name: z.string().min(2, "Zone name must be at least 2 characters"),
  deliveryChargePaisa: z.number().int().min(0, "Delivery charge cannot be negative"),
  freeShippingThresholdPaisa: z.number().int().min(0).nullable(),
  districts: z.array(z.object({
    division: z.string().min(2, "Division is required"),
    district: z.string().min(2, "District is required"),
  })).min(1, "Assign at least one district to this zone"),
})

export type ShippingZoneFormData = z.infer<typeof shippingZoneSchema>
