"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { db } from "@/db"
import { user as userTable, account as accountTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { hashPassword } from "better-auth/crypto"
import { getCustomerOrders, getCustomerOrderDetails } from "@/db/queries/orders"

/**
 * Action to fetch the current customer's order history.
 * Authenticates the user server-side and applies ownership boundary (Zero-Trust).
 */
export async function fetchCustomerOrders() {
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id")
  if (!merchantId) {
    throw new Error("Merchant context not found.")
  }

  const session = await auth.api.getSession({
    headers: headersList,
  })

  if (!session?.user) {
    return []
  }

  const isAnonymous = session.user.email?.endsWith("@guest.shopnest.com.bd")
  const phone = isAnonymous ? session.user.email.split("@")[0] : undefined

  return await getCustomerOrders(merchantId, session.user.id, phone)
}

/**
 * Action to fetch details of a specific order.
 * Ensures the order belongs to the currently logged in customer/guest (Zero-Trust).
 */
export async function fetchCustomerOrderDetails(orderId: string) {
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id")
  if (!merchantId) {
    throw new Error("Merchant context not found.")
  }

  const session = await auth.api.getSession({
    headers: headersList,
  })

  if (!session?.user) {
    throw new Error("You must be signed in to view this order.")
  }

  const isAnonymous = session.user.email?.endsWith("@guest.shopnest.com.bd")
  const phone = isAnonymous ? session.user.email.split("@")[0] : undefined

  const order = await getCustomerOrderDetails(merchantId, orderId, session.user.id, phone)
  
  if (!order) {
    throw new Error("Order not found or access denied.")
  }

  return order
}

/**
 * Action to promote a guest customer to a registered account (in-place promotion).
 * Updates user fields and creates password credentials while preserving user ID and order history.
 */
export async function promoteGuestSession(formData: {
  name: string
  email: string
  password: string
}) {
  const headersList = await headers()
  const session = await auth.api.getSession({
    headers: headersList,
  })

  if (!session?.user) {
    return { error: "No active session found." }
  }

  const isAnonymous = session.user.email?.endsWith("@guest.shopnest.com.bd")
  if (!isAnonymous) {
    return { error: "This account is already registered." }
  }

  const newEmail = formData.email.toLowerCase().trim()

  // 1. Check if email is already taken
  const existingUser = await db.query.user.findFirst({
    where: eq(userTable.email, newEmail),
  })

  if (existingUser) {
    return { error: "This email is already registered. Please log in instead." }
  }

  try {
    // 2. Hash the password using Better Auth's own hasher
    const hashedPassword = await hashPassword(formData.password)

    // 3. Perform atomic promotion inside a transaction
    await db.transaction(async (tx) => {
      // Update the user details (preserving ID)
      await tx
        .update(userTable)
        .set({
          name: formData.name,
          email: newEmail,
          isAnonymous: false,
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(userTable.id, session.user.id))

      // Insert credentials into the account table
      await tx.insert(accountTable).values({
        id: crypto.randomUUID(),
        accountId: newEmail,
        providerId: "credential",
        userId: session.user.id,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    })

    return { success: true }
  } catch (err: unknown) {
    console.error("Failed to promote guest user:", err)
    const errorMsg = err instanceof Error ? err.message : "Database error during account promotion."
    return { error: errorMsg }
  }
}
