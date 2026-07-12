import React, { Suspense } from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { Loader2Icon } from "@/lib/icons"

import { DashboardChecklist } from "@/components/dashboard/DashboardChecklist"
import { DashboardActionAlerts } from "@/components/dashboard/DashboardActionAlerts"
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs"
import { DashboardAnalytics } from "@/components/dashboard/DashboardAnalytics"
import { RecentOrdersFeed } from "@/components/dashboard/RecentOrdersFeed"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { TrialCountdownBanner } from "@/components/dashboard/TrialCountdownBanner"
import { db } from "@/db"
import { products, shippingZones } from "@/db/schema"
import { eq, count, isNull, and } from "drizzle-orm"

export default function DashboardPage({ searchParams }: { searchParams: { days?: string } }) {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <DashboardPageContent searchParams={searchParams} />
    </Suspense>
  )
}

async function DashboardPageContent({ searchParams }: { searchParams: { days?: string } }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const merchant = session ? await getMerchantByOwnerId(session.user.id) : null
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // We need to fetch data for the checklist condition
  let activeProductsCount = 0
  let hasShippingConfigured = false

  if (merchant) {
    const [activeProductsResult] = await db
      .select({ value: count() })
      .from(products)
      .where(and(eq(products.merchantId, merchant.id), isNull(products.deletedAt)))
    activeProductsCount = activeProductsResult?.value || 0

    const [shippingZonesResult] = await db
      .select({ value: count() })
      .from(shippingZones)
      .where(eq(shippingZones.merchantId, merchant.id))
    hasShippingConfigured = (shippingZonesResult?.value || 0) > 0
  }

  const isFullyOnboarded = activeProductsCount > 0 && 
    (!!merchant?.bkashNumber || !!merchant?.nagadNumber) && 
    hasShippingConfigured

  if (!merchant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold">No merchant found.</h1>
      </div>
    )
  }

  const days = Number(searchParams.days) || 1

  return (
    <div className="flex flex-col gap-8 animate-fade-in text-foreground select-text">
      {/* Header */}
      <DashboardHeader currentDate={currentDate} userName={session?.user.name} />

      {/* Trial Countdown Banner (Top Level) */}
      {merchant?.subscriptionStatus === "trial" && (
        <TrialCountdownBanner trialExpiryDate={merchant.trialExpiry} />
      )}

      {/* Layer 1: Action Alerts */}
      <Suspense fallback={<div className="h-24 bg-muted animate-pulse rounded-xl" />}>
        <DashboardActionAlerts merchantId={merchant.id} />
      </Suspense>

      {/* Layer 2: KPIs Grid */}
      <Suspense fallback={<div className="h-40 bg-muted animate-pulse rounded-xl" />}>
        <DashboardKPIs merchantId={merchant.id} days={days} />
      </Suspense>

      {/* Conditional Checklist */}
      {!isFullyOnboarded && (
        <div className="w-full">
          <DashboardChecklist
            activeProductsCount={activeProductsCount}
            hasPaymentConfigured={!!(merchant.bkashNumber || merchant.nagadNumber)}
            hasShippingConfigured={hasShippingConfigured}
            subdomain={merchant.subdomain || ""}
          />
        </div>
      )}

      {/* Layer 3: Analytics and Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Left Column: Analytics Chart & Top Products */}
        <div className="xl:col-span-2">
          <Suspense fallback={<div className="h-[400px] bg-muted animate-pulse rounded-xl flex items-center justify-center"><Loader2Icon className="w-8 h-8 animate-spin text-muted-foreground" /></div>} key={days}>
            <DashboardAnalytics merchantId={merchant.id} days={days} />
          </Suspense>
        </div>

        {/* Right Column: Recent Orders */}
        <div className="xl:col-span-1 h-[400px]">
          <Suspense fallback={<div className="h-full bg-muted animate-pulse rounded-xl" />}>
            <RecentOrdersFeed merchantId={merchant.id} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function DashboardPageSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse text-foreground">
      <div className="flex flex-col gap-2 border-b border-border pb-6 mt-4">
        <div className="h-4 w-32 bg-muted rounded-full" />
        <div className="h-8 w-64 bg-muted rounded-full mt-1" />
      </div>
      <div className="h-24 bg-muted rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="h-36 bg-muted rounded-xl" />
        <div className="h-36 bg-muted rounded-xl" />
        <div className="h-36 bg-muted rounded-xl" />
        <div className="h-36 bg-muted rounded-xl" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 h-80 bg-muted rounded-xl" />
        <div className="xl:col-span-1 h-80 bg-muted rounded-xl" />
      </div>
    </div>
  )
}
