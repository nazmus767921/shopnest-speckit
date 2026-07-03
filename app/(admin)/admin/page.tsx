import React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui"
import { SystemOverviewCard } from "../components/SystemOverviewCard"
import { Shield, Users, Server, Zap, Play, TrendingUp, AlertCircle, CreditCard } from "lucide-react"
import { db } from "@/db"
import { merchants, user, subscriptionPayments } from "@/db/schema"
import { eq, count, gte, and, desc } from "drizzle-orm"
import Link from "next/link"

export const metadata = {
  title: "Admin Overview — ShopNest Super Admin",
  description: "Monitor platform merchants, subscriptions, and system status.",
}

import { Suspense } from "react"
import { headers } from "next/headers"

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminOverviewContent />
    </Suspense>
  )
}

async function AdminOverviewContent() {
  await headers() // trigger dynamic request-time rendering
  const now = new Date()


  // Fetch real platform metrics
  const [totalMerchantsResult] = await db
    .select({ value: count() })
    .from(merchants)
  const totalMerchants = totalMerchantsResult?.value ?? 0

  const [activeTrialsResult] = await db
    .select({ value: count() })
    .from(merchants)
    .where(
      and(
        eq(merchants.subscriptionStatus, "trial"),
        gte(merchants.trialExpiry, now)
      )
    )
  const activeTrials = activeTrialsResult?.value ?? 0

  const [activeSubsResult] = await db
    .select({ value: count() })
    .from(merchants)
    .where(eq(merchants.subscriptionStatus, "active"))
  const activeSubscriptions = activeSubsResult?.value ?? 0

  // Fetch active plan breakdowns
  const [activeStarterResult] = await db
    .select({ value: count() })
    .from(merchants)
    .where(
      and(
        eq(merchants.subscriptionStatus, "active"),
        eq(merchants.plan, "starter")
      )
    )
  const activeStarter = activeStarterResult?.value ?? 0

  const [activeGrowthResult] = await db
    .select({ value: count() })
    .from(merchants)
    .where(
      and(
        eq(merchants.subscriptionStatus, "active"),
        eq(merchants.plan, "growth")
      )
    )
  const activeGrowth = activeGrowthResult?.value ?? 0

  // Fetch suspended and plan breakdowns across all merchants
  const [suspendedResult] = await db
    .select({ value: count() })
    .from(merchants)
    .where(eq(merchants.subscriptionStatus, "suspended"))
  const suspendedMerchants = suspendedResult?.value ?? 0

  const [starterPlanResult] = await db
    .select({ value: count() })
    .from(merchants)
    .where(eq(merchants.plan, "starter"))
  const starterPlanCount = starterPlanResult?.value ?? 0

  const [growthPlanResult] = await db
    .select({ value: count() })
    .from(merchants)
    .where(eq(merchants.plan, "growth"))
  const growthPlanCount = growthPlanResult?.value ?? 0

  // Calculate estimated monthly revenue (Starter: ৳499, Growth: ৳1499)
  const estimatedMRR = (activeStarter * 499) + (activeGrowth * 1499)

  // Fetch 3 most recent merchants joined with owner profile details
  const recentMerchants = await db
    .select({
      id: merchants.id,
      name: merchants.name,
      subdomain: merchants.subdomain,
      plan: merchants.plan,
      subscriptionStatus: merchants.subscriptionStatus,
      ownerName: user.name,
      ownerEmail: user.email,
    })
    .from(merchants)
    .leftJoin(user, eq(merchants.ownerId, user.id))
    .orderBy(desc(user.createdAt))
    .limit(3)

  // Fetch 3 most recent manual subscription payments recorded
  const recentPayments = await db
    .select({
      id: subscriptionPayments.id,
      amountPaisa: subscriptionPayments.amountPaisa,
      paymentMethod: subscriptionPayments.paymentMethod,
      transactionId: subscriptionPayments.transactionId,
      paidAt: subscriptionPayments.paidAt,
      merchantName: merchants.name,
    })
    .from(subscriptionPayments)
    .leftJoin(merchants, eq(subscriptionPayments.merchantId, merchants.id))
    .orderBy(desc(subscriptionPayments.paidAt))
    .limit(3)

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display-md font-semibold text-ink tracking-tight leading-tight">
          System Overview
        </h1>
        <p className="text-body-md text-shade-50 font-light">
          Monitor platform status, active merchants, and subscription payments.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SystemOverviewCard
          title="Boutique Registry"
          value={totalMerchants}
          description="Total registered boutique stores"
          icon={Users}
          footer={
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-micro font-medium bg-canvas-cream border border-hairline-light text-shade-70">
                {starterPlanCount} Starter
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-micro font-medium bg-canvas-cream border border-hairline-light text-shade-70">
                {growthPlanCount} Growth
              </span>
              {suspendedMerchants > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-micro font-semibold bg-red-50 border border-red-100 text-red-700">
                  {suspendedMerchants} Suspended
                </span>
              )}
            </div>
          }
        />

        <SystemOverviewCard
          title="Active Trials"
          value={activeTrials}
          description="Boutiques in 7-day onboarding trial"
          icon={Play}
          iconBgClass="bg-amber-50 text-amber-800 border border-amber-100"
          iconTextClass="text-amber-805"
          footer={
            <div className="flex items-center gap-1.5 text-micro text-shade-50">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Trial limit checks enforced server-side</span>
            </div>
          }
        />

        <SystemOverviewCard
          title="Active Subs"
          value={activeSubscriptions}
          description="Paid plans active on platform"
          icon={Zap}
          iconBgClass="bg-emerald-50 text-emerald-800 border border-emerald-100"
          iconTextClass="text-emerald-805"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-800" />
                <span className="text-micro font-bold text-emerald-900 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full">
                  Est. MRR: ৳{estimatedMRR.toLocaleString("en-BD")}
                </span>
              </div>
              <span className="text-micro text-shade-50 font-light">manual bKash/Nagad</span>
            </div>
          }
        />
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Merchant Registrations */}
        <Card variant="default" className="border border-hairline-light bg-canvas-light p-6 flex flex-col gap-4 rounded-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-hairline-light">
            <h2 className="text-heading-md font-display font-semibold text-ink">
              Recent Registrations
            </h2>
            <Link
              href="/admin/merchants"
              className="text-caption font-semibold text-primary hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-hairline-light">
            {recentMerchants.length === 0 ? (
              <span className="text-center py-6 text-shade-40 font-light text-caption">
                No recent merchant registrations.
              </span>
            ) : (
              recentMerchants.map((merchant) => (
                <div key={merchant.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-ink text-body-strong truncate">{merchant.name}</span>
                    <span className="text-micro text-shade-50 truncate mt-0.5">
                      {merchant.ownerName ?? "Unknown Owner"} ({merchant.ownerEmail ?? "No email"})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-micro font-medium px-2.5 py-0.5 rounded-full bg-canvas-cream border border-hairline-light text-shade-70 uppercase tracking-tight">
                      {merchant.plan}
                    </span>
                    <span className={`text-micro font-semibold px-2 py-0.5 rounded-full border ${
                      merchant.subscriptionStatus === "active" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                      merchant.subscriptionStatus === "trial" ? "bg-amber-50 text-amber-800 border-amber-100" :
                      "bg-zinc-150 text-zinc-650 border-zinc-250"
                    }`}>
                      {merchant.subscriptionStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Subscription Payments */}
        <Card variant="default" className="border border-hairline-light bg-canvas-light p-6 flex flex-col gap-4 rounded-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-hairline-light">
            <h2 className="text-heading-md font-display font-semibold text-ink">
              Recent Payments Logs
            </h2>
            <Link
              href="/admin/subscriptions"
              className="text-caption font-semibold text-primary hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-hairline-light">
            {recentPayments.length === 0 ? (
              <span className="text-center py-6 text-shade-40 font-light text-caption">
                No subscription payments recorded yet.
              </span>
            ) : (
              recentPayments.map((payment) => (
                <div key={payment.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-ink text-body-strong truncate">{payment.merchantName ?? "Deleted Store"}</span>
                    <span className="text-micro text-shade-50 truncate mt-0.5">
                      Method: <span className="uppercase">{payment.paymentMethod}</span> | TxID: <span className="font-mono text-shade-60">{payment.transactionId}</span>
                    </span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-caption font-bold text-emerald-800 bg-emerald-50 border border-emerald-100/50 px-2.5 py-0.5 rounded-full">
                      ৳{(payment.amountPaisa / 100).toLocaleString("en-BD")}
                    </span>
                    <span className="text-[10px] text-shade-40 font-light mt-1">
                      {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("en-BD", { month: "short", day: "numeric" }) : ""}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function AdminPageSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 bg-shade-30 rounded-full" />
        <div className="h-4.5 w-80 bg-shade-30 rounded-full mt-1" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-36 bg-shade-30 rounded-2xl" />
        <div className="h-36 bg-shade-30 rounded-2xl" />
        <div className="h-36 bg-shade-30 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-80 bg-shade-30 rounded-2xl" />
        <div className="h-80 bg-shade-30 rounded-2xl" />
      </div>
    </div>
  )
}
