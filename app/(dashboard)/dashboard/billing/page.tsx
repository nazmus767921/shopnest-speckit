import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getAllPlans } from "@/db/queries/plans"
import {
  getSubscriptionByMerchantId,
  getSubscriptionPayments,
  getMerchantUsageCounts,
} from "@/db/queries/subscriptions"
import { SubscriptionOverview } from "./components/SubscriptionOverview"

import { Suspense } from "react"

export const metadata = {
  title: "Billing & Plan — ShopNest Dashboard",
  description: "View your subscription status, plan details, and payment history.",
}

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingPageSkeleton />}>
      <BillingPageContent />
    </Suspense>
  )
}

async function BillingPageContent() {
  const session = await auth.api.getSession({ headers: await headers() })
  const merchant = session ? await getMerchantByOwnerId(session.user.id) : null

  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-shade-50">Merchant account not found.</p>
      </div>
    )
  }

  const [subscription, payments, usageCounts, plans] = await Promise.all([
    getSubscriptionByMerchantId(merchant.id),
    getSubscriptionPayments(merchant.id),
    getMerchantUsageCounts(merchant.id),
    getAllPlans(),
  ])

  // Format payments for type safety
  const formattedPayments = payments.map((p) => ({
    id: p.id,
    amountPaisa: p.amountPaisa,
    paymentMethod: p.paymentMethod,
    transactionId: p.transactionId,
    status: p.status,
    months: p.months,
    paidAt: p.paidAt,
  }))

  return (
    <div className="flex flex-col gap-8 animate-fade-in max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="pb-2 border-b border-hairline-light">
        <h1 className="font-display text-heading-xl tracking-tight text-ink font-semibold leading-none">
          Billing &amp; Plan
        </h1>
        <p className="text-caption text-shade-50 font-light mt-1">
          View your subscription status, plan limits, and payment history.
        </p>
      </div>

      <SubscriptionOverview
        merchant={merchant}
        subscription={subscription ?? null}
        usageCounts={usageCounts}
        plans={plans}
        payments={formattedPayments}
      />
    </div>
  )
}

function BillingPageSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="pb-2 border-b border-hairline-light">
        <div className="h-8 w-48 bg-shade-30 rounded-full" />
        <div className="h-4 w-64 bg-shade-30 rounded-full mt-2" />
      </div>

      {/* Subscription Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-48 bg-shade-30 rounded-2xl" />
        <div className="h-48 bg-shade-30 rounded-2xl" />
      </div>

      {/* Payment History Skeleton */}
      <div className="flex flex-col gap-4">
        <div className="h-6 w-36 bg-shade-30 rounded-full" />
        <div className="h-32 bg-shade-30 rounded-2xl w-full" />
      </div>
    </div>
  )
}
