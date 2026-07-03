"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId, updateStoreSettings, updateStorefrontLayout } from "@/db/queries/merchants"
import { storeSettingsSchema } from "@/lib/validations/settings"
import { storefrontLayoutSchema } from "@/lib/validations/storefront"
import { revalidatePath } from "next/cache"

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

/**
 * Update merchant store settings.
 * Invariant 5: subdomain field is never accepted and cannot be updated.
 */
export async function updateStoreSettingsAction(values: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant()
    const result = storeSettingsSchema.safeParse(values)

    if (!result.success) {
      throw new Error(result.error.issues[0].message)
    }

    const updated = await updateStoreSettings(merchant.id, {
      name: result.data.name,
      phoneNumber: result.data.phoneNumber || null,
      bkashNumber: result.data.bkashNumber || null,
      nagadNumber: result.data.nagadNumber || null,
      lowStockThresholdDefault: result.data.lowStockThresholdDefault,
    })

    revalidatePath("/dashboard/settings")
    return { success: true, merchant: updated }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update settings." }
  }
}

export async function updateStorefrontLayoutAction(values: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant()
    const result = storefrontLayoutSchema.safeParse(values)

    if (!result.success) {
      throw new Error(result.error.issues[0].message)
    }

    const { heroImageUrl, subtitle, storeDescription, storeAddress, socialLinks, customFaqs } = result.data

    const updated = await updateStorefrontLayout(merchant.id, {
      heroImageUrl: heroImageUrl || null,
      subtitle: subtitle || null,
      storeDescription: storeDescription || null,
      storeAddress: storeAddress || null,
      socialLinks: socialLinks || null,
      customFaqs: customFaqs || null,
    })

    revalidatePath("/dashboard/settings")
    return { success: true, merchant: updated }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update storefront layout." }
  }
}
