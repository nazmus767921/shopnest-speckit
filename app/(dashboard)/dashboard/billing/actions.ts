"use server"

import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { db } from "@/db"
import { subscriptionPayments, subscriptions, subscriptionPlans } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { revalidatePath } from "next/cache"

import { z } from "zod"

export async function submitPaymentAction(data: {
  paymentMethod: string
  transactionId: string
  targetPlan: string
  targetPlanId?: string
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session?.user) return { error: "Unauthorized" }

    // Validate inputs
    const schema = z.object({
      paymentMethod: z.enum(["bkash", "nagad"]),
      transactionId: z
        .string()
        .min(8, "Transaction ID must be at least 8 characters")
        .regex(/^[a-zA-Z0-9]+$/, "Transaction ID must be alphanumeric"),
      targetPlan: z.string().min(1),
      targetPlanId: z.string().optional(),
    })

    const result = schema.safeParse(data)
    if (!result.success) {
      return { error: result.error.issues[0].message }
    }

    const parsed = result.data

    const merchant = await getMerchantByOwnerId(session.user.id)
    if (!merchant) return { error: "Merchant not found" }

    // Resolve dynamic plan details from database
    let planObj = null
    if (parsed.targetPlanId) {
      planObj = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.id, parsed.targetPlanId),
      })
    } else {
      planObj = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.slug, parsed.targetPlan),
      })
    }

    if (!planObj) return { error: "Target subscription plan not found" }

    // Enforce target plan limits on downgrade/upgrade
    const maxProducts = planObj.features.max_products
    const maxOrders = planObj.features.max_orders_per_month

    const { getMerchantUsageCounts } = await import("@/db/queries/subscriptions")
    const counts = await getMerchantUsageCounts(merchant.id)
    if (maxProducts !== null && counts.productsCount > maxProducts) {
      return { error: `Cannot switch: Your store has ${counts.productsCount} products, which exceeds the ${planObj.name} plan limit of ${maxProducts}.` }
    }
    if (maxOrders !== null && counts.monthlyOrdersCount > maxOrders) {
      return { error: `Cannot switch: Your store has ${counts.monthlyOrdersCount} orders this month, which exceeds the ${planObj.name} plan limit of ${maxOrders}.` }
    }

    // Amount based on the target plan
    const amountPaisa = planObj.pricePaisa

    await db.insert(subscriptionPayments).values({
      id: crypto.randomUUID(),
      merchantId: merchant.id,
      amountPaisa,
      paymentMethod: parsed.paymentMethod,
      transactionId: parsed.transactionId,
      status: "pending",
      targetPlan: parsed.targetPlan,
      targetPlanId: planObj.id,
      // Snapshot the plan features at the exact moment the merchant submitted
      // payment. This protects merchants if the plan is edited before the admin
      // verifies — they still get what they saw and paid for.
      featuresAtPaymentTime: planObj.features,
    })

    revalidatePath("/dashboard/billing")
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "Failed to submit payment" }
  }
}

export async function cancelSubscriptionAction() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session?.user) return { error: "Unauthorized" }

    const merchant = await getMerchantByOwnerId(session.user.id)
    if (!merchant) return { error: "Merchant not found" }

    await db
      .update(subscriptions)
      .set({ status: "cancelled" })
      .where(eq(subscriptions.merchantId, merchant.id))

    revalidatePath("/dashboard/billing")
    return { success: true }
  } catch (err: any) {
    return { error: err.message || "Failed to cancel subscription" }
  }
}
