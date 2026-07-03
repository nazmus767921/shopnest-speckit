import React from "react"
import { getMerchants, getSubscriptionPaymentsHistory } from "@/db/queries/admin"
import { getAllPlansAdmin } from "@/db/queries/plans"
import { SubscriptionsClient } from "./SubscriptionsClient"

export const metadata = {
  title: "Subscription Payments — ShopNest Super Admin",
  description: "Manually record bKash/Nagad subscription payments and view platform payment logs.",
}

import { getMerchantUsageCounts } from "@/db/queries/subscriptions"

export default async function AdminSubscriptionsPage() {
  const [merchantsList, paymentsHistory, plansList] = await Promise.all([
    getMerchants(),
    getSubscriptionPaymentsHistory(),
    getAllPlansAdmin(),
  ])

  // Format Dates and fetch counts for clientside JSON parsing compatibility
  const serializedMerchants = await Promise.all(
    merchantsList.map(async (m) => {
      const counts = await getMerchantUsageCounts(m.id)
      return {
        id: m.id,
        name: m.name,
        subdomain: m.subdomain,
        plan: m.plan,
        subscriptionStatus: m.subscriptionStatus,
        productsCount: counts.productsCount,
        monthlyOrdersCount: counts.monthlyOrdersCount,
        owner: m.owner
          ? {
              name: m.owner.name,
              email: m.owner.email,
            }
          : null,
      }
    })
  )

  const serializedPayments = paymentsHistory.map((p) => ({
    ...p,
    paidAt: p.paidAt.toISOString(),
    featuresAtPaymentTime: p.featuresAtPaymentTime ?? null,
  }))

  const serializedPlans = plansList.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    pricePaisa: p.pricePaisa,
    features: p.features,
    isArchived: p.isArchived,
  }))

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="pb-2 border-b border-hairline-light">
        <h1 className="font-display text-heading-xl tracking-tight text-ink font-semibold leading-none">
          Subscription Payments
        </h1>
        <p className="text-caption text-shade-50 font-light mt-1">
          Record cash/mobile transaction collections and review the subscription payment history logs.
        </p>
      </div>

      <SubscriptionsClient
        merchants={serializedMerchants}
        initialPayments={serializedPayments}
        plans={serializedPlans}
      />
    </div>
  )
}
