import { db } from "@/db"
import { merchants, user, subscriptions, subscriptionPayments, subscriptionPlans } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

/**
 * Fetch all merchants joined with owner details and subscription status.
 */
export async function getMerchants() {
  return await db
    .select({
      id: merchants.id,
      name: merchants.name,
      subdomain: merchants.subdomain,
      plan: merchants.plan,
      subscriptionStatus: merchants.subscriptionStatus,
      trialExpiry: merchants.trialExpiry,
      owner: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      subscription: {
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
      },
    })
    .from(merchants)
    .leftJoin(user, eq(merchants.ownerId, user.id))
    .leftJoin(subscriptions, eq(merchants.id, subscriptions.merchantId))
    .orderBy(desc(merchants.name))
}

/**
 * Activate or suspend a merchant's store.
 */
export async function updateMerchantStatus(
  merchantId: string,
  status: "trial" | "active" | "suspended" | "cancelled"
) {
  // Update merchants table status
  await db
    .update(merchants)
    .set({ subscriptionStatus: status })
    .where(eq(merchants.id, merchantId))

  // Update subscriptions table status if exists
  await db
    .update(subscriptions)
    .set({ status: status, updatedAt: new Date() })
    .where(eq(subscriptions.merchantId, merchantId))
}

/**
 * Update a merchant's trial expiry date.
 */
export async function overrideTrialExpiry(merchantId: string, newExpiryDate: Date) {
  await db
    .update(merchants)
    .set({ trialExpiry: newExpiryDate })
    .where(eq(merchants.id, merchantId))
}

/**
 * Record a manual bKash/Nagad subscription payment.
 * Automatically creates or extends the merchant's subscription record by 30 days
 * and sets the merchant status to 'active'.
 */
export async function recordSubscriptionPayment(data: {
  merchantId: string
  plan: string
  planId?: string
  amountPaisa: number
  paymentMethod: string
  transactionId: string
  recordedBy: string | null
  paidAt: Date
  status?: string
  months?: number
  /** Plan features locked in at the time of payment — used to write the subscription snapshot. */
  featuresAtPaymentTime?: import("@/lib/plans/types").PlanFeatures
}) {
  const monthsCount = data.months ?? 1
  const paymentStatus = data.status ?? "verified"

  return await db.transaction(async (tx) => {
    // 1. Insert subscription payment
    const paymentId = crypto.randomUUID()
    await tx.insert(subscriptionPayments).values({
      id: paymentId,
      merchantId: data.merchantId,
      amountPaisa: data.amountPaisa,
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId,
      status: paymentStatus,
      months: monthsCount,
      targetPlan: data.plan,
      targetPlanId: data.planId || null,
      recordedBy: data.recordedBy,
      paidAt: data.paidAt,
      featuresAtPaymentTime: data.featuresAtPaymentTime ?? null,
    })

    // 2. Find existing subscription
    const existing = await tx.query.subscriptions.findFirst({
      where: eq(subscriptions.merchantId, data.merchantId),
    })

    const now = new Date()
    let newPeriodStart = now
    let newPeriodEnd = new Date(now.getTime() + monthsCount * 30 * 24 * 60 * 60 * 1000) // + (months * 30) days

    if (existing) {
      // If active subscription exists and is in the future, extend from that end date
      if (existing.status === "active" && existing.currentPeriodEnd && existing.currentPeriodEnd > now) {
        newPeriodStart = existing.currentPeriodStart || now
        newPeriodEnd = new Date(existing.currentPeriodEnd.getTime() + monthsCount * 30 * 24 * 60 * 60 * 1000)
      }

      // Update existing subscription
      await tx
        .update(subscriptions)
        .set({
          plan: data.plan,
          planId: data.planId || null,
          status: "active",
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, existing.id))
    } else {
      // Insert new subscription
      const subId = crypto.randomUUID()
      await tx.insert(subscriptions).values({
        id: subId,
        merchantId: data.merchantId,
        plan: data.plan,
        planId: data.planId || null,
        status: "active",
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
      })
    }

    // 3. Update merchants table
    await tx
      .update(merchants)
      .set({
        plan: data.plan,
        subscriptionStatus: "active",
      })
      .where(eq(merchants.id, data.merchantId))

    // 4. Write subscription snapshot from locked-in features (if provided)
    // This ensures the merchant's resolved limits reflect what they paid for,
    // not the potentially-changed live plan definition.
    if (data.featuresAtPaymentTime) {
      const { writeSubscriptionSnapshot } = await import("@/db/queries/subscriptions")
      await writeSubscriptionSnapshot(data.merchantId, data.featuresAtPaymentTime)
    }

    return { success: true }
  })
}

export async function getSubscriptionPaymentsHistory() {
  return await db
    .select({
      id: subscriptionPayments.id,
      amountPaisa: subscriptionPayments.amountPaisa,
      paymentMethod: subscriptionPayments.paymentMethod,
      transactionId: subscriptionPayments.transactionId,
      paidAt: subscriptionPayments.paidAt,
      recordedBy: subscriptionPayments.recordedBy,
      status: subscriptionPayments.status,
      months: subscriptionPayments.months,
      targetPlan: subscriptionPayments.targetPlan,
      targetPlanId: subscriptionPayments.targetPlanId,
      featuresAtPaymentTime: subscriptionPayments.featuresAtPaymentTime,
      merchantId: merchants.id,
      merchantName: merchants.name,
      merchantSubdomain: merchants.subdomain,
      merchantPlan: merchants.plan,
      recordedByName: user.name,
    })
    .from(subscriptionPayments)
    .leftJoin(merchants, eq(subscriptionPayments.merchantId, merchants.id))
    .leftJoin(user, eq(subscriptionPayments.recordedBy, user.id))
    .orderBy(desc(subscriptionPayments.paidAt))
}

export async function verifySubscriptionPayment(paymentId: string, verifiedByUserId: string, months: number = 1) {
  return await db.transaction(async (tx) => {
    // 1. Get payment and merchant details
    const payment = await tx.query.subscriptionPayments.findFirst({
      where: eq(subscriptionPayments.id, paymentId),
    })
    
    if (!payment) throw new Error("Payment not found")
    if (payment.status !== "pending") throw new Error("Payment is not pending")
    
    const merchant = await tx.query.merchants.findFirst({
      where: eq(merchants.id, payment.merchantId),
    })
    
    if (!merchant) throw new Error("Merchant not found")

    // Determine plan to apply (fallback to current merchant plan if targetPlan not specified)
    let planId = payment.targetPlanId
    let planSlug = payment.targetPlan

    if (!planId && payment.targetPlan) {
      const p = await tx.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.slug, payment.targetPlan),
      })
      if (p) {
        planId = p.id
        planSlug = p.slug
      }
    }

    if (!planId) {
      const sub = await tx.query.subscriptions.findFirst({
        where: eq(subscriptions.merchantId, merchant.id),
      })
      if (sub?.planId) {
        planId = sub.planId
        planSlug = sub.plan
      } else {
        const p = await tx.query.subscriptionPlans.findFirst({
          where: eq(subscriptionPlans.slug, merchant.plan),
        })
        if (p) {
          planId = p.id
          planSlug = p.slug
        }
      }
    }

    const finalPlanSlug = planSlug || merchant.plan || "starter"

    // 2. Update payment status
    await tx
      .update(subscriptionPayments)
      .set({
        status: "verified",
        months: months,
        recordedBy: verifiedByUserId, // Mark who verified it
        paidAt: new Date(),
      })
      .where(eq(subscriptionPayments.id, paymentId))

    // 3. Find existing subscription
    const existing = await tx.query.subscriptions.findFirst({
      where: eq(subscriptions.merchantId, merchant.id),
    })

    const now = new Date()
    let newPeriodStart = now
    let newPeriodEnd = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000) // + (months * 30) days

    if (existing) {
      if (existing.status === "active" && existing.currentPeriodEnd && existing.currentPeriodEnd > now) {
        newPeriodStart = existing.currentPeriodStart || now
        newPeriodEnd = new Date(existing.currentPeriodEnd.getTime() + months * 30 * 24 * 60 * 60 * 1000)
      }

      await tx
        .update(subscriptions)
        .set({
          status: "active",
          plan: finalPlanSlug,
          planId: planId || null,
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, existing.id))
    } else {
      const subId = crypto.randomUUID()
      await tx.insert(subscriptions).values({
        id: subId,
        merchantId: merchant.id,
        plan: finalPlanSlug,
        planId: planId || null,
        status: "active",
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
      })
    }

    // 4. Update merchants table
    await tx
      .update(merchants)
      .set({
        subscriptionStatus: "active",
        plan: finalPlanSlug,
      })
      .where(eq(merchants.id, merchant.id))

    return { success: true }
  })
}

export async function rejectSubscriptionPayment(paymentId: string, rejectedByUserId: string) {
  await db
    .update(subscriptionPayments)
    .set({
      status: "rejected",
      recordedBy: rejectedByUserId,
      paidAt: new Date(),
    })
    .where(eq(subscriptionPayments.id, paymentId))
}
