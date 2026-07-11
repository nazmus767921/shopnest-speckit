"use server"

import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getCachedStorefrontSections } from "@/lib/cache/storefront"
import { saveStorefrontSections } from "@/db/queries/storefront-sections"
import { updateStorefrontSectionsSchema } from "@/lib/validations/storefront-sections"
import { defaultStorefrontSections } from "@/lib/storefront-sections/defaults"
import { revalidateTag } from "next/cache"

export async function saveStorefrontSectionsAction(rawSections: any) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const merchant = await getMerchantByOwnerId(session.user.id)
    if (!merchant) {
      return { success: false, error: "Merchant not found" }
    }

    const parseResult = updateStorefrontSectionsSchema.safeParse(rawSections)
    if (!parseResult.success) {
      return { success: false, error: "Validation error: " + parseResult.error.issues[0].message }
    }

    await saveStorefrontSections(merchant.id, parseResult.data)

    revalidateTag(`storefront-${merchant.id}`, "max")

    return { success: true }
  } catch (error: any) {
    console.error("Failed to save storefront sections:", error)
    return { success: false, error: "Internal server error" }
  }
}

export async function seedDefaultSectionsAction() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session?.user) {
      return { success: false, error: "Unauthorized" }
    }

    const merchant = await getMerchantByOwnerId(session.user.id)
    if (!merchant) {
      return { success: false, error: "Merchant not found" }
    }

    // Check if merchant already has sections
    const existingSections = await getCachedStorefrontSections(merchant.id, false)
    if (existingSections.length > 0) {
      return { success: true, seeded: false }
    }

    // Seed defaults
    await saveStorefrontSections(merchant.id, defaultStorefrontSections)
    
    revalidateTag(`storefront-${merchant.id}`, "max")

    return { success: true, seeded: true }
  } catch (error: any) {
    console.error("Failed to seed default sections:", error)
    return { success: false, error: "Internal server error" }
  }
}
