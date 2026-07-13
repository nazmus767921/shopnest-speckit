"use client"

import React, { useState, useEffect } from "react"
import { recordSubscriptionPaymentAction, verifySubscriptionPaymentAction, rejectSubscriptionPaymentAction, changeMerchantPlanAction } from "@/app/actions/admin"
import type { DowngradeViolation } from "@/lib/plans/validateDowngrade"
import type { PlanFeatures } from "@/lib/plans/types"
import { Loader2Icon, ArrowDownCircleIcon, CheckIcon, ShieldAlertIcon, CheckCircleIcon, XCircleIcon, SearchIcon, XIcon, CoinsIcon, CreditCardIcon, LandmarkIcon, CalendarIcon, AlertTriangleIcon, UserIcon, ArrowUpRightIcon, PlusIcon, LayersIcon } from "@/lib/icons";

import { Combobox, AlertDialog, Dialog, Button, Badge, Alert, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"

interface MerchantDropdownItem {
  id: string
  name: string
  subdomain: string
  plan: string
  subscriptionStatus: string
  productsCount: number
  monthlyOrdersCount: number
  owner: {
    name: string
    email: string
  } | null
}

interface PaymentHistoryItem {
  id: string
  amountPaisa: number
  paymentMethod: string
  transactionId: string
  status: string
  months: number
  paidAt: string
  recordedBy: string | null
  merchantId: string | null
  merchantName: string | null
  merchantSubdomain: string | null
  merchantPlan: string | null
  targetPlan: string | null
  targetPlanId?: string | null
  recordedByName: string | null
  /** Snapshot of plan features captured at payment submission time. Null for legacy rows. */
  featuresAtPaymentTime?: PlanFeatures | null
}

interface PlanItem {
  id: string
  name: string
  slug: string
  pricePaisa: number
  features: any
  isArchived: boolean
}

interface Props {
  merchants: MerchantDropdownItem[]
  initialPayments: PaymentHistoryItem[]
  plans: PlanItem[]
}

export function SubscriptionsClient({ merchants, initialPayments, plans }: Props) {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>(initialPayments)
  const [activeTab, setActiveTab] = useState<"actions" | "history">("actions")

  // Drawer visibility
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Verify modal states
  const [verifyingPmt, setVerifyingPmt] = useState<PaymentHistoryItem | null>(null)
  const [verificationMonths, setVerificationMonths] = useState(1)

  // Reject confirmation states
  const [rejectingPmt, setRejectingPmt] = useState<PaymentHistoryItem | null>(null)

  // Manual confirm states
  const [manualConfirmPmt, setManualConfirmPmt] = useState<{
    merchantId: string
    merchantName: string
    merchantSubdomain: string
    plan: string
    targetPlanId: string
    amountTaka: number
    paymentMethod: string
    transactionId: string
    paidAt: string
  } | null>(null)

  // Form states (manual recording)
  const [merchantId, setMerchantId] = useState("")
  const [targetPlanId, setTargetPlanId] = useState("")
  const [amountTaka, setAmountTaka] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("bkash")
  const [transactionId, setTransactionId] = useState("")
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0])

  // Filter and SearchIcon states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")

  // Async states
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Change Plan states
  const [changePlanTargetId, setChangePlanTargetId] = useState("")
  const [changePlanViolations, setChangePlanViolations] = useState<DowngradeViolation[]>([])
  const [changePlanLoading, setChangePlanLoading] = useState(false)

  const handleChangePlan = async () => {
    if (!merchantId || !changePlanTargetId) return
    setChangePlanLoading(true)
    setError(null)
    setSuccess(null)
    setChangePlanViolations([])

    try {
      const res = await changeMerchantPlanAction({
        merchantId,
        targetPlanId: changePlanTargetId,
      })

      if (res.success) {
        setSuccess(`Subscription plan changed successfully.`)
        
        // Update local state by finding the plan slug and setting it on the merchant
        const targetPlanObj = plans.find(p => p.id === changePlanTargetId)
        if (targetPlanObj && selectedMerchant) {
          selectedMerchant.plan = targetPlanObj.slug
        }
        
        setIsDrawerOpen(false)
        setChangePlanTargetId("")
      } else if (res.errors) {
        setChangePlanViolations(res.errors)
      } else {
        setError(res.error || "Failed to change plan.")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setChangePlanLoading(false)
    }
  }

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Auto-set default planId on mount or plan change
  useEffect(() => {
    const activePlans = plans.filter(p => !p.isArchived)
    if (activePlans.length > 0 && !targetPlanId) {
      const defaultPlan = activePlans[0]
      setTargetPlanId(defaultPlan.id)
      setAmountTaka(Math.floor(defaultPlan.pricePaisa / 100).toString())
    }
  }, [plans, targetPlanId])

  const selectedMerchant = merchants.find((m) => m.id === merchantId)
  const selectedPlanObj = plans.find((p) => p.id === targetPlanId)
  const selectedPlanFeatures = selectedPlanObj?.features

  const exceedsProductLimit = selectedPlanFeatures && selectedPlanFeatures.max_products !== null && selectedMerchant && selectedMerchant.productsCount > selectedPlanFeatures.max_products
  const exceedsOrderLimit = selectedPlanFeatures && selectedPlanFeatures.max_orders_per_month !== null && selectedMerchant && selectedMerchant.monthlyOrdersCount > selectedPlanFeatures.max_orders_per_month
  const isAdminDowngradeBlocked = exceedsProductLimit || exceedsOrderLimit

  // Auto-set standard pricing amount on plan selection to assist the admin
  const handlePlanChange = (selectedPlanId: string) => {
    setTargetPlanId(selectedPlanId)
    const selectedPlan = plans.find((p) => p.id === selectedPlanId)
    if (selectedPlan) {
      setAmountTaka(Math.floor(selectedPlan.pricePaisa / 100).toString())
    }
  }

  const openVerifyDialog = (pmt: PaymentHistoryItem) => {
    setVerifyingPmt(pmt)

    // Auto-calculate months based on amount paid vs target plan price
    const amountTakaVal = pmt.amountPaisa / 100
    let targetPlanObj = null
    if (pmt.targetPlanId) {
      targetPlanObj = plans.find(p => p.id === pmt.targetPlanId)
    } else if (pmt.targetPlan) {
      targetPlanObj = plans.find(p => p.slug === pmt.targetPlan)
    } else if (pmt.merchantPlan) {
      targetPlanObj = plans.find(p => p.slug === pmt.merchantPlan)
    }

    const pricePerMonth = targetPlanObj ? Math.floor(targetPlanObj.pricePaisa / 100) : 499
    const calculated = Math.max(1, Math.round(amountTakaVal / pricePerMonth))

    setVerificationMonths(calculated)
  }

  const handleVerify = async () => {
    if (!verifyingPmt) return
    setActionLoadingId(verifyingPmt.id)
    setError(null)
    setSuccess(null)

    try {
      const res = await verifySubscriptionPaymentAction({
        paymentId: verifyingPmt.id,
        months: verificationMonths
      })
      if (res.success) {
        setSuccess(`Payment for ${verifyingPmt.merchantName} verified for ${verificationMonths} month(s).`)
        setPayments((prev) =>
          prev.map(p => p.id === verifyingPmt.id ? { ...p, status: "verified", months: verificationMonths } : p)
        )
        setVerifyingPmt(null)
      } else {
        setError(res.error || "Failed to verify payment.")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReject = async () => {
    if (!rejectingPmt) return
    setActionLoadingId(rejectingPmt.id)
    setError(null)
    setSuccess(null)

    try {
      const res = await rejectSubscriptionPaymentAction({ paymentId: rejectingPmt.id })
      if (res.success) {
        setSuccess(`Payment for ${rejectingPmt.merchantName} has been rejected.`)
        setPayments((prev) =>
          prev.map(p => p.id === rejectingPmt.id ? { ...p, status: "rejected" } : p)
        )
        setRejectingPmt(null)
      } else {
        setError(res.error || "Failed to reject payment.")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setActionLoadingId(null)
    }
  }

  // Submit via slide-out drawer form triggers confirmation modal first
  const handleDrawerSubmitPrompt = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const parsedAmount = parseFloat(amountTaka)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Invalid Taka amount. Must be a positive number.")
      return
    }

    if (!merchantId) {
      setError("Please select a boutique store.")
      return
    }

    if (!transactionId || transactionId.trim().length < 3) {
      setError("Transaction ID must be at least 3 characters.")
      return
    }

    // Auto-calculate months
    const pricePerMonth = selectedPlanObj ? Math.floor(selectedPlanObj.pricePaisa / 100) : 499
    const calculated = Math.max(1, Math.round(parsedAmount / pricePerMonth))

    setManualConfirmPmt({
      merchantId,
      merchantName: selectedMerchant?.name ?? "Unknown Store",
      merchantSubdomain: selectedMerchant?.subdomain ?? "",
      plan: selectedPlanObj?.slug ?? "starter",
      targetPlanId: targetPlanId,
      amountTaka: parsedAmount,
      paymentMethod,
      transactionId,
      paidAt,
    })
    setVerificationMonths(calculated)
  }

  const handleConfirmManualSubmit = async () => {
    if (!manualConfirmPmt) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const isoPaidAt = new Date(manualConfirmPmt.paidAt).toISOString()

      const res = await recordSubscriptionPaymentAction({
        merchantId: manualConfirmPmt.merchantId,
        targetPlanId: manualConfirmPmt.targetPlanId,
        amountTaka: manualConfirmPmt.amountTaka,
        paymentMethod: manualConfirmPmt.paymentMethod,
        transactionId: manualConfirmPmt.transactionId,
        paidAt: isoPaidAt,
        months: verificationMonths,
      })

      if (res.success) {
        setSuccess(`Manual payment for ${manualConfirmPmt.merchantName} recorded for ${verificationMonths} month(s).`)

        // Update local list
        const newPaymentRecord: PaymentHistoryItem = {
          id: Math.random().toString(), // local placeholder
          amountPaisa: Math.round(manualConfirmPmt.amountTaka * 100),
          paymentMethod: manualConfirmPmt.paymentMethod,
          transactionId: manualConfirmPmt.transactionId,
          status: "verified",
          months: verificationMonths,
          paidAt: isoPaidAt,
          recordedBy: "You",
          merchantId: manualConfirmPmt.merchantId,
          merchantName: manualConfirmPmt.merchantName,
          merchantSubdomain: manualConfirmPmt.merchantSubdomain,
          merchantPlan: manualConfirmPmt.plan,
          targetPlan: manualConfirmPmt.plan,
          targetPlanId: manualConfirmPmt.targetPlanId,
          recordedByName: "You",
        }

        setPayments((prev) => [newPaymentRecord, ...prev])

        setMerchantId("")
        setTransactionId("")
        setAmountTaka("")
        setPaidAt(new Date().toISOString().split("T")[0])
        setManualConfirmPmt(null)
        setIsDrawerOpen(false)
      } else {
        setError(res.error || "Failed to record payment.")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const formatTaka = (paisa: number) => {
    const taka = paisa / 100
    return `৳${taka.toLocaleString("en-BD", { minimumFractionDigits: 0 })}`
  }

  const pendingPayments = payments.filter(p => p.status === "pending")
  const historyPayments = payments.filter(p => p.status !== "pending")

  // Top Metrics calculation for the history tab
  const totalRevenue = historyPayments.reduce((sum, p) => p.status === "verified" ? sum + p.amountPaisa : sum, 0)
  const bkashTotal = historyPayments.filter(p => p.paymentMethod === "bkash" && p.status === "verified").reduce((sum, p) => sum + p.amountPaisa, 0)
  const nagadTotal = historyPayments.filter(p => p.paymentMethod === "nagad" && p.status === "verified").reduce((sum, p) => sum + p.amountPaisa, 0)
  const bankTotal = historyPayments.filter(p => p.paymentMethod === "bank" && p.status === "verified").reduce((sum, p) => sum + p.amountPaisa, 0)

  // Filter history
  const filteredHistory = historyPayments.filter((pmt) => {
    const matchesSearch =
      !searchTerm ||
      (pmt.merchantName && pmt.merchantName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (pmt.merchantSubdomain && pmt.merchantSubdomain.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (pmt.transactionId && pmt.transactionId.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || pmt.status === statusFilter
    const matchesMethod = methodFilter === "all" || pmt.paymentMethod === methodFilter
    const matchesPlan =
      planFilter === "all" ||
      (pmt.targetPlan || pmt.merchantPlan || "starter").toLowerCase() === planFilter.toLowerCase()

    return matchesSearch && matchesStatus && matchesMethod && matchesPlan
  })

  return (
    <div className="flex flex-col gap-6 select-text">
      {/* Inline styles for custom animations */}
      <style>{`
        @keyframes drawerSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-drawer-slide-in {
          animation: drawerSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-overlay-fade-in {
          animation: overlayFadeIn 0.2s ease-out forwards;
        }
      `}</style>

      {/* Global Status Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-lg text-caption flex items-start gap-2.5 font-medium animate-fade-in">
          <AlertTriangleIcon className="h-4.5 w-4.5 shrink-0 text-red-600 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span>Action Failed</span>
            <span className="text-micro font-light text-red-700">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-caption flex items-center justify-between gap-2.5 font-medium animate-fade-in">
          <div className="flex items-start gap-2.5">
            <CheckCircleIcon className="h-4.5 w-4.5 shrink-0 text-emerald-700 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span>Success</span>
              <span className="text-micro font-light text-emerald-700">{success}</span>
            </div>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="p-1 rounded-full text-emerald-700 hover:bg-emerald-100/50 transition cursor-pointer shrink-0"
            aria-label="Dismiss success message"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tab Switcher & Manual Recording Trigger Strip */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-hairline-light pb-2">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab("actions")}
            className={`px-4 py-2 text-caption font-semibold rounded-full border transition-all cursor-pointer ${activeTab === "actions"
                ? "bg-black text-white border-black"
                : "bg-transparent text-shade-50 border-transparent hover:text-ink hover:bg-canvas-cream/50"
              }`}
          >
            Action Queue
            {pendingPayments.length > 0 && (
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-bold ${activeTab === "actions"
                  ? "bg-white text-black"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}>
                {pendingPayments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-caption font-semibold rounded-full border transition-all cursor-pointer ${activeTab === "history"
                ? "bg-black text-white border-black"
                : "bg-transparent text-shade-50 border-transparent hover:text-ink hover:bg-canvas-cream/50"
              }`}
          >
            Collection History
          </button>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Record Manual Payment</span>
        </Button>
      </div>

      {/* Tab Contents */}
      {activeTab === "actions" ? (
        <div className="flex flex-col gap-5 animate-fade-in">
          <div className="flex items-center gap-2 text-shade-60">
            <ShieldAlertIcon className="h-4.5 w-4.5 text-amber-600" />
            <span className="text-caption font-medium">
              Verify payments submitted manually by boutique merchants during checkout or upgrade.
            </span>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="bg-canvas-light border border-hairline-light rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <ShieldAlertIcon className="h-8 w-8 text-shade-40" />
              <span className="text-heading-md font-semibold text-ink">No Pending Confirmations</span>
              <span className="text-caption text-shade-50 max-w-sm">
                All merchant payments have been processed. Any new transactions submitted by boutique stores will appear here.
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {pendingPayments.map((pmt) => {
                const merchant = merchants.find(m => m.id === pmt.merchantId)
                const targetPlanObj = pmt.targetPlanId
                  ? plans.find(p => p.id === pmt.targetPlanId)
                  : pmt.targetPlan
                    ? plans.find(p => p.slug === pmt.targetPlan)
                    : null

                const targetPlanFeatures = targetPlanObj?.features
                const maxProducts = targetPlanFeatures?.max_products ?? null
                const maxOrders = targetPlanFeatures?.max_orders_per_month ?? null

                const snapshotFeatures = pmt.featuresAtPaymentTime
                let planDriftWarning: string | null = null

                if (snapshotFeatures && targetPlanFeatures) {
                  const diffs = []
                  if (snapshotFeatures.max_products !== targetPlanFeatures.max_products) {
                    diffs.push(`Products: ${snapshotFeatures.max_products ?? 'Unlimited'} → ${targetPlanFeatures.max_products ?? 'Unlimited'}`)
                  }
                  if (snapshotFeatures.max_orders_per_month !== targetPlanFeatures.max_orders_per_month) {
                    diffs.push(`Orders: ${snapshotFeatures.max_orders_per_month ?? 'Unlimited'} → ${targetPlanFeatures.max_orders_per_month ?? 'Unlimited'}`)
                  }
                  if (diffs.length > 0) {
                    planDriftWarning = `Plan was edited since submission. Verifying at submitted limits (${diffs.join(", ")}).`
                  }
                }

                return (
                  <div
                    key={pmt.id}
                    className="bg-canvas-light border border-hairline-light rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 transition hover:bg-canvas-cream/20"
                  >
                    <div className="flex flex-col gap-2 md:max-w-md">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-heading-md font-display font-semibold text-ink">
                          {pmt.merchantName}
                        </span>
                        <span className="text-micro font-mono text-shade-50 bg-canvas-cream border border-hairline-light px-2 py-0.5 rounded">
                          {pmt.merchantSubdomain ? `${pmt.merchantSubdomain}.shopnest.com.bd` : ""}
                        </span>
                        {pmt.targetPlan && (
                          <span className={`text-eyebrow-cap font-semibold px-2 py-0.5 rounded-full text-[10px] border ${
                            pmt.targetPlan === "pro"
                              ? "bg-purple-100 border-purple-200 text-purple-800"
                              : pmt.targetPlan === "growth"
                                ? "bg-aloe-10 border-emerald-250 text-emerald-800"
                                : "bg-zinc-100 text-ink border-hairline-light"
                            }`}>
                            Target: {targetPlanObj?.name || pmt.targetPlan}
                          </span>
                        )}
                      </div>
                      {merchant?.owner && (
                        <div className="flex items-center gap-1.5 text-caption text-shade-50">
                          <UserIcon className="h-3.5 w-3.5 text-shade-40 shrink-0" />
                          <span>{merchant.owner.name} ({merchant.owner.email})</span>
                        </div>
                      )}

                      {/* Limit Violation Alerts / Plan Drift Warning */}
                      {planDriftWarning && (
                        <div className="flex flex-col gap-1 mt-1 p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-caption font-medium max-w-sm">
                          <div className="flex items-start gap-1.5">
                            <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{planDriftWarning}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row items-center gap-4 justify-between md:justify-end grow md:grow-0 border-t border-hairline-light/60 pt-4 md:border-t-0 md:pt-0">
                      <div className="flex flex-col">
                        <span className="text-eyebrow-cap font-semibold text-shade-40 uppercase">Amount & Channel</span>
                        <span className="text-heading-lg text-ink font-semibold font-display mt-0.5">{formatTaka(pmt.amountPaisa)}</span>
                        <div className="flex items-center gap-1.5 text-caption text-shade-60 mt-0.5">
                          <span className="capitalize font-semibold text-ink">{pmt.paymentMethod}</span>
                          <span className="text-shade-30">•</span>
                          <span className="font-mono text-shade-70 font-semibold uppercase">{pmt.transactionId}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openVerifyDialog(pmt)}
                          disabled={actionLoadingId === pmt.id}
                          className="px-4 py-2 min-h-10 text-caption bg-emerald-800 hover:bg-emerald-700 text-white cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                        >
                          {actionLoadingId === pmt.id ? (
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircleIcon className="h-4 w-4" />
                          )}
                          <span>Verify</span>
                        </Button>
                        <Button
                          variant="outline-light"
                          size="sm"
                          onClick={() => setRejectingPmt(pmt)}
                          disabled={actionLoadingId === pmt.id}
                          className="p-2 border border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 rounded-full transition-colors cursor-pointer min-h-10 min-w-10 flex items-center justify-center"
                          title="Reject Payment"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* History Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-canvas-light border border-hairline-light rounded-xl p-5 flex flex-col justify-between">
              <span className="text-eyebrow-cap font-semibold text-shade-40">Total Revenue</span>
              <span className="text-display-md text-emerald-800 font-semibold font-display mt-2 leading-none">
                {formatTaka(totalRevenue)}
              </span>
              <span className="text-micro text-shade-45 mt-1">From verified collections</span>
            </div>
            <div className="bg-canvas-light border border-hairline-light rounded-xl p-5 flex flex-col justify-between">
              <span className="text-eyebrow-cap font-semibold text-shade-40">bKash Channel</span>
              <span className="text-heading-xl text-ink font-semibold mt-2 leading-tight">
                {formatTaka(bkashTotal)}
              </span>
              <span className="text-micro text-shade-45 mt-1">
                {historyPayments.filter(p => p.paymentMethod === "bkash" && p.status === "verified").length} verified transactions
              </span>
            </div>
            <div className="bg-canvas-light border border-hairline-light rounded-xl p-5 flex flex-col justify-between">
              <span className="text-eyebrow-cap font-semibold text-shade-40">Nagad Channel</span>
              <span className="text-heading-xl text-ink font-semibold mt-2 leading-tight">
                {formatTaka(nagadTotal)}
              </span>
              <span className="text-micro text-shade-45 mt-1">
                {historyPayments.filter(p => p.paymentMethod === "nagad" && p.status === "verified").length} verified transactions
              </span>
            </div>
            <div className="bg-canvas-light border border-hairline-light rounded-xl p-5 flex flex-col justify-between">
              <span className="text-eyebrow-cap font-semibold text-shade-40">Bank Transfers</span>
              <span className="text-heading-xl text-ink font-semibold mt-2 leading-tight">
                {formatTaka(bankTotal)}
              </span>
              <span className="text-micro text-shade-45 mt-1">
                {historyPayments.filter(p => p.paymentMethod === "bank" && p.status === "verified").length} verified transactions
              </span>
            </div>
          </div>

          {/* Filters Workspace */}
          <div className="bg-canvas-light border border-hairline-light rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            <div className="relative w-full md:max-w-xl lg:max-w-2xl shrink-0">
              <SearchIcon className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-shade-40" />
              <input
                type="text"
                placeholder="Search by store name, subdomain, transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-body-md border border-hairline-light rounded-md pl-10 pr-3.5 py-2.5 bg-canvas-light text-ink focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto md:justify-end">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-36 bg-canvas-light border-hairline-light">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-full md:w-36 bg-canvas-light border-hairline-light">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full md:w-36 bg-canvas-light border-hairline-light">
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {plans.map((p: any) => (
                    <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-canvas-light border border-hairline-light rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline-light bg-canvas-cream/50 text-eyebrow-cap font-semibold text-shade-50 uppercase">
                  <th className="px-6 py-4">Boutique Store</th>
                  <th className="px-6 py-4">Intended Plan</th>
                  <th className="px-6 py-4">Channel & TrxID</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 text-center">Months Credited</th>
                  <th className="px-6 py-4">Date Recorded</th>
                  <th className="px-6 py-4">Recorder</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-light text-body-md">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-shade-40 font-light">
                      No subscription payments match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((pmt) => (
                    <tr key={pmt.id} className="hover:bg-canvas-cream/10 transition">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-ink">{pmt.merchantName}</span>
                          <span className="text-caption text-shade-45 font-mono">
                            {pmt.merchantSubdomain ? `${pmt.merchantSubdomain}.shopnest.com.bd` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`capitalize font-semibold text-caption px-2 py-0.5 rounded border ${(pmt.targetPlan || pmt.merchantPlan || "starter") === "growth"
                            ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                            : "bg-zinc-50 border-hairline-light text-ink"
                          }`}>
                          {pmt.targetPlan || pmt.merchantPlan || "Starter"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="capitalize font-medium text-ink text-caption">{pmt.paymentMethod}</span>
                          <span className="font-mono text-caption text-shade-70 font-semibold uppercase">{pmt.transactionId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-ink font-semibold">
                        {formatTaka(pmt.amountPaisa)}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-ink">
                        {pmt.status === "verified" ? `${pmt.months} mo` : "—"}
                      </td>
                      <td className="px-6 py-4 text-caption text-shade-50">
                        {new Date(pmt.paidAt).toLocaleDateString("en-BD", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-caption text-shade-50">
                        {pmt.recordedByName || "System"}
                      </td>
                      <td className="px-6 py-4">
                        {pmt.status === "verified" && (
                          <Badge variant="mint">Verified</Badge>
                        )}
                        {pmt.status === "rejected" && (
                          <Badge variant="shade">Rejected</Badge>
                        )}
                        {pmt.status !== "verified" && pmt.status !== "rejected" && (
                          <Badge variant="outline">{pmt.status}</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Manual Collection Responsive Dialog / iOS Sheet */}
      {isDrawerOpen && (
        <>
          <style>{`
            @keyframes iosSlideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            @keyframes macosScale {
              from { opacity: 0; transform: scale(0.96); }
              to { opacity: 1; transform: scale(1); }
            }
            .animate-ios-slide-up {
              animation: iosSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .animate-macos-scale {
              animation: macosScale 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>

          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4 select-text animate-overlay-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsDrawerOpen(false)
            }}
          >
            {/* Dialog Panel: Responsive macOS (desktop) vs iOS sheet (mobile) */}
            <div className="bg-canvas-light border border-hairline-light z-50 flex flex-col w-full
              /* Mobile: iOS bottom drawer */
              fixed bottom-0 left-0 right-0 rounded-t-3xl max-h-[85vh] h-auto animate-ios-slide-up
              /* Desktop: macOS centered dialog */
              md:relative md:bottom-auto md:left-auto md:right-auto md:max-w-5xl md:rounded-2xl md:h-auto md:max-h-[90vh] md:animate-macos-scale"
            >
              {/* iOS Drag Handle (mobile only) */}
              <div className="block md:hidden pt-3 pb-1">
                <div className="w-9 h-1 bg-shade-30 rounded-full mx-auto" />
              </div>

              {/* Dialog Header */}
              <div className="px-6 py-4.5 border-b border-hairline-light flex items-center justify-between bg-zinc-50/50 md:rounded-t-2xl">
                {/* Desktop macOS Traffic Lights */}
                <div className="hidden md:flex items-center gap-1.5 w-16 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 border border-[#e0443e] cursor-pointer transition-colors focus:outline-none flex items-center justify-center group"
                    title="Close"
                  >
                    <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-[#4c0002] leading-none mb-0.5">&times;</span>
                  </button>
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
                </div>

                {/* Dialog Title */}
                <div className="grow text-left md:text-center flex items-center justify-start md:justify-center gap-2">
                  <ArrowDownCircleIcon className="h-5 w-5 text-emerald-800 shrink-0" />
                  <h2 className="text-heading-md font-display font-semibold text-ink">
                    Record Collection
                  </h2>
                </div>

                {/* Mobile Done Button */}
                <div className="md:hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="text-body-strong font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
                  >
                    Done
                  </button>
                </div>

                {/* Desktop spacer to balance traffic lights */}
                <div className="hidden md:block w-16 shrink-0" />
              </div>

              {/* Scrollable Form Body */}
              <div className="overflow-y-auto p-6 flex flex-col gap-6 max-h-[80vh] md:max-h-[78vh] bg-canvas-cream/10">
                <form onSubmit={handleDrawerSubmitPrompt} className="flex flex-col gap-6">
                  {/* Bento Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    
                    {/* Bento Card 1: Boutique Selector & Quota Details (md:col-span-8) */}
                    <div className="md:col-span-8 p-5 border border-hairline-light bg-canvas-light rounded-xl flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-eyebrow-cap font-bold text-shade-40 uppercase tracking-wider flex items-center gap-1.5">
                          <UserIcon className="h-4 w-4" /> Boutique Store
                        </label>
                        <Select
                          value={merchantId || undefined}
                          onValueChange={(id) => {
                            const val = merchants.find(m => m.id === id);
                            if (val) {
                              setMerchantId(val.id)
                              const matchingPlan = plans.find(p => p.slug === val.plan)
                              if (matchingPlan) {
                                handlePlanChange(matchingPlan.id)
                              } else {
                                setTargetPlanId("")
                              }
                            } else {
                              setMerchantId("")
                            }
                            setChangePlanTargetId("")
                            setChangePlanViolations([])
                          }}
                        >
                          <SelectTrigger className="h-auto py-2 border-hairline-light">
                             <SelectValue placeholder="Select Boutique..." />
                          </SelectTrigger>
                          <SelectContent>
                            {merchants.map(m => (
                               <SelectItem key={m.id} value={m.id}>
                                  <div className="flex flex-col text-left">
                                    <span className="font-semibold leading-tight">{m.name}</span>
                                    <span className="text-[10px] text-shade-40 font-mono mt-0.5">{m.subdomain}.shopnest.com.bd</span>
                                  </div>
                               </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedMerchant ? (() => {
                        const currentMerchantPlanObj = plans.find(p => p.slug === selectedMerchant.plan)
                        const currentMerchantPlanFeatures = currentMerchantPlanObj?.features
                        const currentMerchantMaxProducts = currentMerchantPlanFeatures?.max_products ?? null
                        const currentMerchantMaxOrders = currentMerchantPlanFeatures?.max_orders_per_month ?? null

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-1">
                            <div className="p-3 bg-zinc-50 border border-hairline-light rounded-lg flex flex-col gap-0.5">
                              <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider">Current Plan</span>
                              <span className="font-semibold text-ink capitalize mt-0.5">{selectedMerchant.plan} ({selectedMerchant.subscriptionStatus})</span>
                            </div>
                            <div className="p-3 bg-zinc-50 border border-hairline-light rounded-lg flex flex-col gap-0.5">
                              <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider">Products</span>
                              <span className={`font-semibold mt-0.5 ${currentMerchantMaxProducts !== null && selectedMerchant.productsCount > currentMerchantMaxProducts ? "text-rose-600 font-bold" : "text-ink"}`}>
                                {selectedMerchant.productsCount} / {currentMerchantMaxProducts !== null ? currentMerchantMaxProducts : "∞"}
                              </span>
                            </div>
                            <div className="p-3 bg-zinc-50 border border-hairline-light rounded-lg flex flex-col gap-0.5">
                              <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider">Monthly Orders</span>
                              <span className={`font-semibold mt-0.5 ${currentMerchantMaxOrders !== null && selectedMerchant.monthlyOrdersCount > currentMerchantMaxOrders ? "text-rose-600 font-bold" : "text-ink"}`}>
                                {selectedMerchant.monthlyOrdersCount} / {currentMerchantMaxOrders !== null ? currentMerchantMaxOrders : "∞"}
                              </span>
                            </div>
                          </div>
                        )
                      })() : (
                        <div className="flex items-center justify-center py-6 bg-zinc-50/50 border border-dashed border-hairline-light rounded-lg text-caption text-shade-40 italic">
                          Please select a boutique store to load active quotas and limits.
                        </div>
                      )}
                    </div>

                    {/* Bento Card 2: Upgrade / Extension Tier (md:col-span-4) */}
                    <div className="md:col-span-4 p-5 border border-hairline-light bg-canvas-light rounded-xl flex flex-col gap-3.5">
                      <label className="text-eyebrow-cap font-bold text-shade-40 uppercase tracking-wider flex items-center gap-1.5">
                        <CoinsIcon className="h-4 w-4" /> Upgrade / Extend Plan
                      </label>
                      <div className="flex flex-col gap-2 grow justify-center">
                        {plans.filter(p => !p.isArchived).map((p) => {
                          const isSelected = targetPlanId === p.id
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handlePlanChange(p.id)}
                              className={`w-full py-2.5 px-4 border rounded-full text-caption font-semibold transition cursor-pointer flex justify-between items-center ${
                                isSelected 
                                  ? "bg-emerald-800 text-white border-emerald-800" 
                                  : "border-hairline-light bg-canvas-light text-ink hover:bg-canvas-cream"
                              }`}
                            >
                              <span>{p.name}</span>
                              <span className={`font-mono text-micro font-bold ${isSelected ? "text-white" : "text-shade-50"}`}>
                                ৳{(p.pricePaisa / 100).toLocaleString()}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Bento Card 3: Collection Metadata (md:col-span-8) */}
                    <div className="md:col-span-8 p-5 border border-hairline-light bg-canvas-light rounded-xl flex flex-col gap-4">
                      <label className="text-eyebrow-cap font-bold text-shade-40 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCardIcon className="h-4 w-4" /> Payment Collection Details
                      </label>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Amount input */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider">Amount Paid (৳)</span>
                          <input
                            type="number"
                            required
                            value={amountTaka}
                            onChange={(e) => setAmountTaka(e.target.value)}
                            placeholder="499"
                            className="w-full text-body-md border border-hairline-light rounded-md px-3.5 py-2.5 bg-canvas-light text-ink focus:outline-none focus:ring-1 focus:ring-emerald-700 font-semibold"
                          />
                        </div>

                        {/* Payment Method */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider">Collection Channel</span>
                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger className="bg-canvas-light border-hairline-light h-11 font-semibold">
                              <SelectValue placeholder="Select Collection Channel..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bkash">bKash</SelectItem>
                              <SelectItem value="nagad">Nagad</SelectItem>
                              <SelectItem value="bank">Bank Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Transaction ID */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider">Transaction ID (TrxID)</span>
                          <input
                            type="text"
                            required
                            placeholder="e.g. BKA729XK8S"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="w-full text-body-md border border-hairline-light rounded-md px-3.5 py-2.5 bg-canvas-light text-ink focus:outline-none focus:ring-1 focus:ring-emerald-700 font-mono uppercase font-semibold"
                          />
                        </div>

                        {/* Paid At */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider">Date Collected</span>
                          <input
                            type="date"
                            required
                            value={paidAt}
                            onChange={(e) => setPaidAt(e.target.value)}
                            className="w-full text-body-md border border-hairline-light rounded-md px-3.5 py-2.5 bg-canvas-light text-ink focus:outline-none focus:ring-1 focus:ring-emerald-700"
                          />
                        </div>
                      </div>

                      {/* Blocker alert warning if active counts exceed target */}
                      {exceedsProductLimit && selectedMerchant && (
                        <div className="p-3 bg-red-50 border border-red-150 text-red-800 rounded-lg text-caption font-semibold flex items-start gap-2 animate-new-order-highlight">
                          <AlertTriangleIcon className="h-4.5 w-4.5 shrink-0 text-red-700 mt-0.5" />
                          <span>Cannot Downgrade: Store has {selectedMerchant.productsCount} products (limit is 50).</span>
                        </div>
                      )}
                      {exceedsOrderLimit && selectedMerchant && (
                        <div className="p-3 bg-red-50 border border-red-150 text-red-800 rounded-lg text-caption font-semibold flex items-start gap-2 animate-new-order-highlight">
                          <AlertTriangleIcon className="h-4.5 w-4.5 shrink-0 text-red-700 mt-0.5" />
                          <span>Cannot Downgrade: Store has {selectedMerchant.monthlyOrdersCount} orders (limit is 200).</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading || !merchantId || !amountTaka || !transactionId || isAdminDowngradeBlocked}
                        className="w-full py-2.5 mt-2 bg-black text-white hover:bg-shade-70 rounded-full text-body-strong font-medium flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                      >
                        {loading && <Loader2Icon className="h-4 w-4 animate-spin" />}
                        Submit Payment Record
                      </button>
                    </div>

                    {/* Bento Card 4: Change Plan Override (md:col-span-4) */}
                    <div className="md:col-span-4 p-5 border border-hairline-light bg-canvas-light rounded-xl flex flex-col justify-between gap-4">
                      <div className="flex flex-col gap-3.5">
                        <label className="text-eyebrow-cap font-bold text-shade-40 uppercase tracking-wider flex items-center gap-1.5">
                          <LayersIcon className="h-4 w-4" /> Change Plan Override
                        </label>
                        
                        {selectedMerchant ? (() => {
                          const availablePlans = plans.filter(p => !p.isArchived && p.slug !== selectedMerchant.plan)

                          return (
                            <div className="flex flex-col gap-3">
                              <div className="flex justify-between items-center text-caption">
                                <span className="text-shade-50">Current Plan:</span>
                                <span className="capitalize font-semibold text-ink px-2 py-0.5 rounded border border-hairline-light bg-canvas-cream font-mono">
                                  {selectedMerchant.plan}
                                </span>
                              </div>

                              <div className="flex flex-col gap-1.5 mt-1">
                                <span className="text-[10px] font-bold text-shade-40 uppercase tracking-wider">New Target Plan</span>
                                <Select
                                  value={changePlanTargetId || undefined}
                                  onValueChange={(val) => {
                                    setChangePlanTargetId(val)
                                    setChangePlanViolations([])
                                  }}
                                >
                                  <SelectTrigger className="bg-canvas-light border-hairline-light">
                                    <SelectValue placeholder="Select plan..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availablePlans.map((p: any) => (
                                      <SelectItem key={p.id} value={p.id}>
                                        {p.name} (৳{Math.floor(p.pricePaisa / 100)}/mo)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Violations alerts */}
                              {changePlanViolations.length > 0 && (
                                <div className="flex flex-col gap-2 my-1">
                                  {changePlanViolations.map((v, i) => (
                                    <Alert key={i} variant="warning" className="text-caption font-medium select-text">
                                      {v.message}
                                    </Alert>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })() : (
                          <div className="text-caption text-shade-40 italic py-6 text-center">
                            Select store first.
                          </div>
                        )}
                      </div>

                      {selectedMerchant && (
                        <button
                          type="button"
                          onClick={handleChangePlan}
                          disabled={changePlanLoading || !changePlanTargetId}
                          className="w-full py-2.5 bg-black text-white hover:bg-shade-70 rounded-full text-body-strong font-medium flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer mt-auto"
                        >
                          {changePlanLoading && <Loader2Icon className="h-4 w-4 animate-spin" />}
                          Change Plan
                        </button>
                      )}
                    </div>
                    
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Verify Dialog Modal */}
      <Dialog
        isOpen={!!verifyingPmt}
        onClose={() => setVerifyingPmt(null)}
        title="Verify Payment Collection"
        description="Please adjust and confirm the subscription months to credit for this collection."
      >
        {verifyingPmt && (() => {
          // Detect plan drift: did the live plan change after the merchant submitted?
          const livePlanObj = verifyingPmt.targetPlanId
            ? plans.find(p => p.id === verifyingPmt.targetPlanId)
            : verifyingPmt.targetPlan
              ? plans.find(p => p.slug === verifyingPmt.targetPlan)
              : null

          const submittedFeatures = verifyingPmt.featuresAtPaymentTime as PlanFeatures | null | undefined
          const liveFeatures = livePlanObj?.features as PlanFeatures | undefined

          // CheckIcon if any numeric/boolean limit key differs between submission and now
          const driftedKeys: string[] = []
          if (submittedFeatures && liveFeatures) {
            const checkKeys = ["max_products", "max_categories", "max_orders_per_month", "max_images_per_product", "discount_codes", "telegram_notifications"] as const
            for (const k of checkKeys) {
              if (submittedFeatures[k] !== liveFeatures[k]) {
                driftedKeys.push(k.replace(/_/g, " "))
              }
            }
          }
          const hasPlanDrift = driftedKeys.length > 0

          return (
            <div className="flex flex-col gap-4 text-body-md text-ink select-text">
              {hasPlanDrift && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-caption font-medium flex items-start gap-2">
                  <AlertTriangleIcon className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold">Plan was edited since submission</span>
                    <span className="font-light text-amber-800">
                      Verifying at locked-in submission limits (changed: {driftedKeys.join(", ")}).
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5 p-3 bg-canvas-cream border border-hairline-light rounded-lg">
                <div className="flex justify-between items-center text-caption">
                  <span className="text-shade-50">Boutique:</span>
                  <span className="font-semibold text-ink">{verifyingPmt.merchantName}</span>
                </div>
                <div className="flex justify-between items-center text-caption mt-0.5">
                  <span className="text-shade-50">Target Plan:</span>
                  <span className="font-semibold text-ink capitalize">{verifyingPmt.targetPlan || "Starter"}</span>
                </div>
                <div className="flex justify-between items-center text-caption mt-0.5">
                  <span className="text-shade-50">Amount Paid:</span>
                  <span className="font-semibold text-ink font-mono">{formatTaka(verifyingPmt.amountPaisa)}</span>
                </div>
                <div className="flex justify-between items-center text-caption mt-0.5">
                  <span className="text-shade-50">TrxID:</span>
                  <span className="font-mono text-ink font-semibold uppercase">{verifyingPmt.transactionId}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mt-1.5">
                <label className="text-eyebrow-cap font-semibold text-shade-50 uppercase">
                  Credit Duration (Months)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={verificationMonths}
                    onChange={(e) => setVerificationMonths(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-20 text-body-md border border-hairline-light rounded-md px-3 py-2.5 bg-canvas-light text-ink focus:outline-none focus:ring-1 focus:ring-emerald-700 font-bold text-center"
                  />
                  <span className="text-caption text-shade-50 font-light">
                    Months to credit (1 to 12).
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => setVerifyingPmt(null)}
                  disabled={actionLoadingId === verifyingPmt.id}
                  className="px-4 py-2 text-caption cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleVerify}
                  disabled={actionLoadingId === verifyingPmt.id}
                  className="px-4 py-2 text-caption bg-emerald-800 hover:bg-emerald-700 text-white cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoadingId === verifyingPmt.id && <Loader2Icon className="h-3.5 w-3.5 animate-spin" />}
                  Confirm & Credit
                </Button>
              </div>
            </div>
          )
        })()}
      </Dialog>

      {/* Manual Collection Confirmation Dialog */}
      <Dialog
        isOpen={!!manualConfirmPmt}
        onClose={() => setManualConfirmPmt(null)}
        title="Confirm Manual Collection Record"
        description="Verify and select the credit duration for this manually recorded payment."
      >
        {manualConfirmPmt && (
          <div className="flex flex-col gap-4 text-body-md text-ink select-text">
            <div className="flex flex-col gap-1.5 p-3 bg-canvas-cream border border-hairline-light rounded-lg">
              <div className="flex justify-between items-center text-caption">
                <span className="text-shade-50">Boutique:</span>
                <span className="font-semibold text-ink">{manualConfirmPmt.merchantName}</span>
              </div>
              <div className="flex justify-between items-center text-caption mt-0.5">
                <span className="text-shade-50">Target Plan:</span>
                <span className="font-semibold text-ink capitalize">{manualConfirmPmt.plan}</span>
              </div>
              <div className="flex justify-between items-center text-caption mt-0.5">
                <span className="text-shade-50">Amount Paid:</span>
                <span className="font-semibold text-ink font-mono">৳{manualConfirmPmt.amountTaka}</span>
              </div>
              <div className="flex justify-between items-center text-caption mt-0.5">
                <span className="text-shade-50">TrxID:</span>
                <span className="font-mono text-ink font-semibold uppercase">{manualConfirmPmt.transactionId}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mt-1.5">
              <label className="text-eyebrow-cap font-semibold text-shade-50 uppercase">
                Credit Duration (Months)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={verificationMonths}
                  onChange={(e) => setVerificationMonths(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-20 text-body-md border border-hairline-light rounded-md px-3 py-2.5 bg-canvas-light text-ink focus:outline-none focus:ring-1 focus:ring-emerald-700 font-bold text-center"
                />
                <span className="text-caption text-shade-50 font-light">
                  Adjust subscription months to add.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4">
              <Button
                variant="outline-light"
                size="sm"
                onClick={() => setManualConfirmPmt(null)}
                disabled={loading}
                className="px-4 py-2 text-caption cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmManualSubmit}
                disabled={loading}
                className="px-4 py-2 text-caption bg-emerald-800 hover:bg-emerald-700 text-white cursor-pointer flex items-center gap-1.5"
              >
                {loading && <Loader2Icon className="h-3.5 w-3.5 animate-spin" />}
                Confirm & Record
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog
        isOpen={!!rejectingPmt}
        onClose={() => setRejectingPmt(null)}
        onConfirm={handleReject}
        title="Reject Payment Record"
        description={`Are you sure you want to reject this payment record of ${rejectingPmt ? formatTaka(rejectingPmt.amountPaisa) : ""} from ${rejectingPmt?.merchantName}? The merchant's subscription will not be updated.`}
        confirmText="Reject Record"
        cancelText="Cancel"
        variant="danger"
        isPending={actionLoadingId === rejectingPmt?.id}
      />
    </div>
  )
}
