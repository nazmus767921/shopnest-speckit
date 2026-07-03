"use client"

import React, { useState } from "react"
import {
  CreditCard,
  Zap,
  Star,
  AlertTriangle,
  Box,
  RefreshCw,
  Lock,
  LockOpen,
  Calendar,
  HelpCircle,
  Package,
  Receipt,
  FolderOpen,
  Layers,
  Image as ImageIcon,
  HardDrive,
  Percent,
  Send,
  Coins,
  Check
} from "lucide-react"
import { Card } from "@/components/ui/layout/Card"
import { Badge } from "@/components/ui"
import { SubmitPaymentForm } from "./SubmitPaymentForm"
import { PaymentHistoryTable } from "./PaymentHistoryTable"

interface Merchant {
  name: string
  plan: string
  subscriptionStatus: string
  trialExpiry: Date | null
}

interface Subscription {
  plan: string
  status: string
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
  snapshotProductLimit: number | null
  snapshotCategoryLimit: number | null
  snapshotDiscountLimit: number | null
  snapshotImagesPerProduct: number | null
  snapshotImageSizeMb: number | null
  snapshotOrdersPerMonth: number | null
}

interface UsageCounts {
  productsCount: number
  monthlyOrdersCount: number
}

interface PlanItem {
  id: string
  name: string
  slug: string
  pricePaisa: number
  isArchived: boolean
  features: {
    max_products: number | null
    max_orders_per_month: number | null
    max_categories: number | null
    max_variants_per_product: number | null
    max_images_per_product: number | null
    image_size_limit_mb: number | null
    discount_codes: boolean
    telegram_notifications: boolean
    cod: boolean
  }
}

interface Payment {
  id: string
  amountPaisa: number
  paymentMethod: string
  transactionId: string
  status: string
  months: number
  paidAt: Date
}

interface SubscriptionOverviewProps {
  merchant: Merchant
  subscription: Subscription | null
  usageCounts: UsageCounts
  plans: PlanItem[]
  payments: Payment[]
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getDaysRemaining(targetDate: Date | null | undefined): number {
  if (!targetDate) return 0
  const diffTime = new Date(targetDate).getTime() - new Date().getTime()
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    trial: "Free Trial",
    active: "Active",
    suspended: "Suspended",
    cancelled: "Cancelled",
  }

  const badgeStyles: Record<string, string> = {
    trial: "bg-blue-50 text-blue-800 border border-blue-200",
    active: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    suspended: "bg-red-50 text-red-800 border border-red-200",
    cancelled: "bg-zinc-100 text-zinc-600 border border-zinc-205",
  }

  const label = labels[status] ?? status
  const style = badgeStyles[status] ?? "bg-zinc-100 text-zinc-600 border border-zinc-205"

  return (
    <Badge className={`capitalize font-semibold ${style}`}>
      {label}
    </Badge>
  )
}

export function SubscriptionOverview({ merchant, subscription, usageCounts, plans, payments }: SubscriptionOverviewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "compare">("overview")

  const plan = merchant.plan
  const status = merchant.subscriptionStatus
  const activePlans = plans.filter(p => !p.isArchived)
  const currentPlanObj = plans.find(p => p.slug === plan)

  // Track the target compare plan (default to the first other plan, or Starter if none)
  const [selectedComparePlan, setSelectedComparePlan] = useState<string>(() => {
    const otherPlans = activePlans.filter(p => p.slug !== plan)
    return otherPlans.length > 0 ? otherPlans[0].slug : (activePlans.length > 0 ? activePlans[0].slug : "starter")
  })

  // Active limits (taking snapshot/grandfathered columns into account)
  const activeProductLimit = subscription && subscription.snapshotProductLimit !== null
    ? subscription.snapshotProductLimit
    : (currentPlanObj ? currentPlanObj.features.max_products : (plan === "starter" ? 50 : null))

  const activeOrderLimit = subscription && subscription.snapshotOrdersPerMonth !== null
    ? subscription.snapshotOrdersPerMonth
    : (currentPlanObj ? currentPlanObj.features.max_orders_per_month : (plan === "starter" ? 200 : null))

  const activeCategoryLimit = subscription && subscription.snapshotCategoryLimit !== null
    ? subscription.snapshotCategoryLimit
    : (currentPlanObj ? currentPlanObj.features.max_categories : (plan === "starter" ? 5 : null))

  const activeImagesLimit = subscription && subscription.snapshotImagesPerProduct !== null
    ? subscription.snapshotImagesPerProduct
    : (currentPlanObj ? currentPlanObj.features.max_images_per_product : 5)

  const activeImageSizeLimit = subscription && subscription.snapshotImageSizeMb !== null
    ? subscription.snapshotImageSizeMb
    : (currentPlanObj ? currentPlanObj.features.image_size_limit_mb : 2)

  const activeDiscountCodes = subscription && subscription.snapshotDiscountLimit !== null
    ? subscription.snapshotDiscountLimit !== 0
    : (currentPlanObj ? currentPlanObj.features.discount_codes : false)

  // Current official limits of the plan (from database subscriptionPlan config)
  const planProductLimit = currentPlanObj ? currentPlanObj.features.max_products : (plan === "starter" ? 50 : null)
  const planOrderLimit = currentPlanObj ? currentPlanObj.features.max_orders_per_month : (plan === "starter" ? 200 : null)
  const planCategoryLimit = currentPlanObj ? currentPlanObj.features.max_categories : (plan === "starter" ? 5 : null)
  const planImagesLimit = currentPlanObj ? currentPlanObj.features.max_images_per_product : 5
  const planImageSizeLimit = currentPlanObj ? currentPlanObj.features.image_size_limit_mb : 2
  const planDiscountCodes = currentPlanObj ? currentPlanObj.features.discount_codes : false

  // Detect grandfathered limits
  const isGrandfatheredProductLimit = subscription && subscription.snapshotProductLimit !== null && subscription.snapshotProductLimit !== planProductLimit
  const isGrandfatheredOrderLimit = subscription && subscription.snapshotOrdersPerMonth !== null && subscription.snapshotOrdersPerMonth !== planOrderLimit
  const isGrandfatheredCategoryLimit = subscription && subscription.snapshotCategoryLimit !== null && subscription.snapshotCategoryLimit !== planCategoryLimit
  const isGrandfatheredImagesLimit = subscription && subscription.snapshotImagesPerProduct !== null && subscription.snapshotImagesPerProduct !== planImagesLimit
  const isGrandfatheredImageSizeLimit = subscription && subscription.snapshotImageSizeMb !== null && subscription.snapshotImageSizeMb !== planImageSizeLimit
  const isGrandfatheredDiscountCodes = subscription && subscription.snapshotDiscountLimit !== null && (subscription.snapshotDiscountLimit !== 0) !== planDiscountCodes

  const isGrandfathered = isGrandfatheredProductLimit || isGrandfatheredOrderLimit || isGrandfatheredCategoryLimit || isGrandfatheredImagesLimit || isGrandfatheredImageSizeLimit || isGrandfatheredDiscountCodes

  const planName = currentPlanObj?.name ?? (plan === "starter" ? "Starter Plan" : plan === "growth" ? "Growth Plan" : plan)
  const pricePaisa = currentPlanObj?.pricePaisa ?? (plan === "growth" ? 99900 : 49900)

  const productPercent = activeProductLimit === null ? 0 : Math.min((usageCounts.productsCount / activeProductLimit) * 100, 100)
  const orderPercent = activeOrderLimit === null ? 0 : Math.min((usageCounts.monthlyOrdersCount / activeOrderLimit) * 100, 100)

  const isLowStockWarning = activeProductLimit !== null && usageCounts.productsCount >= activeProductLimit * 0.8
  const isLowOrderWarning = activeOrderLimit !== null && usageCounts.monthlyOrdersCount >= activeOrderLimit * 0.8

  // Calculate Transition Diffs for selected comparison target plan
  const selectedPlanObj = activePlans.find(p => p.slug === selectedComparePlan)
  const targetFeatures = selectedPlanObj?.features

  const diffs: { type: "gain" | "loss"; text: string }[] = []
  if (selectedPlanObj && targetFeatures) {
    // Products
    const currP = activeProductLimit
    const targP = targetFeatures.max_products
    if (currP !== targP) {
      if (targP === null) {
        diffs.push({ type: "gain", text: `Unlimited active products (previously limited to ${currP})` })
      } else if (currP === null) {
        diffs.push({ type: "loss", text: `Active product limit will decrease to ${targP} (currently unlimited)` })
      } else if (targP > currP) {
        diffs.push({ type: "gain", text: `Increase active product limit from ${currP} to ${targP}` })
      } else {
        diffs.push({ type: "loss", text: `Active product limit will decrease from ${currP} to ${targP}` })
      }
    }

    // Orders
    const currO = activeOrderLimit
    const targO = targetFeatures.max_orders_per_month
    if (currO !== targO) {
      if (targO === null) {
        diffs.push({ type: "gain", text: `Unlimited monthly orders (previously limited to ${currO})` })
      } else if (currO === null) {
        diffs.push({ type: "loss", text: `Monthly order limit will decrease to ${targO} (currently unlimited)` })
      } else if (targO > currO) {
        diffs.push({ type: "gain", text: `Increase monthly order limit from ${currO} to ${targO}` })
      } else {
        diffs.push({ type: "loss", text: `Monthly order limit will decrease from ${currO} to ${targO}` })
      }
    }

    // Categories
    const currC = activeCategoryLimit
    const targC = targetFeatures.max_categories
    if (currC !== targC) {
      if (targC === null) {
        diffs.push({ type: "gain", text: `Unlimited categories (previously limited to ${currC})` })
      } else if (currC === null) {
        diffs.push({ type: "loss", text: `Categories limit will decrease to ${targC} (currently unlimited)` })
      } else if (targC > currC) {
        diffs.push({ type: "gain", text: `Increase categories limit from ${currC} to ${targC}` })
      } else {
        diffs.push({ type: "loss", text: `Categories limit will decrease from ${currC} to ${targC}` })
      }
    }

    // Images per product
    const currI = activeImagesLimit
    const targI = targetFeatures.max_images_per_product
    if (currI !== targI && currI !== null && targI !== null) {
      if (targI > currI) {
        diffs.push({ type: "gain", text: `Increase allowed images per product from ${currI} to ${targI}` })
      } else if (targI < currI) {
        diffs.push({ type: "loss", text: `Decrease allowed images per product from ${currI} to ${targI}` })
      }
    }

    // Image size limit
    const currS = activeImageSizeLimit
    const targS = targetFeatures.image_size_limit_mb
    if (currS !== targS && currS !== null && targS !== null) {
      if (targS > currS) {
        diffs.push({ type: "gain", text: `Increase image upload size limit from ${currS}MB to ${targS}MB` })
      } else if (targS < currS) {
        diffs.push({ type: "loss", text: `Decrease image upload size limit from ${currS}MB to ${targS}MB` })
      }
    }

    // Discount codes
    if (targetFeatures.discount_codes !== activeDiscountCodes) {
      if (targetFeatures.discount_codes) {
        diffs.push({ type: "gain", text: "Unlock Discount Codes & Promotions capability" })
      } else {
        diffs.push({ type: "loss", text: "Lose Discount Codes & Promotions capability" })
      }
    }

    // Telegram notifications
    const currTel = currentPlanObj?.features.telegram_notifications ?? true
    if (targetFeatures.telegram_notifications !== currTel) {
      if (targetFeatures.telegram_notifications) {
        diffs.push({ type: "gain", text: "Unlock real-time Telegram Order Alerts" })
      } else {
        diffs.push({ type: "loss", text: "Lose access to Telegram Order Alerts" })
      }
    }

    // COD
    const currCod = currentPlanObj?.features.cod ?? true
    if (targetFeatures.cod !== currCod) {
      if (targetFeatures.cod) {
        diffs.push({ type: "gain", text: "Unlock Cash on Delivery checkout support" })
      } else {
        diffs.push({ type: "loss", text: "Lose Cash on Delivery checkout support" })
      }
    }
  }

  // Downgrade blocker validations
  const isDowngradeBlocked = selectedPlanObj ? (() => {
    const maxProducts = selectedPlanObj.features.max_products
    const maxOrders = selectedPlanObj.features.max_orders_per_month
    return (maxProducts !== null && usageCounts.productsCount > maxProducts) ||
           (maxOrders !== null && usageCounts.monthlyOrdersCount > maxOrders)
  })() : false

  const exceedsProductLimit = selectedPlanObj && selectedPlanObj.features.max_products !== null && usageCounts.productsCount > selectedPlanObj.features.max_products
  const exceedsOrderLimit = selectedPlanObj && selectedPlanObj.features.max_orders_per_month !== null && usageCounts.monthlyOrdersCount > selectedPlanObj.features.max_orders_per_month

  return (
    <div className="flex flex-col gap-6 w-full select-text">
      {/* Premium Tabs navigation bar */}
      <div className="flex border-b border-hairline-light">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-6 py-3.5 text-caption font-semibold transition-all cursor-pointer border-b-2 -mb-[2.5px] ${
            activeTab === "overview"
              ? "border-emerald-800 text-ink font-bold"
              : "border-transparent text-shade-50 hover:text-ink hover:border-hairline-light"
          }`}
        >
          Billing &amp; Payments
        </button>
        <button
          onClick={() => setActiveTab("compare")}
          className={`px-6 py-3.5 text-caption font-semibold transition-all cursor-pointer border-b-2 -mb-[2.5px] ${
            activeTab === "compare"
              ? "border-emerald-800 text-ink font-bold"
              : "border-transparent text-shade-50 hover:text-ink hover:border-hairline-light"
          }`}
        >
          Compare &amp; Upgrade Plans
        </button>
      </div>

      {/* Tab Content 1: Billing & Payments (Apple Bento Grid Revamp) */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-8 animate-fade-in">
          {/* Section title */}
          <div className="flex flex-col gap-1">
            <h3 className="text-heading-lg font-display font-semibold text-ink leading-tight">
              Subscription Overview
            </h3>
            <p className="text-caption text-shade-50 font-light mt-0.5">
              Monitor your current active plan parameters, usage counts, and historical transactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Bento Card 1: Current Active Plan (Spans 8 columns) */}
            <Card className="md:col-span-8 p-6 border border-hairline-light bg-canvas-light flex flex-col justify-between rounded-2xl min-h-[220px]">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-zinc-50 rounded-xl border border-hairline-light text-shade-60">
                      {plan === "growth" ? (
                        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                      ) : (
                        <CreditCard className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-micro font-bold text-shade-40 uppercase tracking-wider">
                        Current Plan
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-heading-md font-display font-bold text-ink capitalize">
                          {planName}
                        </span>
                        {isGrandfathered && (
                          <span className="text-[9px] uppercase font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full select-none inline-flex items-center tracking-wider font-sans">
                            Grandfathered
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {/* Price display */}
                <div className="flex items-baseline gap-1 mt-1 pb-4 border-b border-hairline-light">
                  <span className="text-display-md font-bold font-display text-ink leading-none">
                    ৳{(pricePaisa / 100).toLocaleString("en-BD")}
                  </span>
                  <span className="text-caption text-shade-50 font-light">/ month</span>
                </div>
              </div>

              {/* Started, renewal, duration info row */}
              <div className="grid grid-cols-3 gap-4 text-caption pt-4 border-t border-hairline-light/50 mt-2">
                {subscription ? (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" /> Started
                      </span>
                      <span className="font-semibold text-ink mt-0.5">
                        {formatDate(subscription.currentPeriodStart)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" /> Renewal Date
                      </span>
                      <span className="font-semibold text-ink mt-0.5">
                        {formatDate(subscription.currentPeriodEnd)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 shrink-0" /> Next Bill
                      </span>
                      <span className="font-semibold text-ink mt-0.5">
                        {subscription.currentPeriodEnd ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-850 border border-emerald-100 rounded-full inline-block">
                            in {getDaysRemaining(subscription.currentPeriodEnd)}d
                          </span>
                        ) : "—"}
                      </span>
                    </div>
                  </>
                ) : status === "trial" ? (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" /> Started
                      </span>
                      <span className="font-semibold text-ink mt-0.5">
                        {formatDate(new Date(new Date(merchant.trialExpiry || Date.now()).getTime() - 7 * 24 * 60 * 60 * 1000))}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" /> Expiry Date
                      </span>
                      <span className="font-semibold text-ink mt-0.5">
                        {formatDate(merchant.trialExpiry)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 shrink-0" /> Trial Left
                      </span>
                      <span className="font-semibold text-ink mt-0.5">
                        {merchant.trialExpiry ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-805 border border-amber-100 rounded-full inline-block">
                            {getDaysRemaining(merchant.trialExpiry)} days left
                          </span>
                        ) : "—"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="col-span-3 text-shade-50 italic">No billing history details found.</div>
                )}
              </div>
            </Card>

            {/* Bento Card 2: Quick Status Indicator / Trial Card (Spans 4 columns) */}
            <Card className="md:col-span-4 p-6 border border-hairline-light bg-canvas-light flex flex-col justify-between rounded-2xl min-h-[220px]">
              <div className="flex flex-col gap-3">
                <span className="text-micro font-bold text-shade-40 uppercase tracking-wider">
                  Subscription Health
                </span>
                <div className="flex items-center gap-2.5 mt-2">
                  <div className={`w-3.5 h-3.5 rounded-full ${status === "active" ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
                  <span className="text-body-strong font-bold text-ink">
                    {status === "active" ? "Status: Optimal" : "Status: Action Needed"}
                  </span>
                </div>
                <p className="text-caption text-shade-50 leading-relaxed mt-1">
                  {status === "trial" 
                    ? "You are currently running on a trial sandbox instance. Features will restrict when the trial expires."
                    : "Your active service tier is synchronized with manual payment ledgers."
                  }
                </p>
              </div>
              
              {status === "trial" && merchant.trialExpiry ? (
                <div className="text-[10px] font-semibold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-100 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Trial ends in {getDaysRemaining(merchant.trialExpiry)} days</span>
                </div>
              ) : (
                <div className="text-[10px] font-semibold px-3 py-1 bg-emerald-50 text-emerald-850 border border-emerald-100 rounded-lg flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
                  <span>Manually Verified Ledger</span>
                </div>
              )}
            </Card>

            {/* Bento Card 3: Products Quota Usage (Spans 6 columns) */}
            <Card className="md:col-span-6 p-6 border border-hairline-light bg-canvas-light rounded-2xl flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-hairline-light pb-3">
                  <div className="flex items-center gap-2 text-ink">
                    <Package className="h-4.5 w-4.5 text-shade-60" />
                    <span className="text-body-strong font-bold">Products Inventory</span>
                  </div>
                  <span className="text-[10px] font-mono bg-zinc-50 border border-hairline-light px-2 py-0.5 rounded text-shade-60">
                    Quota Allocation
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-caption">
                    <span className="font-semibold text-shade-60">Products Created</span>
                    <span className="font-semibold text-ink">
                      {usageCounts.productsCount} / {activeProductLimit === null ? "∞" : activeProductLimit}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        activeProductLimit !== null && usageCounts.productsCount >= activeProductLimit
                          ? "bg-red-500"
                          : isLowStockWarning
                            ? "bg-amber-500"
                            : "bg-emerald-600"
                      }`}
                      style={{ width: `${activeProductLimit === null ? 100 : productPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {isGrandfatheredProductLimit && (
                <div className="text-micro bg-amber-50/50 text-amber-800 border border-amber-100 p-2.5 rounded-xl">
                  Snapshot Limit grandfathered from purchase. Official live plan limit is {planProductLimit === null ? "∞" : planProductLimit}.
                </div>
              )}
            </Card>

            {/* Bento Card 4: Orders Quota Usage (Spans 6 columns) */}
            <Card className="md:col-span-6 p-6 border border-hairline-light bg-canvas-light rounded-2xl flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-hairline-light pb-3">
                  <div className="flex items-center gap-2 text-ink">
                    <Receipt className="h-4.5 w-4.5 text-shade-60" />
                    <span className="text-body-strong font-bold">Monthly Orders Limit</span>
                  </div>
                  <span className="text-[10px] font-mono bg-zinc-50 border border-hairline-light px-2 py-0.5 rounded text-shade-60">
                    Cycle Reset
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-caption">
                    <span className="font-semibold text-shade-60">Monthly Order Volume</span>
                    <span className="font-semibold text-ink">
                      {usageCounts.monthlyOrdersCount} / {activeOrderLimit === null ? "∞" : activeOrderLimit}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        activeOrderLimit !== null && usageCounts.monthlyOrdersCount >= activeOrderLimit
                          ? "bg-red-500"
                          : isLowOrderWarning
                            ? "bg-amber-500"
                            : "bg-emerald-600"
                      }`}
                      style={{ width: `${activeOrderLimit === null ? 100 : orderPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {isGrandfatheredOrderLimit && (
                <div className="text-micro bg-amber-50/50 text-amber-800 border border-amber-100 p-2.5 rounded-xl">
                  Snapshot Limit grandfathered from purchase. Official live plan limit is {planOrderLimit === null ? "∞" : planOrderLimit}.
                </div>
              )}
            </Card>

            {/* Bento Card 5: Unlocked Capabilities Matrix (Spans 12 columns) */}
            <Card className="md:col-span-12 p-6 border border-hairline-light bg-canvas-light rounded-2xl flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-hairline-light pb-3">
                <Layers className="h-4.5 w-4.5 text-shade-60" />
                <span className="text-body-strong font-bold text-ink">Unlocked Capabilities Matrix</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                <div className="flex items-center gap-2 p-3 bg-zinc-50/50 rounded-xl border border-hairline-light/80 text-caption font-medium text-ink">
                  <LockOpen className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>Subdomain Storefront</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-zinc-50/50 rounded-xl border border-hairline-light/80 text-caption font-medium text-ink">
                  <LockOpen className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>Payments Engine</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-zinc-50/50 rounded-xl border border-hairline-light/80 text-caption font-medium text-ink">
                  {activeDiscountCodes ? (
                    <>
                      <LockOpen className="w-4 h-4 text-emerald-800 shrink-0" />
                      <span>Discounts &amp; Promos</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-shade-40 shrink-0" />
                      <span className="text-shade-50">Discounts &amp; Promos</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 p-3 bg-zinc-50/50 rounded-xl border border-hairline-light/80 text-caption font-medium text-ink">
                  {currentPlanObj?.features.telegram_notifications ? (
                    <>
                      <LockOpen className="w-4 h-4 text-emerald-800 shrink-0" />
                      <span>Telegram Order Alerts</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-shade-40 shrink-0" />
                      <span className="text-shade-50">Telegram Order Alerts</span>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Bento Card 6: Billing Ledger & Payments (Spans 12 columns) */}
            <div className="md:col-span-12 flex flex-col gap-4 mt-4">
              <h2 className="text-heading-lg font-display font-light text-ink">Payment History</h2>
              <PaymentHistoryTable payments={payments} />
            </div>

          </div>
        </div>
      )}

      {/* Tab Content 2: Compare & Upgrade Plans (Senior Apple UI Bento Grid Revamp) */}
      {activeTab === "compare" && (
        <div className="flex flex-col gap-8 animate-fade-in">
          {/* Section 1: Compare Cards Matrix */}
          <div className="flex flex-col gap-1">
            <h3 className="text-heading-lg font-display font-semibold text-ink leading-tight">
              Compare Subscription Plans
            </h3>
            <p className="text-caption text-shade-50 font-light mt-0.5">
              Select one of the tiers below to trigger transition delta analysis and open checkout details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activePlans.map((p) => {
              const isActivePlan = plan === p.slug
              const isSelected = selectedComparePlan === p.slug

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedComparePlan(p.slug)}
                  className={`p-6 border rounded-2xl flex flex-col justify-between transition-all duration-300 select-none cursor-pointer ${
                    isSelected
                      ? "border-emerald-800 bg-emerald-50/5 ring-1 ring-emerald-800"
                      : "border-hairline-light hover:border-shade-40 bg-canvas-light"
                  }`}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col gap-0.5">
                        <h4 className="text-heading-md font-display font-bold text-ink leading-tight">
                          {p.name}
                        </h4>
                        <span className="text-[9px] font-mono text-shade-50 bg-canvas-cream border border-hairline-light rounded px-1.5 py-0.5 mt-1 self-start uppercase tracking-wider font-semibold">
                          {p.slug}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isActivePlan && (
                          <Badge variant="mint" className="font-semibold bg-emerald-50 text-emerald-850 border border-emerald-100 text-[9px] uppercase">
                            Current
                          </Badge>
                        )}
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-emerald-800 flex items-center justify-center text-white shrink-0">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-heading-xl font-bold font-display text-ink leading-none">
                        ৳{(p.pricePaisa / 100).toLocaleString("en-BD")}
                      </span>
                      <span className="text-micro text-shade-40">/ month</span>
                    </div>

                    {/* Resources limits list in comparison cards */}
                    <div className="border-t border-hairline-light/50 pt-4 flex flex-col gap-3 text-caption text-shade-70">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-shade-40 shrink-0" />
                        <span>Products: <strong className="text-ink font-semibold">{p.features.max_products !== null ? `${p.features.max_products} active` : "Unlimited"}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-shade-40 shrink-0" />
                        <span>Orders/Mo: <strong className="text-ink font-semibold">{p.features.max_orders_per_month !== null ? `${p.features.max_orders_per_month}` : "Unlimited"}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-shade-40 shrink-0" />
                        <span>Categories: <strong className="text-ink font-semibold">{p.features.max_categories !== null ? `${p.features.max_categories}` : "Unlimited"}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-shade-40 shrink-0" />
                        <span>Images Limit: <strong className="text-ink font-semibold">{p.features.max_images_per_product} photos</strong></span>
                      </div>
                    </div>

                    {/* Feature tags */}
                    <div className="flex flex-wrap gap-1 mt-1 border-t border-hairline-light/50 pt-3">
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${p.features.discount_codes ? "bg-emerald-50 text-emerald-855 border-emerald-100" : "bg-shade-30/10 text-shade-40 border-hairline-light/50"}`}>
                        % Discounts
                      </span>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${p.features.telegram_notifications ? "bg-emerald-50 text-emerald-855 border-emerald-100" : "bg-shade-30/10 text-shade-40 border-hairline-light/50"}`}>
                        Telegram Alerts
                      </span>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${p.features.cod ? "bg-emerald-50 text-emerald-855 border-emerald-100" : "bg-shade-30/10 text-shade-40 border-hairline-light/50"}`}>
                        COD Support
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-hairline-light/50">
                    <button
                      type="button"
                      className={`text-micro font-bold py-2 rounded-full cursor-pointer transition-colors w-full text-center ${
                        isSelected
                          ? "bg-emerald-800 text-white"
                          : "bg-canvas-cream text-ink border border-hairline-light hover:bg-shade-30"
                      }`}
                    >
                      {isActivePlan ? "Your Current Plan" : isSelected ? "Target Selection" : "Click to Compare"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bento Grid Layout for comparison analysis & Checkout portal */}
          {selectedPlanObj && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Bento Card 2: Plan Transition Analysis (lg:col-span-8) */}
              <div className="lg:col-span-8 h-full">
                <Card className="border border-hairline-light bg-canvas-light p-6 rounded-2xl flex flex-col justify-between h-full">
                  <div className="flex flex-col gap-4 w-full">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline-light pb-4 mb-2">
                      <div className="flex flex-col gap-0.5">
                        <h4 className="text-heading-md font-display font-semibold text-ink">
                          Transition Analysis: {planName} &rarr; {selectedPlanObj.name}
                        </h4>
                        <p className="text-caption text-shade-50">
                          Resource updates and locks applied upon plan switch.
                        </p>
                      </div>

                      <div>
                        {(() => {
                          const delta = (selectedPlanObj.pricePaisa - pricePaisa) / 100
                          if (delta > 0) {
                            return (
                              <span className="inline-flex items-center text-micro font-bold px-3 py-1 bg-emerald-50 text-emerald-855 border border-emerald-100 rounded-full font-mono">
                                UPGRADE (+৳{delta.toLocaleString("en-BD")} / mo)
                              </span>
                            )
                          } else if (delta < 0) {
                            return (
                              <span className="inline-flex items-center text-micro font-bold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-100 rounded-full font-mono">
                                DOWNGRADE (-৳{Math.abs(delta).toLocaleString("en-BD")} / mo)
                              </span>
                            )
                          } else {
                            return (
                              <span className="inline-flex items-center text-micro font-semibold px-3 py-1 bg-zinc-50 border border-hairline-light text-shade-60 rounded-full font-mono">
                                SAME PRICING
                              </span>
                            )
                          }
                        })()}
                      </div>
                    </div>

                    {/* Benefits / Losses display grid */}
                    {selectedComparePlan === plan ? (
                      <div className="text-center py-8 text-caption text-shade-50 italic">
                        This is your current plan. To submit a renewal payment of ৳{(pricePaisa / 100).toLocaleString("en-BD")} for this plan, please use the checkout portal below.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                        {/* Benefits Unlocked */}
                        <div className="flex flex-col gap-3">
                          <span className="text-[10px] uppercase font-bold text-emerald-855 tracking-wider flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded self-start border border-emerald-100 font-sans">
                            <LockOpen className="h-3.5 w-3.5" /> Benefits Gained
                          </span>
                          {diffs.filter(d => d.type === "gain").length > 0 ? (
                            <ul className="space-y-2.5 text-caption">
                              {diffs.filter(d => d.type === "gain").map((d, index) => (
                                <li key={index} className="flex items-start gap-2 text-emerald-855 font-medium leading-tight">
                                  <span className="font-bold text-emerald-700 font-mono mt-0.5 shrink-0 select-none">[+]</span>
                                  <span>{d.text}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-micro text-shade-40 italic mt-1 pl-1">
                              No resources will be expanded or feature capabilities unlocked.
                            </span>
                          )}
                        </div>

                        {/* Losses & Locks */}
                        <div className="flex flex-col gap-3">
                          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded self-start border border-amber-100 font-sans">
                            <Lock className="h-3.5 w-3.5" /> Limits &amp; Feature Locks
                          </span>
                          {diffs.filter(d => d.type === "loss").length > 0 ? (
                            <ul className="space-y-2.5 text-caption">
                              {diffs.filter(d => d.type === "loss").map((d, index) => (
                                <li key={index} className="flex items-start gap-2 text-amber-800 font-medium leading-tight">
                                  <span className="font-bold text-amber-600 font-mono mt-0.5 shrink-0 select-none">[-]</span>
                                  <span>{d.text}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-micro text-shade-40 italic mt-1 pl-1">
                              No features will be locked or limits reduced.
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Blocker alert warning if active counts exceed target */}
                  {isDowngradeBlocked && (
                    <div className="mt-6 p-4 bg-red-50/80 border border-red-200 rounded-xl flex items-start gap-3 text-caption text-red-800 leading-relaxed w-full">
                      <AlertTriangle className="h-5 w-5 text-red-700 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-ink text-body-strong">Active Downgrade Block Triggered</span>
                        <span>
                          Your store's current inventory exceeds the capacities of the selected target plan. Please delete resources to switch to this plan:
                        </span>
                        <ul className="list-disc pl-5 mt-1 font-semibold space-y-1">
                          {exceedsProductLimit && (
                            <li>
                              Your store has <strong>{usageCounts.productsCount}</strong> products (exceeds {selectedPlanObj.name} limit of {selectedPlanObj.features.max_products}). Delete at least <strong>{usageCounts.productsCount - (selectedPlanObj.features.max_products || 0)}</strong> products.
                            </li>
                          )}
                          {exceedsOrderLimit && (
                            <li>
                              Your store has processed <strong>{usageCounts.monthlyOrdersCount}</strong> orders this month (exceeds {selectedPlanObj.name} limit of {selectedPlanObj.features.max_orders_per_month}).
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Bento Card 3: Guide & Process (lg:col-span-4) */}
              <div className="lg:col-span-4 h-full">
                <Card className="border border-hairline-light bg-canvas-light p-6 rounded-2xl flex flex-col justify-between h-full gap-4">
                  <div className="flex flex-col gap-3">
                    <h4 className="text-heading-md font-display font-semibold text-ink flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-shade-40" /> Upgrade Process Guide
                    </h4>
                    <p className="text-caption text-shade-60 leading-relaxed">
                      Plan adjustments are verified manually. To request this switch:
                    </p>
                    <ol className="list-decimal pl-4.5 space-y-2 text-caption text-shade-70">
                      <li>Confirm the target plan (e.g. <strong>{selectedPlanObj.name}</strong>).</li>
                      <li>Use the manual payment portal below to scan the QR code and transfer the fee.</li>
                      <li>Insert your transaction code (TxID) in Step 3 of the checkout wizard.</li>
                      <li>Our administrative queue will process and active your limits.</li>
                    </ol>
                  </div>
                  <div className="border-t border-hairline-light/50 pt-3 text-micro text-shade-50">
                    * Downgrades will only be processed if your resource counts comply with target plan restrictions.
                  </div>
                </Card>
              </div>

              {/* Bento Card 4: Checkout Portal (Manual Payment Wizard) (lg:col-span-12) */}
              <div className="lg:col-span-12 border border-hairline-light rounded-2xl bg-canvas-light p-6 mt-2">
                <div className="w-full flex flex-col gap-6 select-text">
                  
                  {isDowngradeBlocked ? (
                    <div className="p-6 border border-red-100 rounded-2xl bg-red-50/15 text-center flex flex-col items-center justify-center min-h-[220px] gap-2">
                      <Lock className="h-8 w-8 text-red-750 mb-1" />
                      <span className="font-semibold text-ink text-body-strong">Checkout Portal Locked</span>
                      <span className="text-caption text-shade-50 max-w-sm leading-normal">
                        Please resolve the limit blocker errors detailed in the Transition Analysis panel to activate manual billing submission for {selectedPlanObj.name}.
                      </span>
                    </div>
                  ) : (
                    <SubmitPaymentForm
                      key={`compare-${selectedComparePlan}`}
                      usageCounts={usageCounts}
                      currentPlan={plan}
                      plans={plans}
                      preselectedPlanSlug={selectedComparePlan}
                    />
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  )
}
