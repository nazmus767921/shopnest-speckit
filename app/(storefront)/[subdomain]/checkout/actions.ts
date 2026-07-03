"use server"

import { headers, cookies } from "next/headers"
import { createOrder, attachPaymentConfirmation } from "@/db/queries/orders"
import { addressSchema, paymentSchema } from "@/lib/validations/checkout"
import { auth } from "@/lib/auth/auth"

export async function submitAddress(formData: {
  deliveryName: string
  deliveryPhone: string
  deliveryAddress: string
  deliveryCity: string
  deliveryChargePaisa: number
  items: Array<{ productId: string; quantity: number; variantId?: string; variantLabel?: string }>
}) {
  // 1. Resolve merchantId from proxy-injected headers (Invariant 1)
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id")
  if (!merchantId) {
    return { error: "Merchant configuration not found." }
  }

  // 2. Validate input with Zod
  const validation = addressSchema.safeParse(formData)
  if (!validation.success) {
    // Zod Error Extraction: extract the first error message using error.issues[0].message
    return { error: validation.error.issues[0].message }
  }

  // 3. Resolve user session server-side
  const session = await auth.api.getSession({
    headers: headersList,
  })
  const userId = session?.user?.id || null
  const isAnonymous = session?.user?.email?.endsWith("@guest.shopnest.com.bd")
  const guestPhone = isAnonymous ? formData.deliveryPhone : null

  // 4. Create pre-checkout order in the DB
  const result = await createOrder({
    merchantId,
    userId,
    guestPhone,
    deliveryName: formData.deliveryName,
    deliveryPhone: formData.deliveryPhone,
    deliveryAddress: formData.deliveryAddress,
    deliveryCity: formData.deliveryCity,
    deliveryChargePaisa: formData.deliveryChargePaisa,
    items: formData.items,
  })

  if ("error" in result) {
    return { error: result.error }
  }

  // 5. Store orderId in a signed HTTP-only cookie for continuity
  const cookieStore = await cookies()
  cookieStore.set("checkout-order-id", result.orderId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3600, // 1 hour
  })

  return { success: true, orderId: result.orderId, totalPaisa: result.totalPaisa }
}

export async function submitPayment(formData: {
  paymentMethod: "bkash" | "nagad"
  transactionId: string
}) {
  // 1. Resolve merchantId from proxy headers (Invariant 1)
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id")
  if (!merchantId) {
    return { error: "Merchant configuration not found." }
  }

  // 2. Validate input with Zod
  const validation = paymentSchema.safeParse(formData)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  // 3. Read orderId from the continuity cookie
  const cookieStore = await cookies()
  const orderId = cookieStore.get("checkout-order-id")?.value
  if (!orderId) {
    return { error: "Session expired. Please review your cart and try again." }
  }

  // 4. Attach payment details
  const result = await attachPaymentConfirmation({
    orderId,
    merchantId,
    paymentMethod: formData.paymentMethod,
    transactionId: formData.transactionId,
  })

  if (!result.success) {
    return { error: result.error || "Failed to submit payment details." }
  }

  // 5. Clear continuity cookie
  cookieStore.delete("checkout-order-id")

  return { success: true, orderId }
}
