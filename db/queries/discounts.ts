import { db } from "@/db"
import { discountCodes } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"

/**
 * Get all discount codes for a merchant, ordered newest-first.
 * Enforces Invariant 1: always scoped by merchantId.
 */
export async function getDiscountCodes(merchantId: string) {
  return await db.query.discountCodes.findMany({
    where: eq(discountCodes.merchantId, merchantId),
    orderBy: [desc(discountCodes.createdAt)],
  })
}

/**
 * Get a single discount code by id, scoped to the merchant (Invariant 1).
 */
export async function getDiscountCodeById(merchantId: string, id: string) {
  return await db.query.discountCodes.findFirst({
    where: and(
      eq(discountCodes.merchantId, merchantId),
      eq(discountCodes.id, id)
    ),
  })
}

/**
 * Create a new discount code for a merchant.
 */
export async function createDiscountCode(
  merchantId: string,
  data: {
    code: string
    discountType: "fixed" | "percent"
    value: string
    usageLimit?: number | null
    expiresAt?: Date | null
  }
) {
  const [created] = await db
    .insert(discountCodes)
    .values({
      id: crypto.randomUUID(),
      merchantId,
      code: data.code.trim().toUpperCase(),
      discountType: data.discountType,
      value: data.value,
      usageLimit: data.usageLimit ?? null,
      usageCount: 0,
      expiresAt: data.expiresAt ?? null,
    })
    .returning()
  return created
}

/**
 * Update an existing discount code scoped to merchant (Invariant 1).
 */
export async function updateDiscountCode(
  merchantId: string,
  id: string,
  data: {
    code?: string
    discountType?: "fixed" | "percent"
    value?: string
    usageLimit?: number | null
    expiresAt?: Date | null
  }
) {
  const existing = await getDiscountCodeById(merchantId, id)
  if (!existing) {
    throw new Error("Discount code not found.")
  }

  const updates: Partial<typeof discountCodes.$inferInsert> = {
    ...data,
    code: data.code ? data.code.trim().toUpperCase() : undefined,
    updatedAt: new Date(),
  }

  const [updated] = await db
    .update(discountCodes)
    .set(updates)
    .where(
      and(
        eq(discountCodes.merchantId, merchantId),
        eq(discountCodes.id, id)
      )
    )
    .returning()
  return updated
}

/**
 * Delete a discount code scoped to merchant (Invariant 1).
 */
export async function deleteDiscountCode(merchantId: string, id: string) {
  const existing = await getDiscountCodeById(merchantId, id)
  if (!existing) {
    throw new Error("Discount code not found.")
  }

  await db
    .delete(discountCodes)
    .where(
      and(
        eq(discountCodes.merchantId, merchantId),
        eq(discountCodes.id, id)
      )
    )
}
