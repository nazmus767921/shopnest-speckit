import { db } from "@/db"
import { subscriptionPlans } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import type { PlanFeatures } from "@/lib/plans/types"
import { cacheTag, cacheLife } from "next/cache"

/** Get all non-archived plans, ordered by price ascending. Used on marketing + onboarding pages. */
export async function getAllPlans() {
  'use cache'
  cacheTag("subscription-plans")
  cacheLife("days")
  return await db.query.subscriptionPlans.findMany({
    where: eq(subscriptionPlans.isArchived, false),
    orderBy: [asc(subscriptionPlans.pricePaisa)],
  })
}

/** Get all plans including archived ones — super admin only, no cache. */
export async function getAllPlansAdmin() {
  return await db.query.subscriptionPlans.findMany({
    orderBy: [asc(subscriptionPlans.pricePaisa)],
  })
}

/** Get a single plan by ID. */
export async function getPlanById(planId: string) {
  return await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.id, planId),
  })
}

/** Create a new plan. */
export async function createPlan(data: {
  name: string; slug: string; pricePaisa: number; features: PlanFeatures
}) {
  const [plan] = await db.insert(subscriptionPlans)
    .values({ id: crypto.randomUUID(), ...data, isActive: true, isArchived: false })
    .returning()
  return plan
}

/** Update a plan's editable fields. Slug is excluded — it is immutable after creation. */
export async function updatePlan(planId: string, data: {
  name?: string; pricePaisa?: number; features?: PlanFeatures
}) {
  const [plan] = await db.update(subscriptionPlans)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subscriptionPlans.id, planId))
    .returning()
  return plan
}

/** Soft-delete a plan. Merchants on this plan retain access; it is hidden from the onboarding picker. */
export async function archivePlan(planId: string) {
  const [plan] = await db.update(subscriptionPlans)
    .set({ isArchived: true, isActive: false, updatedAt: new Date() })
    .where(eq(subscriptionPlans.id, planId))
    .returning()
  return plan
}

/** Restore a previously archived plan. */
export async function unarchivePlan(planId: string) {
  const [plan] = await db.update(subscriptionPlans)
    .set({ isArchived: false, isActive: true, updatedAt: new Date() })
    .where(eq(subscriptionPlans.id, planId))
    .returning()
  return plan
}
