import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui"
import {
  Store,
  ShoppingBag,
  Plus,
  Globe,
  Tag,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { db } from "@/db"
import { orders, products, paymentConfirmations, shippingZones } from "@/db/schema"
import { eq, and, isNull, sum, count, ne, exists, or, inArray } from "drizzle-orm"
import { DashboardChecklist } from "@/components/dashboard/DashboardChecklist"
import { Suspense } from "react"

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <DashboardPageContent />
    </Suspense>
  )
}

async function DashboardPageContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const merchant = session ? await getMerchantByOwnerId(session.user.id) : null
  const storeName = merchant?.name || "Boutique Store"

  // Get current date formatted nicely
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Fetch real metrics if merchant exists
  let totalSalesTaka = 0
  let activeProductsCount = 0
  let activeOrdersCount = 0
  let pendingOrdersCount = 0
  let completedOrdersCount = 0
  let hasShippingConfigured = false

  if (merchant) {
    // 1. Total Sales: Sum of totalPaisa for orders of this merchant in 'processing', 'shipped', 'delivered'
    const [totalSalesResult] = await db
      .select({ value: sum(orders.totalPaisa) })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchant.id),
          inArray(orders.status, ["processing", "shipped", "delivered"])
        )
      )
    const totalSalesPaisa = Number(totalSalesResult?.value || 0)
    totalSalesTaka = totalSalesPaisa / 100

    // 2. Active Products: Count of non-deleted products
    const [activeProductsResult] = await db
      .select({ value: count() })
      .from(products)
      .where(
        and(
          eq(products.merchantId, merchant.id),
          isNull(products.deletedAt)
        )
      )
    activeProductsCount = activeProductsResult?.value || 0

    // 3. Orders status count (excluding drafts)
    const existsConfirmation = exists(
      db
        .select()
        .from(paymentConfirmations)
        .where(eq(paymentConfirmations.orderId, orders.id))
    )

    const statusCounts = await db
      .select({
        status: orders.status,
        count: count(),
      })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchant.id),
          or(
            ne(orders.status, "pending_payment"),
            existsConfirmation
          )
        )
      )
      .groupBy(orders.status)

    const counts: Record<string, number> = {
      pending_payment: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    }

    for (const row of statusCounts) {
      counts[row.status] = row.count
    }

    activeOrdersCount = counts.pending_payment + counts.processing + counts.shipped
    pendingOrdersCount = counts.pending_payment
    completedOrdersCount = counts.delivered

    // 4. Check if merchant has configured any shipping zones
    const [shippingZonesResult] = await db
      .select({ value: count() })
      .from(shippingZones)
      .where(eq(shippingZones.merchantId, merchant.id))
    hasShippingConfigured = (shippingZonesResult?.value || 0) > 0
  }

  const isTrial = merchant?.subscriptionStatus === "trial"

  return (
    <div className="flex flex-col gap-8 animate-fade-in text-ink select-text">
      {/* Dynamic Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4.5 border-b border-hairline-light">
        <div className="flex flex-col gap-1.5">
          <span className="text-micro font-bold text-shade-40 uppercase tracking-wider">
            {currentDate}
          </span>
          <h1 className="font-display text-display-md tracking-tight font-semibold leading-tight">
            Welcome back, {session?.user?.name || "Merchant"}
          </h1>
        </div>

        <Link
          href="/dashboard/products/new"
          className="inline-flex w-full md:w-fit items-center justify-center font-sans font-semibold rounded-full bg-primary text-on-primary hover:bg-shade-70 active:bg-shade-70 py-2.5 px-6 text-caption transition-all duration-200 self-start md:self-center gap-2 cursor-pointer select-none"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Add Product
        </Link>
      </div>

      {/* Premium Statistics Bento Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bento Card 1: Total Sales */}
        <Card className="border border-hairline-light bg-canvas-light p-6 flex flex-col justify-between rounded-2xl min-h-[160px] hover:border-shade-40 transition-colors duration-300">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-shade-45 uppercase tracking-wider">Total Sales</span>
              <span className="text-display-sm font-bold font-display text-ink leading-tight">
                ৳{totalSalesTaka.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-2.5 bg-zinc-50 text-shade-60 rounded-xl border border-hairline-light">
              <ShoppingBag className="h-4.5 w-4.5" />
            </div>
          </div>
          <span className="text-micro text-shade-40 font-light mt-4">
            {totalSalesTaka > 0
              ? "Accumulated confirmed revenue."
              : isTrial
                ? "No sales in trial period."
                : "No sales recorded."}
          </span>
        </Card>

        {/* Bento Card 2: Active Products */}
        <Card className="border border-hairline-light bg-canvas-light p-6 flex flex-col justify-between rounded-2xl min-h-[160px] hover:border-shade-40 transition-colors duration-300">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-shade-45 uppercase tracking-wider">Active Products</span>
              <div className="flex items-baseline gap-1">
                <span className="text-display-sm font-bold font-display text-ink leading-tight">{activeProductsCount}</span>
                {merchant?.plan === "starter" && (
                  <span className="text-caption text-shade-45 font-medium">/ 50 limit</span>
                )}
              </div>
            </div>
            <div className="p-2.5 bg-zinc-50 text-shade-60 rounded-xl border border-hairline-light">
              <Store className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            {merchant?.plan === "starter" ? (
              <>
                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-700 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((activeProductsCount / 50) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-micro text-shade-40 font-light">
                  Starter Plan limits: 50 active products
                </span>
              </>
            ) : (
              <span className="text-micro text-shade-40 font-light">
                Growth Plan: Unlimited catalog listings
              </span>
            )}
          </div>
        </Card>

        {/* Bento Card 3: Active Orders */}
        <Card className="border border-hairline-light bg-canvas-light p-6 flex flex-col justify-between rounded-2xl min-h-[160px] hover:border-shade-40 transition-colors duration-300">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-shade-45 uppercase tracking-wider">Active Orders</span>
              <span className="text-display-sm font-bold font-display text-ink leading-tight">{activeOrdersCount}</span>
            </div>
            <div className="p-2.5 bg-zinc-50 text-shade-60 rounded-xl border border-hairline-light">
              <Tag className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-micro text-shade-45">
            <span className="px-2.5 py-0.5 rounded-full bg-canvas-cream border border-hairline-light font-semibold">
              Pending: {pendingOrdersCount}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-50 border border-hairline-light font-semibold">
              Completed: {completedOrdersCount}
            </span>
          </div>
        </Card>
      </div>

      {/* Two Column Onboarding Checklist and Storefront Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Onboarding Checklist */}
        <div className="lg:col-span-7">
          <DashboardChecklist
            activeProductsCount={activeProductsCount}
            hasPaymentConfigured={!!(merchant?.bkashNumber || merchant?.nagadNumber)}
            hasShippingConfigured={hasShippingConfigured}
            subdomain={merchant?.subdomain || ""}
          />
        </div>

        {/* Right Column: Storefront Information */}
        <div className="lg:col-span-5 flex flex-col gap-4" id="storefront-url">
          <h2 className="text-heading-lg font-display font-semibold text-ink leading-snug">
            Storefront URL
          </h2>
          <Card className="border border-hairline-light bg-canvas-light p-6 flex flex-col gap-5 justify-between rounded-2xl min-h-[280px]">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center border border-hairline-light">
                <Globe className="h-6 w-6 text-shade-60" />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider">Live Subdomain URL</span>
                {merchant ? (
                  <div className="flex flex-col gap-2">
                    <a
                      href={`http://${merchant.subdomain}.localhost:3000`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body-lg font-semibold text-primary hover:underline break-all inline-flex items-center gap-1.5 group select-all"
                    >
                      {merchant.subdomain}.shopnest.com.bd
                      <ExternalLink className="h-4 w-4 stroke-[2.5] opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                    </a>
                    <span className="text-caption text-shade-50 font-light leading-relaxed">
                      Copy this URL to share in your Facebook Page about section, Instagram bio, posts, and DMs.
                    </span>
                  </div>
                ) : (
                  <span className="text-body-md text-red-500 font-medium">Not configured.</span>
                )}
              </div>
            </div>

            <div className="border-t border-hairline-light pt-5 flex items-center justify-between gap-4 mt-auto">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-shade-40 uppercase tracking-wider">Subscription Plan</span>
                <span className="text-caption font-bold text-ink">
                  {merchant?.plan === "growth"
                    ? "Growth"
                    : merchant?.subscriptionStatus === "trial"
                      ? "Starter (Free Trial)"
                      : "Starter"}
                </span>
              </div>
              <span className={`text-[10px] font-bold rounded-full px-3 py-1 border uppercase tracking-wider select-none ${
                merchant?.subscriptionStatus === "active" || merchant?.subscriptionStatus === "trial"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}>
                {merchant?.subscriptionStatus || "active"}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function DashboardPageSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse text-ink">
      <div className="flex flex-col gap-2 border-b border-hairline-light pb-6 mt-4">
        <div className="h-4 w-32 bg-shade-30 rounded-full" />
        <div className="h-8 w-64 bg-shade-30 rounded-full mt-1" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-36 bg-shade-30 rounded-2xl" />
        <div className="h-36 bg-shade-30 rounded-2xl" />
        <div className="h-36 bg-shade-30 rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 h-80 bg-shade-30 rounded-2xl" />
        <div className="lg:col-span-5 h-80 bg-shade-30 rounded-2xl" />
      </div>
    </div>
  )
}
