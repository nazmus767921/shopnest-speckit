import { z } from "zod"

export const addressSchema = z.object({
  deliveryName: z.string().min(2, "Name must be at least 2 characters"),
  deliveryPhone: z.string().regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number"),
  deliveryAddress: z.string().min(10, "Please enter your full delivery address"),
  deliveryCity: z.string().min(2, "City is required"),
  deliveryChargePaisa: z.number().int().min(0).default(0),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1),
    variantId: z.string().optional(),
    variantLabel: z.string().optional(),
  })).min(1, "Cart is empty"),
})

export const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must be numeric"),
})

export const paymentSchema = z.discriminatedUnion("paymentMethod", [
  z.object({
    paymentMethod: z.enum(["bkash", "nagad"] as const),
    transactionId: z.string().min(6, "Enter the transaction ID from your bKash/Nagad app"),
  }),
  z.object({
    paymentMethod: z.literal("cod"),
    transactionId: z.string().optional(),
  })
])

export type AddressFormData = z.infer<typeof addressSchema>
export type OtpFormData = z.infer<typeof otpSchema>
export type PaymentFormData = z.infer<typeof paymentSchema>
