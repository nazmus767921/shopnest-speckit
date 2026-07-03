"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import {
  getDiscountCodes,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
} from "@/db/queries/discounts"
import { discountCodeSchema } from "@/lib/validations/discounts"
import { revalidatePath } from "next/cache"
import { assertPlanFeature } from "@/lib/plans/assertPlan"

async function getAuthenticatedMerchant() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    throw new Error("Unauthorized. Please log in.")
  }
  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) {
    throw new Error("Merchant account not found.")
  }
  return merchant
}

async function assertDiscountCodes(merchantId: string) {
  await assertPlanFeature(
    merchantId,
    "discount_codes",
    "Discount codes are not available on your current plan. Upgrade to access this feature."
  )
}

export async function getDiscountCodesAction() {
  try {
    const merchant = await getAuthenticatedMerchant()
    const codes = await getDiscountCodes(merchant.id)
    return { success: true, codes, plan: merchant.plan }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch discount codes." }
  }
}

export async function createDiscountCodeAction(values: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant()
    await assertDiscountCodes(merchant.id)

    const result = discountCodeSchema.safeParse(values)
    if (!result.success) {
      throw new Error(result.error.issues[0].message)
    }

    const { code, discountType, value, usageLimit, expiresAt } = result.data
    const created = await createDiscountCode(merchant.id, {
      code,
      discountType,
      value: value.toString(),
      usageLimit: usageLimit ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })

    revalidatePath("/dashboard/discounts")
    return { success: true, code: created }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create discount code." }
  }
}

export async function updateDiscountCodeAction(id: string, values: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant()
    await assertDiscountCodes(merchant.id)

    const result = discountCodeSchema.safeParse(values)
    if (!result.success) {
      throw new Error(result.error.issues[0].message)
    }

    const { code, discountType, value, usageLimit, expiresAt } = result.data
    const updated = await updateDiscountCode(merchant.id, id, {
      code,
      discountType,
      value: value.toString(),
      usageLimit: usageLimit ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })

    revalidatePath("/dashboard/discounts")
    return { success: true, code: updated }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update discount code." }
  }
}

export async function deleteDiscountCodeAction(id: string) {
  try {
    const merchant = await getAuthenticatedMerchant()
    await assertDiscountCodes(merchant.id)

    await deleteDiscountCode(merchant.id, id)

    revalidatePath("/dashboard/discounts")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete discount code." }
  }
}
