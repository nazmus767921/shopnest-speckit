import { db } from "@/db"
import { merchants, subscriptions } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function createMerchant(data: {
  id: string
  name: string
  subdomain: string
  ownerId: string
  plan: string
  planId?: string
  trialExpiry: Date
}) {
  return await db.transaction(async (tx) => {
    const [merchant] = await tx.insert(merchants).values({
      id: data.id,
      name: data.name,
      subdomain: data.subdomain,
      ownerId: data.ownerId,
      plan: data.plan,
      subscriptionStatus: "trial",
      trialExpiry: data.trialExpiry,
    }).returning()
    
    await tx.insert(subscriptions).values({
      id: crypto.randomUUID(),
      merchantId: data.id,
      plan: data.plan,
      planId: data.planId || null,
      status: "trial",
      currentPeriodStart: new Date(),
      currentPeriodEnd: data.trialExpiry,
    })
    
    return merchant
  })
}

export async function getMerchantBySubdomain(subdomain: string) {
  return await db.query.merchants.findFirst({
    where: eq(merchants.subdomain, subdomain),
  })
}

export async function getMerchantByOwnerId(ownerId: string) {
  return await db.query.merchants.findFirst({
    where: eq(merchants.ownerId, ownerId),
  })
}

export async function updateMerchant(
  id: string,
  data: Partial<Omit<typeof merchants.$inferInsert, "subdomain">> & { subdomain?: string }
) {
  if (data.subdomain !== undefined) {
    throw new Error("Invariant Violation: Subdomain is immutable after creation.")
  }
  return await db
    .update(merchants)
    .set(data)
    .where(eq(merchants.id, id))
    .returning()
}

export async function getMerchantById(id: string) {
  return await db.query.merchants.findFirst({
    where: eq(merchants.id, id),
  })
}

/**
 * Update only the allowed merchant store settings fields.
 * Invariant 5: subdomain is explicitly excluded and cannot be changed.
 */
export async function updateStoreSettings(
  merchantId: string,
  data: {
    name?: string
    phoneNumber?: string | null
    bkashNumber?: string | null
    nagadNumber?: string | null
    lowStockThresholdDefault?: number
  }
) {
  const [updated] = await db
    .update(merchants)
    .set({
      name: data.name,
      phoneNumber: data.phoneNumber,
      bkashNumber: data.bkashNumber,
      nagadNumber: data.nagadNumber,
      lowStockThresholdDefault: data.lowStockThresholdDefault,
    })
    .where(eq(merchants.id, merchantId))
    .returning()

  return updated
}

export async function updateStorefrontLayout(
  merchantId: string,
  data: {
    heroImageUrl?: string | null
    subtitle?: string | null
    storeDescription?: string | null
    storeAddress?: string | null
    socialLinks?: Record<string, string> | null
    customFaqs?: Array<{ question: string; answer: string }> | null
  }
) {
  const [updated] = await db
    .update(merchants)
    .set({
      heroImageUrl: data.heroImageUrl,
      subtitle: data.subtitle,
      storeDescription: data.storeDescription,
      storeAddress: data.storeAddress,
      socialLinks: data.socialLinks,
      customFaqs: data.customFaqs,
    })
    .where(eq(merchants.id, merchantId))
    .returning()

  return updated
}

