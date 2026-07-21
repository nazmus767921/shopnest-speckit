"use server"

import { db } from "@/db"
import { merchantThemes } from "@/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { getMerchantByOwnerId } from "@/db/queries/merchants"

const LayoutSchema = z.array(
  z.object({
    id: z.string(),
    type: z.string(),
    settings: z.record(z.string(), z.any()).default({}),
  })
)

export async function saveLayout(layoutData: unknown) {
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
    
    const activeLayout = LayoutSchema.parse(layoutData)
    
    await db
      .update(merchantThemes)
      .set({ activeLayout })
      .where(eq(merchantThemes.merchantId, merchantId))
      
    revalidatePath('/', 'layout')
      
    return { success: true }
  } catch (error: any) {
    console.error("Failed to save layout:", error)
    return { success: false, error: error.message || "Failed to save layout" }
  }
}
