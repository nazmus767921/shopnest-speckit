"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId, updateStoreSettings, updateMerchantTemplate, updateThemeSettings } from "@/db/queries/merchants"
import { storeSettingsSchema } from "@/lib/validations/settings"

import { revalidatePath } from "next/cache"

import { getMerchantPlan } from "@/lib/plans/getPlan"

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
    const { storeSettingsSchema } = await import("@/lib/validations/settings")
    const merchant = await getAuthenticatedMerchant()
    const result = storeSettingsSchema.safeParse(values)

    if (!result.success) {
      throw new Error(result.error.issues[0].message)
    }

    // Invariant 7: Subscription plan limits and features are checked on the server side
    const plan = await getMerchantPlan(merchant.id)
    const isCodRequested = result.data.codEnabled || result.data.payDeliveryChargeFirst
    if (isCodRequested && !plan?.features?.cod) {
      throw new Error("Upgrade plan to enable Cash on Delivery.")
    }

    const updated = await updateStoreSettings(merchant.id, {
      name: result.data.name,
      phoneNumber: result.data.phoneNumber || null,
      bkashNumber: result.data.bkashNumber || null,
      nagadNumber: result.data.nagadNumber || null,
      lowStockThresholdDefault: result.data.lowStockThresholdDefault,
      codEnabled: result.data.codEnabled,
      payDeliveryChargeFirst: result.data.payDeliveryChargeFirst,
      bkashWalletNumber: result.data.bkashWalletNumber || null,
      nagadWalletNumber: result.data.nagadWalletNumber || null,
    })

    revalidatePath("/dashboard/settings")
    return { success: true, merchant: updated }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update settings." }
  }
}



export async function getAvailableTemplatesAction() {
  try {
    const { getActiveTemplates } = await import("@/db/queries/templates")
    const merchant = await getAuthenticatedMerchant()
    const plan = await getMerchantPlan(merchant.id)
    const tier = plan?.slug || "starter"

    const templates = await getActiveTemplates()

    const mappedTemplates = templates.map((t) => {
      const allowed = t.allowedTiers as string[]
      const isLocked = Array.isArray(allowed) && !allowed.includes(tier)
      return {
        id: t.id,
        slug: t.slug,
        name: t.name,
        description: t.description,
        previewImageUrl: t.previewImageUrl,
        businessTypes: t.businessTypes,
        allowedTiers: t.allowedTiers,
        isLocked,
      }
    })

    return { success: true, templates: mappedTemplates }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to retrieve templates." }
  }
}

export async function applyTemplateAction(templateSlug: string) {
  try {
    const { getTemplateBySlug } = await import("@/db/queries/templates")
    const merchant = await getAuthenticatedMerchant()
    const plan = await getMerchantPlan(merchant.id)
    const tier = plan?.slug || "starter"

    const template = await getTemplateBySlug(templateSlug)
    if (!template || !template.isActive) {
      throw new Error("The selected template is not active or does not exist.")
    }

    const allowed = template.allowedTiers as string[]
    if (Array.isArray(allowed) && !allowed.includes(tier)) {
      throw new Error(`Your current plan does not support the ${template.name} template. Please upgrade.`)
    }

    const updated = await updateMerchantTemplate(merchant.id, templateSlug)

    revalidatePath("/dashboard/settings")
    return { success: true, merchant: updated }
  } catch (err: any) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to apply template" }
  }
}

export async function updateThemeSettingsAction(themeSettings: any) {
  try {
    const merchant = await getAuthenticatedMerchant()
    await updateThemeSettings(merchant.id, themeSettings)
    
    // Purge everything related to this merchant from cache
    revalidatePath("/dashboard/templates")
    revalidatePath("/", "layout") // Revalidate entire app to ensure storefront picks it up
    
    return { success: true }
  } catch (err: any) {
    console.error("Failed to update theme settings", err)
    return { success: false, error: err.message || "Failed to update theme settings" }
  }
}
