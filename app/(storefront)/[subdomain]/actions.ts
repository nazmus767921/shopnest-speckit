"use server"

import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { bindGuestOrdersToUser } from "@/db/queries/customers"
import { z } from "zod"

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
})

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export async function signUpCustomer(payload: z.infer<typeof signUpSchema>) {
  const validated = signUpSchema.safeParse(payload)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id")
  if (!merchantId) {
    return { error: "Merchant ID not found in context" }
  }

  try {
    const [localPart, domain] = payload.email.split("@")
    const suffixedEmail = `${localPart}+${merchantId}@${domain}`

    // Sign up via Better Auth server API
    const response = await auth.api.signUpEmail({
      body: {
        email: suffixedEmail,
        password: payload.password,
        name: payload.name,
        merchantId,
      },
      headers: headersList,
    })

    if (response && response.user) {
      const { db } = await import("@/db")
      const { user } = await import("@/db/schema")
      const { eq } = await import("drizzle-orm")
      
      const updateData: any = { role: "customer" }
      
      if (payload.phone) {
        updateData.phoneNumber = payload.phone
        updateData.phoneNumberVerified = false
      }
      
      await db.update(user)
        .set(updateData)
        .where(eq(user.id, response.user.id))

      // Bind past guest orders (T022 / User Story 5)
      // Only email orders bound here. Phone orders bound after OTP verification.
      await bindGuestOrdersToUser(
        response.user.id,
        payload.email,
        null,
        merchantId
      )
    }

    return { success: true }
  } catch (err: any) {
    return { error: err.message || "An error occurred during registration." }
  }
}

export async function signInCustomer(payload: z.infer<typeof signInSchema>) {
  const validated = signInSchema.safeParse(payload)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id")
  if (!merchantId) {
    return { error: "Merchant ID not found in context" }
  }

  try {
    const [localPart, domain] = payload.email.split("@")
    const suffixedEmail = `${localPart}+${merchantId}@${domain}`

    // Sign in via Better Auth server API
    await auth.api.signInEmail({
      body: {
        email: suffixedEmail,
        password: payload.password,
      },
      headers: headersList,
    })

    return { success: true }
  } catch (err: any) {
    return { error: err.message || "An error occurred during sign in." }
  }
}

const addressInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Contact name is required"),
  phone: z.string().min(10, "Phone number is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(1, "City is required"),
  isDefault: z.boolean().default(false),
})

export async function saveCustomerAddress(payload: z.infer<typeof addressInputSchema>) {
  const validated = addressInputSchema.safeParse(payload)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id")
  if (!merchantId) {
    return { error: "Merchant ID not found in context" }
  }

  const session = await auth.api.getSession({ headers: headersList })
  if (!session || !session.user || session.user.role !== "customer") {
    return { error: "Unauthorized" }
  }

  try {
    const { saveCustomerAddress: dbSaveAddress } = await import("@/db/queries/customers")
    const address = await dbSaveAddress(session.user.id, merchantId, payload)
    return { success: true, addressId: address.id }
  } catch (err: any) {
    return { error: err.message || "Failed to save address." }
  }
}

export async function deleteCustomerAddress(addressId: string) {
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id")
  if (!merchantId) {
    return { error: "Merchant ID not found in context" }
  }

  const session = await auth.api.getSession({ headers: headersList })
  if (!session || !session.user || session.user.role !== "customer") {
    return { error: "Unauthorized" }
  }

  try {
    const { db } = await import("@/db")
    const { customerAddresses } = await import("@/db/schema")
    const { eq, and } = await import("drizzle-orm")

    await db
      .delete(customerAddresses)
      .where(
        and(
          eq(customerAddresses.id, addressId),
          eq(customerAddresses.userId, session.user.id),
          eq(customerAddresses.merchantId, merchantId)
        )
      )
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "Failed to delete address." }
  }
}

export async function bindVerifiedPhoneOrders() {
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id")
  if (!merchantId) {
    return { error: "Merchant ID not found in context" }
  }

  const session = await auth.api.getSession({ headers: headersList })
  if (!session || !session.user || session.user.role !== "customer") {
    return { error: "Unauthorized" }
  }

  // Check if phone number is verified
  const user = session.user as any // using any to bypass type check for plugin fields
  if (!user.phoneNumber || !user.phoneNumberVerified) {
    return { error: "Phone number is not verified" }
  }

  try {
    const { bindGuestOrdersToUser } = await import("@/db/queries/customers")
    await bindGuestOrdersToUser(
      session.user.id,
      null,
      user.phoneNumber,
      merchantId
    )
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "Failed to bind phone orders." }
  }
}
