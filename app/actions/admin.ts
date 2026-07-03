"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import {
  updateMerchantStatus,
  overrideTrialExpiry,
  recordSubscriptionPayment,
} from "@/db/queries/admin"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/db"
import { subscriptionPayments, subscriptionPlans, subscriptions, merchants } from "@/db/schema"
import { sendPlanChangedEmail } from "@/lib/email"
import type { DowngradeViolation } from "@/lib/plans/validateDowngrade"
import type { PlanFeatures } from "@/lib/plans/types"
import { eq } from "drizzle-orm"

// Helper to assert admin user role
async function assertAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    throw new Error("Unauthorized. Please log in.")
  }
  const isAdmin = session.user.role === "admin" || session.user.email === "admin@shopnest.com.bd"
  if (!isAdmin) {
    throw new Error("Forbidden. Access restricted to platform admins.")
  }
  return session
}

/**
 * Toggle merchant status (Activate or Suspend)
 */
export async function updateMerchantStatusAction(params: {
  merchantId: string
  status: "trial" | "active" | "suspended" | "cancelled"
}) {
  try {
    await assertAdmin()
    
    const schema = z.object({
      merchantId: z.string().min(1),
      status: z.enum(["trial", "active", "suspended", "cancelled"]),
    })

    const parsed = schema.parse(params)

    await updateMerchantStatus(parsed.merchantId, parsed.status)
    
    revalidatePath("/admin/merchants")
    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update merchant status." }
  }
}

/**
 * Override trial expiry date
 */
export async function overrideTrialExpiryAction(params: {
  merchantId: string
  trialExpiry: string // ISO string
}) {
  try {
    await assertAdmin()

    const schema = z.object({
      merchantId: z.string().min(1),
      trialExpiry: z.string().datetime(),
    })

    const parsed = schema.parse(params)

    await overrideTrialExpiry(parsed.merchantId, new Date(parsed.trialExpiry))

    revalidatePath("/admin/merchants")
    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to override trial expiry." }
  }
}

/**
 * Record a manual bKash/Nagad/Bank subscription payment
 */
export async function recordSubscriptionPaymentAction(params: {
  merchantId: string
  targetPlanId: string
  amountTaka: number
  paymentMethod: string
  transactionId: string
  paidAt: string // ISO string
  months?: number
}) {
  try {
    const session = await assertAdmin()

    const schema = z.object({
      merchantId: z.string().min(1),
      targetPlanId: z.string().min(1),
      amountTaka: z.number().positive(),
      paymentMethod: z.string().min(1),
      transactionId: z.string().min(3),
      paidAt: z.string().datetime(),
      months: z.number().int().min(1).max(12).optional(),
    })

    const parsed = schema.parse(params)

    const targetPlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, parsed.targetPlanId),
    })
    if (!targetPlan) throw new Error("Plan not found.")

    const { getMerchantUsageCounts } = await import("@/db/queries/subscriptions")
    const counts = await getMerchantUsageCounts(parsed.merchantId)
    const limits = targetPlan.features

    if (limits.max_products !== null && counts.productsCount > limits.max_products) {
      throw new Error(`Cannot record payment: Boutique has ${counts.productsCount} products, which exceeds the ${targetPlan.name} plan limit of ${limits.max_products}.`)
    }
    if (limits.max_orders_per_month !== null && counts.monthlyOrdersCount > limits.max_orders_per_month) {
      throw new Error(`Cannot record payment: Boutique has ${counts.monthlyOrdersCount} orders this month, which exceeds the ${targetPlan.name} plan limit of ${limits.max_orders_per_month}.`)
    }

    const amountPaisa = Math.round(parsed.amountTaka * 100)
    const monthsCount = parsed.months ?? 1

    await recordSubscriptionPayment({
      merchantId: parsed.merchantId,
      plan: targetPlan.slug,
      planId: targetPlan.id,
      amountPaisa,
      paymentMethod: parsed.paymentMethod,
      transactionId: parsed.transactionId,
      recordedBy: session.user.id,
      paidAt: new Date(parsed.paidAt),
      status: "verified",
      months: monthsCount,
      // Snapshot features at the time of recording so the subscription snapshot
      // is always written from this locked-in value, not the live plan.
      featuresAtPaymentTime: targetPlan.features,
    })

    revalidatePath("/admin/subscriptions")
    revalidatePath("/admin/merchants")
    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to record subscription payment." }
  }
}

import { verifySubscriptionPayment, rejectSubscriptionPayment } from "@/db/queries/admin"

export async function verifySubscriptionPaymentAction(params: { paymentId: string, months: number }) {
  try {
    const session = await assertAdmin()
    
    const schema = z.object({
      paymentId: z.string().min(1),
      months: z.number().int().min(1).max(12),
    })

    const parsed = schema.parse(params)

    const payment = await db.query.subscriptionPayments.findFirst({
      where: eq(subscriptionPayments.id, parsed.paymentId),
    })
    if (!payment) throw new Error("Payment not found")

    let targetPlan = null
    if (payment.targetPlanId) {
      targetPlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, payment.targetPlanId),
      })
    } else if (payment.targetPlan) {
      targetPlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.slug, payment.targetPlan),
      })
    }

    // Resolve which features to use for limit validation and snapshot writing.
    // Priority: features locked at payment submission > live plan definition.
    // This ensures a merchant always gets the limits they saw when they paid,
    // even if the plan was edited between submission and admin verification.
    const featuresForVerification =
      (payment.featuresAtPaymentTime as PlanFeatures | null) ??
      targetPlan?.features ??
      null

    if (featuresForVerification) {
      const { getMerchantUsageCounts } = await import("@/db/queries/subscriptions")
      const counts = await getMerchantUsageCounts(payment.merchantId)

      // Note: we do NOT throw here even if counts exceed limits — the admin UI
      // already shows a soft warning. Blocking would prevent verifying a payment
      // that is legitimate (the plan may have been tightened after submission).
      // Enforcement is handled by the soft-cap in getMerchantPlan.
    }

    await verifySubscriptionPayment(parsed.paymentId, session.user.id, parsed.months)

    if (targetPlan && featuresForVerification) {
      const { writeSubscriptionSnapshot } = await import("@/db/queries/subscriptions")
      await writeSubscriptionSnapshot(payment.merchantId, featuresForVerification)

      // Also sync merchants.plan and subscriptions.plan_id
      await db.update(subscriptions).set({ planId: targetPlan.id, plan: targetPlan.slug }).where(eq(subscriptions.merchantId, payment.merchantId))
      await db.update(merchants).set({ plan: targetPlan.slug }).where(eq(merchants.id, payment.merchantId))
    } else if (targetPlan) {
      // Fallback: no featuresAtPaymentTime (legacy row) — use live plan features
      const { writeSubscriptionSnapshot } = await import("@/db/queries/subscriptions")
      await writeSubscriptionSnapshot(payment.merchantId, targetPlan.features)

      await db.update(subscriptions).set({ planId: targetPlan.id, plan: targetPlan.slug }).where(eq(subscriptions.merchantId, payment.merchantId))
      await db.update(merchants).set({ plan: targetPlan.slug }).where(eq(merchants.id, payment.merchantId))
    }

    revalidatePath("/admin/subscriptions")
    revalidatePath("/admin/merchants")
    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to verify payment." }
  }
}

export async function rejectSubscriptionPaymentAction(params: { paymentId: string }) {
  try {
    const session = await assertAdmin()
    
    const schema = z.object({
      paymentId: z.string().min(1),
    })

    const parsed = schema.parse(params)

    await rejectSubscriptionPayment(parsed.paymentId, session.user.id)

    revalidatePath("/admin/subscriptions")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reject payment." }
  }
}

const changePlanSchema = z.object({
  merchantId:   z.string().min(1),
  targetPlanId: z.string().min(1),
})

/**
 * Change a merchant's subscription plan instantly.
 * - Blocks downgrade if current resource counts exceed the target plan's limits.
 * - Writes snapshot columns on success.
 * - Sends a plan_changed email to the merchant's registered email.
 */
export async function changeMerchantPlanAction(params: {
  merchantId: string
  targetPlanId: string
}): Promise<{ success: boolean; errors?: DowngradeViolation[]; error?: string }> {
  try {
    await assertAdmin()

    const parsed = changePlanSchema.parse(params)

    // 1. Fetch target plan
    const targetPlan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, parsed.targetPlanId),
    })
    if (!targetPlan) throw new Error("Target plan not found.")
    if (targetPlan.isArchived) throw new Error("Cannot assign an archived plan to a merchant.")

    // 2. Get full merchant resource counts
    const { getMerchantFullUsageCounts } = await import("@/db/queries/subscriptions")
    const counts = await getMerchantFullUsageCounts(parsed.merchantId)

    // 3. Downgrade validation — get current plan to check direction
    const { getMerchantPlan } = await import("@/lib/plans/getPlan")
    const currentPlan = await getMerchantPlan(parsed.merchantId)
    const isDowngrade =
      currentPlan !== null &&
      targetPlan.pricePaisa < currentPlan.pricePaisa

    if (isDowngrade) {
      const { validateDowngrade } = await import("@/lib/plans/validateDowngrade")
      const violations = validateDowngrade(counts, targetPlan.features, targetPlan.name)
      if (violations.length > 0) {
        return { success: false, errors: violations }
      }
    }

    // 4. Update subscription: plan_id, plan slug (legacy), and snapshot
    const { writeSubscriptionSnapshot } = await import("@/db/queries/subscriptions")

    await db
      .update(subscriptions)
      .set({
        planId:    targetPlan.id,
        plan:      targetPlan.slug,   // keep legacy text column in sync
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.merchantId, parsed.merchantId))

    await writeSubscriptionSnapshot(parsed.merchantId, targetPlan.features)

    // 5. Also sync merchants.plan for legacy fallback consistency
    await db
      .update(merchants)
      .set({ plan: targetPlan.slug })
      .where(eq(merchants.id, parsed.merchantId))

    // 6. Send plan_changed email to merchant (fire-and-forget — Invariant 6)
    sendPlanChangedEmail({
      merchantId: parsed.merchantId,
      newPlanName: targetPlan.name,
      features: targetPlan.features,
      pricePaisa: targetPlan.pricePaisa,
    }).catch((err) => {
      console.error("[changeMerchantPlanAction] Failed to send plan_changed email:", err)
    })

    revalidatePath("/admin/merchants")
    revalidatePath("/admin/subscriptions")
    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to change merchant plan." }
  }
}
