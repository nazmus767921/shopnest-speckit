import React from "react"
import { getMerchants } from "@/db/queries/admin"
import { MerchantsClient } from "./MerchantsClient"

export const metadata = {
  title: "Merchant Directory — ShopNest Super Admin",
  description: "View and manage merchant accounts, trial periods, and store access.",
}

export default async function AdminMerchantsPage() {
  const merchantsList = await getMerchants()

  // Format Dates for clientside JSON parsing compatibility
  const serializedMerchants = merchantsList.map((m) => ({
    ...m,
    trialExpiry: m.trialExpiry ? m.trialExpiry.toISOString() : null,
    subscription: m.subscription
      ? {
          currentPeriodStart: m.subscription.currentPeriodStart
            ? m.subscription.currentPeriodStart.toISOString()
            : null,
          currentPeriodEnd: m.subscription.currentPeriodEnd
            ? m.subscription.currentPeriodEnd.toISOString()
            : null,
        }
      : null,
  }))

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="pb-2 border-b border-hairline-light">
        <h1 className="font-display text-heading-xl tracking-tight text-ink font-semibold leading-none">
          Merchant Directory
        </h1>
        <p className="text-caption text-shade-50 font-light mt-1">
          Manage boutique stores, subscription status, and trial configurations.
        </p>
      </div>

      <MerchantsClient initialMerchants={serializedMerchants} />
    </div>
  )
}
