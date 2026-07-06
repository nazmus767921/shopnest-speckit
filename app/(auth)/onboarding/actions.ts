"use server"

import { z } from "zod"
import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { db } from "@/db"
import { subscriptionPlans, merchants } from "@/db/schema"
import { eq } from "drizzle-orm"
import {
  createMerchant,
  getMerchantBySubdomain,
  getMerchantByOwnerId,
} from "@/db/queries/merchants"

import { onboardingSchema } from "./schema"

export async function createMerchantAction(
  values: z.infer<typeof onboardingSchema>
) {
  try {
    // 1. Get the session server-side
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return { error: "You must be logged in to create a store." }
    }

    // 2. Validate input schemas
    const parsed = onboardingSchema.safeParse(values)
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const { name, subdomain, plan, businessType } = parsed.data

    // Resolve planId from DB using the chosen plan slug
    const chosenPlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.slug, plan),
    })
    if (!chosenPlan) {
      return { error: "Invalid plan selected." }
    }

    // 3. Check if user already owns a store
    const existingOwner = await getMerchantByOwnerId(session.user.id)
    if (existingOwner) {
      return { error: "You have already created a store." }
    }

    // 4. Check if subdomain is unique
    const existingSubdomain = await getMerchantBySubdomain(subdomain)
    if (existingSubdomain) {
      return { error: "This subdomain is already taken. Please choose another." }
    }

    // Resolve template based on business type and plan
    const { resolveTemplateForBusinessType } = await import("@/db/queries/templates")
    const resolvedTemplate = await resolveTemplateForBusinessType(businessType, plan)
    const templateSlug = resolvedTemplate?.slug || "general"

    // 5. Insert new merchant record (14-day trial)
    const trialExpiry = new Date()
    trialExpiry.setDate(trialExpiry.getDate() + 14)

    await createMerchant({
      id: crypto.randomUUID(),
      name,
      subdomain,
      ownerId: session.user.id,
      plan,
      planId: chosenPlan.id,
      trialExpiry,
      template: templateSlug,
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error in createMerchantAction:", error)
    return { error: error.message || "An unexpected error occurred." }
  }
}

export async function resolveAndAssignTemplate(merchantId: string, businessType: string) {
  try {
    const merchant = await db.query.merchants.findFirst({
      where: eq(merchants.id, merchantId),
    })
    if (!merchant) {
      throw new Error("Merchant not found.")
    }

    const { resolveTemplateForBusinessType } = await import("@/db/queries/templates")
    const resolvedTemplate = await resolveTemplateForBusinessType(businessType, merchant.plan)
    const templateSlug = resolvedTemplate?.slug || "general"

    await db
      .update(merchants)
      .set({ template: templateSlug })
      .where(eq(merchants.id, merchantId))

    return { success: true, template: templateSlug }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to resolve and assign template." }
  }
}
