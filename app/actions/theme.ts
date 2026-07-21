"use server"

import { db } from "@/db"
import { merchantThemes } from "@/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { getMerchantByOwnerId } from "@/db/queries/merchants"

export async function applyTheme(themeId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session) {
      throw new Error("Unauthorized")
    }

    const merchant = await getMerchantByOwnerId(session.user.id)
    if (!merchant) {
      throw new Error("Merchant not found")
    }

    const merchantId = merchant.id

    // Check if a row exists
    const existing = await db.query.merchantThemes.findFirst({
      where: eq(merchantThemes.merchantId, merchantId)
    })

    if (existing) {
      await db.update(merchantThemes)
        .set({ themeId })
        .where(eq(merchantThemes.merchantId, merchantId))
    } else {
      await db.insert(merchantThemes).values({
        merchantId,
        themeId,
        activeLayout: [],
      })
    }

    revalidatePath('/', 'layout')
    
    return { success: true }
  } catch (error: any) {
    console.error("Failed to apply theme:", error)
    return { success: false, error: error.message || "Failed to apply theme" }
  }
}
