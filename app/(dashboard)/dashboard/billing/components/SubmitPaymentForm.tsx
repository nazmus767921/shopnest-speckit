"use client"

import React, { useState } from "react"
import { LockIcon, TriangleAlertIcon, CheckIcon, CopyIcon, ArrowRightIcon, ArrowLeftIcon, QrCodeIcon, WalletIcon } from "@/lib/icons";

import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError, FieldDescription, FieldGroup, FieldSet, FieldLegend } from "@/components/ui/field"
import { submitPaymentAction } from "../actions"
import { cn } from "@/lib/utils"

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

interface SubmitPaymentFormProps {
  usageCounts: UsageCounts
  currentPlan: string
  plans: PlanItem[]
  preselectedPlanSlug?: string
}

export function SubmitPaymentForm({ usageCounts, currentPlan, plans, preselectedPlanSlug }: SubmitPaymentFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  const activePlans = plans.filter(p => !p.isArchived)
  const initialTargetPlan = preselectedPlanSlug || activePlans.find(p => p.slug === currentPlan)?.slug || (activePlans.length > 0 ? activePlans[0].slug : "starter")

  const form = useForm({
    defaultValues: {
      paymentMethod: "bkash" as "bkash" | "nagad",
      transactionId: "",
      targetPlan: initialTargetPlan,
    },
    onSubmit: async ({ value }) => {
      setLoading(true)
      setError(null)
      const targetPlanObj = activePlans.find(p => p.slug === value.targetPlan)
      const res = await submitPaymentAction({
        paymentMethod: value.paymentMethod,
        transactionId: value.transactionId,
        targetPlan: value.targetPlan,
        targetPlanId: targetPlanObj?.id,
      })
      setLoading(false)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(true)
        form.reset()
        setStep(1)
        setTimeout(() => setSuccess(false), 3000)
      }
    },
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderMockQRCode = (method: "bkash" | "nagad") => {
    const brandColor = method === "bkash" ? "#e2136e" : "#f15a22"
    return (
      <div className="relative flex flex-col items-center justify-center p-4 bg-white dark:bg-card border border-border rounded-xl w-36 h-36 mx-auto select-none">
        <svg
          viewBox="0 0 100 100"
          className="w-28 h-28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="5" y="5" width="20" height="20" rx="2" stroke={brandColor} strokeWidth="6" />
          <rect x="11" y="11" width="8" height="8" fill={brandColor} />

          <rect x="75" y="5" width="20" height="20" rx="2" stroke={brandColor} strokeWidth="6" />
          <rect x="81" y="11" width="8" height="8" fill={brandColor} />

          <rect x="5" y="75" width="20" height="20" rx="2" stroke={brandColor} strokeWidth="6" />
          <rect x="11" y="81" width="8" height="8" fill={brandColor} />

          <rect x="35" y="5" width="6" height="6" fill={brandColor} opacity="0.8" />
          <rect x="45" y="12" width="12" height="6" fill={brandColor} opacity="0.6" />
          <rect x="62" y="5" width="6" height="12" fill={brandColor} opacity="0.9" />
          <rect x="35" y="22" width="18" height="6" fill={brandColor} opacity="0.75" />

          <rect x="5" y="35" width="12" height="6" fill={brandColor} opacity="0.85" />
          <rect x="22" y="35" width="6" height="12" fill={brandColor} opacity="0.7" />
          <rect x="35" y="35" width="12" height="12" fill={brandColor} />
          <rect x="55" y="35" width="6" height="6" fill={brandColor} opacity="0.9" />
          <rect x="67" y="35" width="18" height="6" fill={brandColor} opacity="0.8" />

          <rect x="5" y="55" width="6" height="12" fill={brandColor} opacity="0.8" />
          <rect x="18" y="55" width="12" height="6" fill={brandColor} opacity="0.9" />
          <rect x="35" y="55" width="6" height="6" fill={brandColor} opacity="0.65" />
          <rect x="47" y="55" width="18" height="12" fill={brandColor} />
          <rect x="72" y="55" width="12" height="6" fill={brandColor} opacity="0.8" />

          <rect x="35" y="75" width="12" height="6" fill={brandColor} opacity="0.9" />
          <rect x="52" y="75" width="6" height="18" fill={brandColor} opacity="0.7" />
          <rect x="65" y="75" width="6" height="6" fill={brandColor} opacity="0.8" />
          <rect x="78" y="75" width="12" height="12" fill={brandColor} />
          <rect x="65" y="87" width="12" height="6" fill={brandColor} opacity="0.85" />
        </svg>
        <span
          className="absolute bottom-1 text-[9px] font-bold uppercase tracking-widest animate-pulse"
          style={{ color: brandColor }}
        >
          Scan to Pay
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full text-foreground">
      {/* Wizard Steps Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 bg-muted rounded-lg text-foreground">
            <WalletIcon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Renewal &amp; Upgrade Portal</h3>
            <p className="text-xs text-muted-foreground">Manage subscription payments manually</p>
          </div>
        </div>
        {/* Step Indicator Bubbles */}
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "w-6.5 h-6.5 rounded-full flex items-center justify-center text-xs font-bold transition-all border",
                step === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : step > s
                    ? "bg-muted text-foreground border-border"
                    : "bg-muted/30 text-muted-foreground border-border"
              )}
            >
              {step > s ? <CheckIcon className="w-3.5 h-3.5" /> : s}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3.5 rounded-xl flex items-start gap-2">
          <TriangleAlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl flex items-start gap-2">
          <CheckIcon className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Payment submitted successfully. Awaiting admin verification.</span>
        </div>
      )}

      {/* Downgrade alert checks */}
      {step === 1 && (
        <form.Subscribe selector={(state) => state.values.targetPlan}>
          {(targetPlan) => {
            const targetPlanObj = activePlans.find(p => p.slug === targetPlan)
            const targetPlanFeatures = targetPlanObj?.features
            const maxProducts = targetPlanFeatures?.max_products ?? null
            const maxOrders = targetPlanFeatures?.max_orders_per_month ?? null

            const exceedsProductLimit = maxProducts !== null && usageCounts.productsCount > maxProducts
            const exceedsOrderLimit = maxOrders !== null && usageCounts.monthlyOrdersCount > maxOrders

            if (!exceedsProductLimit && !exceedsOrderLimit) return null

            return (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3.5 rounded-xl flex flex-col gap-1">
                <span className="font-semibold flex items-center gap-1.5">
                  <TriangleAlertIcon className="w-4 h-4" /> Cannot Downgrade Plan
                </span>
                {exceedsProductLimit && (
                  <span>
                    Your store has <strong>{usageCounts.productsCount}</strong> products, which exceeds the {targetPlanObj?.name} plan limit of {maxProducts}. Please delete some products first.
                  </span>
                )}
                {exceedsOrderLimit && (
                  <span>
                    Your store has received <strong>{usageCounts.monthlyOrdersCount}</strong> orders this month, which exceeds the {targetPlanObj?.name} plan limit of {maxOrders}.
                  </span>
                )}
              </div>
            )
          }}
        </form.Subscribe>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (step < 3) return
          form.handleSubmit()
        }}
        className="flex flex-col gap-6"
      >
        {/* STEP 1: SELECT PLAN */}
        {step === 1 && (
          <form.Field name="targetPlan">
            {(field) => {
              return (
                <Field className="animate-fade-in">
                  <FieldLabel>Step 1: Choose Your Plan</FieldLabel>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {activePlans.map((p) => {
                      const maxProducts = p.features.max_products
                      const maxOrders = p.features.max_orders_per_month

                      const exceedsProductLimit = maxProducts !== null && usageCounts.productsCount > maxProducts
                      const exceedsOrderLimit = maxOrders !== null && usageCounts.monthlyOrdersCount > maxOrders
                      const planLocked = exceedsProductLimit || exceedsOrderLimit

                      const isActivePlan = currentPlan === p.slug
                      const isSelected = field.state.value === p.slug

                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            if (!planLocked) {
                              field.handleChange(p.slug)
                            }
                          }}
                          className={cn(
                            "relative p-5 border rounded-xl flex flex-col gap-2 transition-all select-none w-full",
                            planLocked
                              ? "border-destructive/20 bg-destructive/5 opacity-60 cursor-not-allowed"
                              : isSelected
                                ? "border-primary bg-muted/40 ring-1 ring-primary cursor-pointer"
                                : "border-border hover:border-muted-foreground/30 bg-card cursor-pointer"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                {p.name}
                                {planLocked && (
                                  <span className="text-destructive text-xs flex items-center gap-1 font-bold">
                                    <LockIcon className="w-2.5 h-2.5" /> Locked
                                  </span>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground mt-0.5">
                                {p.slug === "starter" ? "For boutique stores" : p.slug === "growth" ? "For scaling brands" : "Dynamic plan tier"}
                              </span>
                            </div>
                            {isActivePlan && (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                                Active
                              </span>
                            )}
                          </div>

                          <div className="flex items-baseline gap-0.5 mt-2">
                            <span className="text-2xl font-bold text-foreground">৳{(p.pricePaisa / 100).toLocaleString("en-BD")}</span>
                            <span className="text-xs text-muted-foreground">/ month</span>
                          </div>

                          <ul className="text-sm text-muted-foreground space-y-1 pt-2 border-t border-border leading-normal">
                            <li>• {maxProducts !== null ? `Up to ${maxProducts} products` : "Unlimited products"}</li>
                            <li>• {maxOrders !== null ? `Up to ${maxOrders} orders / month` : "Unlimited monthly orders"}</li>
                            <li>• {p.features.discount_codes ? "Discount codes & promos enabled" : "Discount codes locked"}</li>
                          </ul>

                          {planLocked && (
                            <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 p-2.5 rounded-lg flex flex-col gap-1 mt-2">
                              <span className="font-semibold flex items-center gap-1">
                                <TriangleAlertIcon className="w-3 h-3" /> Downgrade Blocked:
                              </span>
                              <ul className="list-disc pl-4 space-y-0.5 font-medium">
                                {exceedsProductLimit && (
                                  <li>Store has {usageCounts.productsCount} products (limit: {maxProducts})</li>
                                )}
                                {exceedsOrderLimit && (
                                  <li>Store has {usageCounts.monthlyOrdersCount} orders (limit: {maxOrders})</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={(() => {
                      const selectedPlanObj = activePlans.find(p => p.slug === field.state.value)
                      if (!selectedPlanObj) return true
                      const maxProducts = selectedPlanObj.features.max_products
                      const maxOrders = selectedPlanObj.features.max_orders_per_month
                      return (maxProducts !== null && usageCounts.productsCount > maxProducts) ||
                             (maxOrders !== null && usageCounts.monthlyOrdersCount > maxOrders)
                    })()}
                    className="w-full mt-2"
                  >
                    <span>Continue to Payment Method</span>
                    <ArrowRightIcon className="w-4 h-4 ml-1.5" />
                  </Button>
                </Field>
              )
            }}
          </form.Field>
        )}

        {/* STEP 2: CHOOSE PAYMENT CHANNEL & DETAILS */}
        {step === 2 && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <FieldLabel>Step 2: Send Money to WalletIcon</FieldLabel>

            <form.Field name="paymentMethod">
              {(field) => (
                <div className="grid grid-cols-2 gap-4">
                  {/* bKash Card */}
                  <div
                    onClick={() => field.handleChange("bkash")}
                    className={cn(
                      "p-3.5 border rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer select-none text-center",
                      field.state.value === "bkash"
                        ? "border-[#e2136e] bg-[#e2136e]/5 ring-1 ring-[#e2136e] text-[#e2136e]"
                        : "border-border hover:border-muted-foreground/30 bg-card text-foreground"
                    )}
                  >
                    <span className="text-sm font-bold">bKash</span>
                    <span className="text-[10px] opacity-75">Send Money (Personal)</span>
                  </div>

                  {/* Nagad Card */}
                  <div
                    onClick={() => field.handleChange("nagad")}
                    className={cn(
                      "p-3.5 border rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer select-none text-center",
                      field.state.value === "nagad"
                        ? "border-[#f15a22] bg-[#f15a22]/5 ring-1 ring-[#f15a22] text-[#f15a22]"
                        : "border-border hover:border-muted-foreground/30 bg-card text-foreground"
                    )}
                  >
                    <span className="text-sm font-bold">Nagad</span>
                    <span className="text-[10px] opacity-75">Send Money (Personal)</span>
                  </div>
                </div>
              )}
            </form.Field>

            <form.Subscribe selector={(state) => state.values}>
              {({ paymentMethod, targetPlan }) => {
                const targetPlanObj = activePlans.find(p => p.slug === targetPlan)
                const amount = targetPlanObj ? "৳" + (targetPlanObj.pricePaisa / 100).toLocaleString("en-BD") : "—"
                const number = paymentMethod === "bkash" ? "01712-345678" : "01812-345678"
                return (
                  <div className="flex flex-col gap-4">
                    {/* Visual QR scan & wallet copy block */}
                    <div className="border border-border rounded-xl p-4 bg-muted/10 flex flex-col gap-4">
                      {renderMockQRCode(paymentMethod)}

                      <div className="flex flex-col gap-2 pt-2 border-t border-border">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Transfer Amount:</span>
                          <span className="font-bold text-foreground">{amount}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">WalletIcon Number:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-foreground bg-card border border-border px-2 py-0.5 rounded text-xs">
                              {number}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(number.replace("-", ""))}
                              className="p-1 hover:bg-muted rounded transition-all text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Copy Wallet Number"
                            >
                              {copied ? (
                                <CheckIcon className="w-3.5 h-3.5 text-emerald-650 font-bold" />
                              ) : (
                                <CopyIcon className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg leading-normal flex items-start gap-1.5">
                      <QrCodeIcon className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
                      <span>
                        Use your {paymentMethod === "bkash" ? "bKash" : "Nagad"} App to scan the QR code or send personal Send Money of <strong>{amount}</strong> to the number above.
                      </span>
                    </div>
                  </div>
                )
              }}
            </form.Subscribe>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 min-w-30"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                <span>Plans</span>
              </Button>
              <Button
                type="button"
                onClick={() => setStep(3)}
                className="flex-2 min-w-40"
              >
                <span>Verification</span>
                <ArrowRightIcon className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: SUBMIT TRANSACTION ID */}
        {step === 3 && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <FieldLabel>Step 3: Verification Details</FieldLabel>

            <form.Subscribe selector={(state) => state.values}>
              {({ paymentMethod, targetPlan }) => {
                const targetPlanObj = activePlans.find(p => p.slug === targetPlan)
                const amount = targetPlanObj ? "৳" + (targetPlanObj.pricePaisa / 100).toLocaleString("en-BD") : "—"
                return (
                  <div className="text-sm text-muted-foreground bg-muted p-3.5 rounded-xl flex flex-col gap-1 leading-normal border border-border">
                    <span className="font-semibold text-foreground">Selected transaction parameters:</span>
                    <span>Plan: <strong className="capitalize text-foreground">{targetPlanObj?.name || targetPlan}</strong></span>
                    <span>Channel: <strong className="capitalize text-foreground">{paymentMethod}</strong></span>
                    <span>Amount: <strong className="text-foreground">{amount}</strong></span>
                  </div>
                )
              }}
            </form.Subscribe>

            <form.Field
              name="transactionId"
              validators={{
                onChange: ({ value }) => {
                  if (!value || value.trim().length === 0) {
                    return "Transaction ID is required."
                  }
                  if (value.trim().length < 8) {
                    return "Transaction ID must be at least 8 characters."
                  }
                  if (!/^[a-zA-Z0-9]+$/.test(value)) {
                    return "Transaction ID must be alphanumeric (letters and numbers only)."
                  }
                  return undefined
                },
                onBlur: ({ value }) => {
                  if (!value || value.trim().length === 0) {
                    return "Transaction ID is required."
                  }
                  if (value.trim().length < 8) {
                    return "Transaction ID must be at least 8 characters."
                  }
                  if (!/^[a-zA-Z0-9]+$/.test(value)) {
                    return "Transaction ID must be alphanumeric (letters and numbers only)."
                  }
                  return undefined
                },
              }}
            >
              {(field) => {
                const hasError = field.state.meta.isTouched && field.state.meta.errors.length > 0
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Transaction ID (TxID)</FieldLabel>
                    <Input
                      id={field.name}
                      placeholder="e.g. 8N52B3X9"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className={cn(
                        "font-mono uppercase tracking-wider text-sm rounded-lg bg-card py-3",
                        hasError ? "border-destructive text-destructive" : ""
                      )}
                    />
                    {hasError ? (
                      <FieldError>
                        <span className="flex items-center gap-1">
                          <TriangleAlertIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{field.state.meta.errors[0]}</span>
                        </span>
                      </FieldError>
                    ) : (
                      <FieldDescription>
                        Input the 8+ digit transaction code from your wallet sms receipt.
                      </FieldDescription>
                    )}
                  </Field>
                )
              }}
            </form.Field>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 min-w-[120px]"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
                <span>WalletIcon Info</span>
              </Button>

              <form.Subscribe
                selector={(state) => ({
                  canSubmit: state.canSubmit,
                  transactionId: state.values.transactionId,
                })}
              >
                {({ canSubmit, transactionId }) => {
                  const isTxIdEmpty = !transactionId || transactionId.trim().length === 0
                  return (
                    <Button
                      type="submit"
                      disabled={!canSubmit || loading || isTxIdEmpty}
                      className="flex-2 min-w-[180px]"
                    >
                      {loading ? "Submitting..." : "Submit Payment Details"}
                    </Button>
                  )
                }}
              </form.Subscribe>
            </div>
          </div>
        )}

        <span className="text-xs text-muted-foreground text-center leading-normal flex items-center justify-center gap-1 pt-2 border-t border-border">
          <TriangleAlertIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span>Renewals take effect immediately upon Admin verification.</span>
        </span>
      </form>
    </div>
  )
}
