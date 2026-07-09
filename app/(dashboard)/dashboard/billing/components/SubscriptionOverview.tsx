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
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SubmitPaymentForm } from "./SubmitPaymentForm"
import { PaymentHistoryTable } from "./PaymentHistoryTable"
import { cn } from "@/lib/utils"

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
    trial: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300",
    active: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300",
    suspended: "bg-destructive/10 text-destructive border-destructive/20",
    cancelled: "bg-muted text-muted-foreground border-border",
  }

  const label = labels[status] ?? status
  const style = badgeStyles[status] ?? "bg-muted text-muted-foreground border-border"

  return (
    <Badge className={cn("capitalize font-semibold border", style)}>
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

  const [selectedComparePlan, setSelectedComparePlan] = useState<string>(() => {
    const otherPlans = activePlans.filter(p => p.slug !== plan)
    return otherPlans.length > 0 ? otherPlans[0].slug : (activePlans.length > 0 ? activePlans[0].slug : "starter")
  })

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

  const planProductLimit = currentPlanObj ? currentPlanObj.features.max_products : (plan === "starter" ? 50 : null)
  const planOrderLimit = currentPlanObj ? currentPlanObj.features.max_orders_per_month : (plan === "starter" ? 200 : null)
  const planCategoryLimit = currentPlanObj ? currentPlanObj.features.max_categories : (plan === "starter" ? 5 : null)
  const planImagesLimit = currentPlanObj ? currentPlanObj.features.max_images_per_product : 5
  const planImageSizeLimit = currentPlanObj ? currentPlanObj.features.image_size_limit_mb : 2
  const planDiscountCodes = currentPlanObj ? currentPlanObj.features.discount_codes : false

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

  const isDowngradeBlocked = selectedPlanObj ? (() => {
    const maxProducts = selectedPlanObj.features.max_products
    const maxOrders = selectedPlanObj.features.max_orders_per_month
    return (maxProducts !== null && usageCounts.productsCount > maxProducts) ||
           (maxOrders !== null && usageCounts.monthlyOrdersCount > maxOrders)
  })() : false

  const exceedsProductLimit = selectedPlanObj && selectedPlanObj.features.max_products !== null && usageCounts.productsCount > selectedPlanObj.features.max_products
  const exceedsOrderLimit = selectedPlanObj && selectedPlanObj.features.max_orders_per_month !== null && usageCounts.monthlyOrdersCount > selectedPlanObj.features.max_orders_per_month

  return (
    <div className="flex flex-col gap-6 w-full select-text text-foreground">
      {/* Premium Tabs navigation bar */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "px-6 py-3.5 text-sm font-semibold transition-all cursor-pointer border-b-2 -mb-[2px]",
            activeTab === "overview"
              ? "border-primary text-foreground font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          Billing &amp; Payments
        </button>
        <button
          onClick={() => setActiveTab("compare")}
          className={cn(
            "px-6 py-3.5 text-sm font-semibold transition-all cursor-pointer border-b-2 -mb-[2px]",
            activeTab === "compare"
              ? "border-primary text-foreground font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          Compare &amp; Upgrade Plans
        </button>
      </div>

      {/* Tab Content 1: Billing & Payments */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-8 animate-fade-in">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold leading-tight">
              Subscription Overview
            </h3>
            <p className="text-sm text-muted-foreground font-light mt-0.5">
              Monitor your current active plan parameters, usage counts, and historical transactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Bento Card 1: Current Active Plan */}
            <Card className="md:col-span-8 p-6 border border-border bg-card flex flex-col justify-between rounded-xl min-h-[220px]">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-muted rounded-xl border border-border text-muted-foreground">
                      {plan === "growth" ? (
                        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                      ) : (
                        <CreditCard className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Current Plan
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-lg font-bold capitalize">
                          {planName}
                        </span>
                        {isGrandfathered && (
                          <span className="text-[9px] uppercase font-bold text-amber-800 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full select-none inline-flex items-center tracking-wider">
                            Grandfathered
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={status} />
                </div>

                <div className="flex items-baseline gap-1 mt-1 pb-4 border-b border-border">
                  <span className="text-3xl font-extrabold leading-none">
                    ৳{(pricePaisa / 100).toLocaleString("en-BD")}
                  </span>
                  <span className="text-sm text-muted-foreground font-light">/ month</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm pt-4 border-t border-border/50 mt-2">
                {subscription ? (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" /> Started
                      </span>
                      <span className="font-semibold text-foreground mt-0.5">
                        {formatDate(subscription.currentPeriodStart)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" /> Renewal Date
                      </span>
                      <span className="font-semibold text-foreground mt-0.5">
                        {formatDate(subscription.currentPeriodEnd)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 shrink-0" /> Next Bill
                      </span>
                      <span className="font-semibold text-foreground mt-0.5">
                        {subscription.currentPeriodEnd ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-350 border border-emerald-500/25 rounded-full inline-block">
                            in {getDaysRemaining(subscription.currentPeriodEnd)}d
                          </span>
                        ) : "—"}
                      </span>
                    </div>
                  </>
                ) : status === "trial" ? (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" /> Started
                      </span>
                      <span className="font-semibold text-foreground mt-0.5">
                        {formatDate(new Date(new Date(merchant.trialExpiry || Date.now()).getTime() - 7 * 24 * 60 * 60 * 1000))}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" /> Expiry Date
                      </span>
                      <span className="font-semibold text-foreground mt-0.5">
                        {formatDate(merchant.trialExpiry)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 shrink-0" /> Trial Left
                      </span>
                      <span className="font-semibold text-foreground mt-0.5">
                        {merchant.trialExpiry ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 rounded-full inline-block">
                            {getDaysRemaining(merchant.trialExpiry)} days left
                          </span>
                        ) : "—"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="col-span-3 text-muted-foreground italic">No billing history details found.</div>
                )}
              </div>
            </Card>

            {/* Bento Card 2: Health / Verification */}
            <Card className="md:col-span-4 p-6 border border-border bg-card flex flex-col justify-between rounded-xl min-h-[220px]">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Subscription Health
                </span>
                <div className="flex items-center gap-2.5 mt-2">
                  <div className={cn("w-3.5 h-3.5 rounded-full", status === "active" ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse")} />
                  <span className="text-sm font-bold text-foreground">
                    {status === "active" ? "Status: Optimal" : "Status: Action Needed"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                  {status === "trial" 
                    ? "You are currently running on a trial sandbox instance. Features will restrict when the trial expires."
                    : "Your active service tier is synchronized with manual payment ledgers."
                  }
                </p>
              </div>
              
              {status === "trial" && merchant.trialExpiry ? (
                <div className="text-[10px] font-semibold px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-350 border border-amber-500/20 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Trial ends in {getDaysRemaining(merchant.trialExpiry)} days</span>
                </div>
              ) : (
                <div className="text-[10px] font-semibold px-3 py-1 bg-emerald-500/10 text-emerald-750 dark:text-emerald-300 border border-emerald-500/25 rounded-lg flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
                  <span>Manually Verified Ledger</span>
                </div>
              )}
            </Card>

            {/* Bento Card 3: Products Quota Usage */}
            <Card className="md:col-span-6 p-6 border border-border bg-card rounded-xl flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <Package className="h-4.5 w-4.5 text-muted-foreground" />
                    <span className="text-sm font-bold">Products Inventory</span>
                  </div>
                  <span className="text-[10px] font-mono bg-muted border border-border px-2 py-0.5 rounded text-muted-foreground">
                    Quota Allocation
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-muted-foreground">Products Created</span>
                    <span className="font-semibold text-foreground">
                      {usageCounts.productsCount} / {activeProductLimit === null ? "∞" : activeProductLimit}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        activeProductLimit !== null && usageCounts.productsCount >= activeProductLimit
                          ? "bg-destructive"
                          : isLowStockWarning
                            ? "bg-amber-500"
                            : "bg-emerald-605"
                      )}
                      style={{ width: `${activeProductLimit === null ? 100 : productPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {isGrandfatheredProductLimit && (
                <div className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-350 border border-amber-500/20 p-2.5 rounded-xl">
                  Snapshot Limit grandfathered from purchase. Official live plan limit is {planProductLimit === null ? "∞" : planProductLimit}.
                </div>
              )}
            </Card>

            {/* Bento Card 4: Orders Quota Usage */}
            <Card className="md:col-span-6 p-6 border border-border bg-card rounded-xl flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <Receipt className="h-4.5 w-4.5 text-muted-foreground" />
                    <span className="text-sm font-bold">Monthly Orders Limit</span>
                  </div>
                  <span className="text-[10px] font-mono bg-muted border border-border px-2 py-0.5 rounded text-muted-foreground">
                    Cycle Reset
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-muted-foreground">Monthly Order Volume</span>
                    <span className="font-semibold text-foreground">
                      {usageCounts.monthlyOrdersCount} / {activeOrderLimit === null ? "∞" : activeOrderLimit}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        activeOrderLimit !== null && usageCounts.monthlyOrdersCount >= activeOrderLimit
                          ? "bg-destructive"
                          : isLowOrderWarning
                            ? "bg-amber-500"
                            : "bg-emerald-605"
                      )}
                      style={{ width: `${activeOrderLimit === null ? 100 : orderPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {isGrandfatheredOrderLimit && (
                <div className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-350 border border-amber-500/20 p-2.5 rounded-xl">
                  Snapshot Limit grandfathered from purchase. Official live plan limit is {planOrderLimit === null ? "∞" : planOrderLimit}.
                </div>
              )}
            </Card>

            {/* Bento Card 5: Unlocked Capabilities Matrix */}
            <Card className="md:col-span-12 p-6 border border-border bg-card rounded-xl flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Layers className="h-4.5 w-4.5 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground">Unlocked Capabilities Matrix</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border text-sm font-medium text-foreground">
                  <LockOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Subdomain Storefront</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border text-sm font-medium text-foreground">
                  <LockOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Payments Engine</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border text-sm font-medium text-foreground">
                  {activeDiscountCodes ? (
                    <>
                      <LockOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Discounts &amp; Promos</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                      <span className="text-muted-foreground/70">Discounts &amp; Promos</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border text-sm font-medium text-foreground">
                  {currentPlanObj?.features.telegram_notifications ? (
                    <>
                      <LockOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Telegram Order Alerts</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                      <span className="text-muted-foreground/70">Telegram Order Alerts</span>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Bento Card 6: Billing Ledger & Payments */}
            <div className="md:col-span-12 flex flex-col gap-4 mt-4">
              <h2 className="text-lg font-bold text-foreground">Payment History</h2>
              <PaymentHistoryTable payments={payments} />
            </div>

          </div>
        </div>
      )}

      {/* Tab Content 2: Compare & Upgrade Plans */}
      {activeTab === "compare" && (
        <div className="flex flex-col gap-8 animate-fade-in">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold leading-tight">
              Compare Subscription Plans
            </h3>
            <p className="text-sm text-muted-foreground font-light mt-0.5">
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
                  className={cn(
                    "p-6 border rounded-xl flex flex-col justify-between transition-all duration-300 select-none cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-muted-foreground/35 bg-card"
                  )}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col gap-0.5">
                        <h4 className="text-base font-bold leading-tight">
                          {p.name}
                        </h4>
                        <span className="text-[9px] font-mono text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5 mt-1 self-start uppercase tracking-wider font-semibold">
                          {p.slug}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isActivePlan && (
                          <Badge variant="outline" className="font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-[9px] uppercase">
                            Current
                          </Badge>
                        )}
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-bold leading-none">
                        ৳{(p.pricePaisa / 100).toLocaleString("en-BD")}
                      </span>
                      <span className="text-xs text-muted-foreground">/ month</span>
                    </div>

                    <div className="border-t border-border/50 pt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                        <span>Products: <strong className="text-foreground font-semibold">{p.features.max_products !== null ? `${p.features.max_products} active` : "Unlimited"}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                        <span>Orders/Mo: <strong className="text-foreground font-semibold">{p.features.max_orders_per_month !== null ? `${p.features.max_orders_per_month}` : "Unlimited"}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                        <span>Categories: <strong className="text-foreground font-semibold">{p.features.max_categories !== null ? `${p.features.max_categories}` : "Unlimited"}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                        <span>Images Limit: <strong className="text-foreground font-semibold">{p.features.max_images_per_product} photos</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1 border-t border-border/50 pt-3">
                      <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full border", p.features.discount_codes ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" : "bg-muted text-muted-foreground/50 border-border")}>
                        % Discounts
                      </span>
                      <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full border", p.features.telegram_notifications ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" : "bg-muted text-muted-foreground/50 border-border")}>
                        Telegram Alerts
                      </span>
                      <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full border", p.features.cod ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" : "bg-muted text-muted-foreground/50 border-border")}>
                        COD Support
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/50">
                    <button
                      type="button"
                      className={cn(
                        "text-xs font-bold py-2 rounded-full cursor-pointer transition-colors w-full text-center border",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-foreground border-border hover:bg-muted/70"
                      )}
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
              
              {/* Bento Card 2: Plan Transition Analysis */}
              <div className="lg:col-span-8 h-full">
                <Card className="border border-border bg-card p-6 rounded-xl flex flex-col justify-between h-full">
                  <div className="flex flex-col gap-4 w-full">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 mb-2">
                      <div className="flex flex-col gap-0.5">
                        <h4 className="text-base font-bold text-foreground">
                          Transition Analysis: {planName} &rarr; {selectedPlanObj.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Resource updates and locks applied upon plan switch.
                        </p>
                      </div>

                      <div>
                        {(() => {
                          const delta = (selectedPlanObj.pricePaisa - pricePaisa) / 100
                          if (delta > 0) {
                            return (
                              <span className="inline-flex items-center text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-full font-mono">
                                UPGRADE (+৳{delta.toLocaleString("en-BD")} / mo)
                              </span>
                            )
                          } else if (delta < 0) {
                            return (
                              <span className="inline-flex items-center text-xs font-bold px-3 py-1 bg-amber-500/10 text-amber-705 border border-amber-500/20 rounded-full font-mono">
                                DOWNGRADE (-৳{Math.abs(delta).toLocaleString("en-BD")} / mo)
                              </span>
                            )
                          } else {
                            return (
                              <span className="inline-flex items-center text-xs font-semibold px-3 py-1 bg-muted border border-border text-muted-foreground rounded-full font-mono">
                                SAME PRICING
                              </span>
                            )
                          }
                        })()}
                      </div>
                    </div>

                    {/* Benefits / Losses display grid */}
                    {selectedComparePlan === plan ? (
                      <div className="text-center py-8 text-sm text-muted-foreground italic">
                        This is your current plan. To submit a renewal payment of ৳{(pricePaisa / 100).toLocaleString("en-BD")} for this plan, please use the checkout portal below.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                        {/* Benefits Unlocked */}
                        <div className="flex flex-col gap-3">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 font-sans">
                            <LockOpen className="h-3.5 w-3.5" /> Benefits Gained
                          </span>
                          {diffs.filter(d => d.type === "gain").length > 0 ? (
                            <ul className="space-y-2.5 text-sm">
                              {diffs.filter(d => d.type === "gain").map((d, index) => (
                                <li key={index} className="flex items-start gap-2 text-emerald-700 dark:text-emerald-450 font-medium leading-tight">
                                  <span className="font-bold text-emerald-600 font-mono shrink-0 select-none">[+]</span>
                                  <span>{d.text}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-xs text-muted-foreground italic mt-1 pl-1">
                              No resources will be expanded or feature capabilities unlocked.
                            </span>
                          )}
                        </div>

                        {/* Losses & Locks */}
                        <div className="flex flex-col gap-3">
                          <span className="text-[10px] uppercase font-bold text-amber-705 tracking-wider flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 font-sans">
                            <Lock className="h-3.5 w-3.5" /> Limits &amp; Feature Locks
                          </span>
                          {diffs.filter(d => d.type === "loss").length > 0 ? (
                            <ul className="space-y-2.5 text-sm">
                              {diffs.filter(d => d.type === "loss").map((d, index) => (
                                <li key={index} className="flex items-start gap-2 text-amber-700 dark:text-amber-450 font-medium leading-tight">
                                  <span className="font-bold text-amber-600 font-mono shrink-0 select-none">[-]</span>
                                  <span>{d.text}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-xs text-muted-foreground italic mt-1 pl-1">
                              No features will be locked or limits reduced.
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Blocker alert warning if active counts exceed target */}
                  {isDowngradeBlocked && (
                    <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 text-sm text-destructive leading-relaxed w-full">
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-foreground">Active Downgrade Block Triggered</span>
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

              {/* Bento Card 3: Guide & Process */}
              <div className="lg:col-span-4 h-full">
                <Card className="border border-border bg-card p-6 rounded-xl flex flex-col justify-between h-full gap-4">
                  <div className="flex flex-col gap-3">
                    <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-muted-foreground" /> Upgrade Process Guide
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Plan adjustments are verified manually. To request this switch:
                    </p>
                    <ol className="list-decimal pl-4.5 space-y-2 text-sm text-muted-foreground/90">
                      <li>Confirm the target plan (e.g. <strong>{selectedPlanObj.name}</strong>).</li>
                      <li>Use the manual payment portal below to scan the QR code and transfer the fee.</li>
                      <li>Insert your transaction code (TxID) in Step 3 of the checkout wizard.</li>
                      <li>Our administrative queue will process and active your limits.</li>
                    </ol>
                  </div>
                  <div className="border-t border-border/50 pt-3 text-xs text-muted-foreground">
                    * Downgrades will only be processed if your resource counts comply with target plan restrictions.
                  </div>
                </Card>
              </div>

              {/* Bento Card 4: Checkout Portal (Manual Payment Wizard) */}
              <div className="lg:col-span-12 border border-border rounded-xl bg-card p-6 mt-2">
                <div className="w-full flex flex-col gap-6 select-text">
                  
                  {isDowngradeBlocked ? (
                    <div className="p-6 border border-destructive/15 rounded-xl bg-destructive/5 text-center flex flex-col items-center justify-center min-h-[220px] gap-2">
                      <Lock className="h-8 w-8 text-destructive mb-1" />
                      <span className="font-semibold text-foreground">Checkout Portal Locked</span>
                      <span className="text-sm text-muted-foreground max-w-sm leading-normal">
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
