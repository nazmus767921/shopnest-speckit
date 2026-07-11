"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon, CheckIcon, ChevronLeftIcon, Loader2Icon, AlertCircleIcon, XIcon } from "@/lib/icons";

import { useCart } from "@/hooks/use-cart"
import { type CartItem } from "@/lib/cart/cart-store"
import { addressSchema, paymentSchema } from "@/lib/validations/checkout"
import { CheckoutIdentitySection } from "./CheckoutIdentitySection"
import { Card, Button, Input, FormLabel, Combobox } from "@/components/ui"
import { toast } from "@/components/ui/feedback/Toast"
import { formatTaka } from "@/lib/utils"
import { submitAddress, submitPayment } from "@/app/(storefront)/[subdomain]/checkout/actions"
import { useCheckoutStore } from "@/lib/checkout/checkout-store"

interface Props {
  merchantId: string
  merchantName: string
  subdomain: string
  bkashNumber: string | null
  nagadNumber: string | null
  codEnabled: boolean
  payDeliveryChargeFirst: boolean
  bkashWalletNumber: string | null
  nagadWalletNumber: string | null
  shippingZones: Array<{
    id: string
    name: string
    deliveryChargePaisa: number
    freeShippingThresholdPaisa: number | null
    districts: Array<{
      id: string
      division: string
      district: string
    }>
  }>
}

type Step = "address" | "payment" | "confirm"

export function CheckoutClientPage({
  merchantId,
  merchantName,
  subdomain,
  bkashNumber,
  nagadNumber,
  codEnabled,
  payDeliveryChargeFirst,
  bkashWalletNumber,
  nagadWalletNumber,
  shippingZones = [],
}: Props) {
  const router = useRouter()
  const { items, totalItems, subtotalPaisa, clearCart } = useCart(merchantId)
  
  const checkoutItems = useCheckoutStore((s) => s.items)
  const clearCheckoutStore = useCheckoutStore((s) => s.clearCheckoutStore)
  const isBuyNow = checkoutItems.length > 0

  const activeItems = isBuyNow ? checkoutItems : items
  const activeSubtotalPaisa = isBuyNow
    ? checkoutItems.reduce((sum, i) => sum + i.pricePaisa * i.quantity, 0)
    : subtotalPaisa

  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<Step>("address")
  
  // Step 1: Address State
  const [deliveryName, setDeliveryName] = useState("")
  const [deliveryPhone, setDeliveryPhone] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryCity, setDeliveryCity] = useState("")
  const [deliveryChargePaisa, setDeliveryChargePaisa] = useState(0)
  const [isVerified, setIsVerified] = useState(false)

  // Track division and district choices
  const [selectedDivision, setSelectedDivision] = useState<string>("")
  const [selectedDistrict, setSelectedDistrict] = useState<string>("")
  
  // Step 2: Payment State
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad" | "cod">("bkash")
  const [codUpfrontMethod, setCodUpfrontMethod] = useState<"bkash" | "nagad">("bkash")
  const [transactionId, setTransactionId] = useState("")
  
  // Result state
  const [orderId, setOrderId] = useState("")
  const [totalPaisaState, setTotalPaisaState] = useState(0)

  // Loading & Error States
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState("")

  // Track if threshold-based free shipping is currently active
  const [isFreeShipping, setIsFreeShipping] = useState(false)

  const handleVerified = useCallback(() => {
    setIsVerified(true)
  }, [])

  // Redirect to cart if empty (and not on success step)
  // Mark as client-side mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const isHydrated = useCheckoutStore.persist.hasHydrated()
    if (mounted && isHydrated && activeItems.length === 0 && step !== "confirm") {
      router.push("/cart")
    }
  }, [mounted, activeItems, step, router])

  // Clear cart upon reaching confirmation step
  useEffect(() => {
    if (step === "confirm") {
      clearCart()
      clearCheckoutStore()
    }
  }, [step, clearCart, clearCheckoutStore])

  // Clear checkout store when navigating away before confirmation
  useEffect(() => {
    return () => {
      if (step !== "confirm") {
        clearCheckoutStore()
      }
    }
  }, [step, clearCheckoutStore])

  // Calculate delivery charge reactively on selectedDistrict or subtotal changes
  useEffect(() => {
    if (!selectedDistrict) {
      setDeliveryChargePaisa(0)
      setIsFreeShipping(false)
      return
    }

    const zoneDistrict = shippingZones
      .flatMap((z) => z.districts.map((d) => ({ ...d, zone: z })))
      .find((d) => d.district === selectedDistrict)

    if (zoneDistrict) {
      const zone = zoneDistrict.zone
      const isFree = zone.freeShippingThresholdPaisa !== null
        && activeSubtotalPaisa >= zone.freeShippingThresholdPaisa
      
      setDeliveryChargePaisa(isFree ? 0 : zone.deliveryChargePaisa)
      setIsFreeShipping(isFree)
    } else {
      setDeliveryChargePaisa(0)
      setIsFreeShipping(false)
    }
  }, [selectedDistrict, activeSubtotalPaisa, shippingZones])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-shade-40">Loading checkout...</div>
      </div>
    )
  }

  // If redirecting, render placeholder
  if (activeItems.length === 0 && step !== "confirm") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-shade-40">Redirecting to cart...</div>
      </div>
    )
  }

  // Block checkout if no shipping zones configured
  if (shippingZones.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center select-text">
        <Card variant="default" className="p-8 flex flex-col items-center gap-4 border border-red-200 bg-red-50/10 rounded-[var(--radius)]">
          <AlertCircleIcon className="h-12 w-12 text-red-500" />
          <h2 className="text-heading-lg font-semibold text-ink">Checkout Unavailable</h2>
          <p className="text-body-md text-shade-50 font-light">
            This store has not configured any shipping zones. Checkout is currently unavailable. Please contact the merchant.
          </p>
          <Link href="/" className="mt-4">
            <Button variant="outline-light" className="rounded-[var(--radius)]">Back to Shop</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const configuredDivisions = Array.from(
    new Set(shippingZones.flatMap((z) => z.districts.map((d) => d.division)))
  ).sort()

  const configuredDistricts = Array.from(
    new Set(
      shippingZones
        .flatMap((z) => z.districts)
        .filter((d) => d.division === selectedDivision)
        .map((d) => d.district)
    )
  ).sort()
  const handleDivisionChange = (divisionName: string | null) => {
    setSelectedDivision(divisionName || "")
    setSelectedDistrict("")
    setDeliveryCity("")
  }

  const handleDistrictChange = (districtName: string | null) => {
    if (districtName) {
      setSelectedDistrict(districtName)
      setDeliveryCity(`${selectedDivision} - ${districtName}`)
    } else {
      setSelectedDistrict("")
      setDeliveryCity("")
    }
  }

  // Address Submit Handler
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isVerified) {
      setSubmitError("Please verify your phone number using OTP first.")
      return
    }

    setSubmitting(true)
    setErrors({})
    setSubmitError("")

    const addressData = {
      deliveryName,
      deliveryPhone,
      deliveryAddress,
      deliveryCity,
      deliveryChargePaisa,
      items: activeItems.map((i: any) => ({
        productId: i.productId,
        quantity: i.quantity,
        variantId: i.variantId ?? undefined,
        variantLabel: i.variantLabel ?? undefined,
      })),
    }

    // Validate with Zod
    const validation = addressSchema.safeParse(addressData)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as string
        fieldErrors[path] = issue.message
      })
      setErrors(fieldErrors)
      setSubmitting(false)
      return
    }

    try {
      const res = await submitAddress(addressData)
      if ("error" in res) {
        const errorMsg = res.error || "An error occurred."
        setSubmitError(errorMsg)
        toast.error(errorMsg, { duration: 15000 })
      } else {
        setOrderId(res.orderId)
        setTotalPaisaState(res.totalPaisa)
        setStep("payment")
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong. Please try again."
      setSubmitError(errorMsg)
      toast.error(errorMsg, { duration: 15000 })
    } finally {
      setSubmitting(false)
    }
  }

  // Payment Submit Handler
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    setSubmitError("")

    const paymentData = {
      paymentMethod,
      transactionId: paymentMethod === "cod" && !payDeliveryChargeFirst ? "COD" : transactionId,
    }

    // Validate with Zod
    const validation = paymentSchema.safeParse(paymentData)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as string
        fieldErrors[path] = issue.message
      })
      setErrors(fieldErrors)
      setSubmitting(false)
      return
    }

    try {
      const res = await submitPayment(paymentData)
      if ("error" in res) {
        const errorMsg = res.error || "Failed to submit payment details."
        setSubmitError(errorMsg)
        toast.error(errorMsg, { duration: 15000 })
      } else {
        setStep("confirm")
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to submit payment details."
      setSubmitError(errorMsg)
      toast.error(errorMsg, { duration: 15000 })
    } finally {
      setSubmitting(false)
    }
  }

  const activeMerchantNumber = paymentMethod === "cod"
    ? (codUpfrontMethod === "bkash" ? bkashWalletNumber : nagadWalletNumber)
    : (paymentMethod === "bkash" ? bkashNumber : nagadNumber)

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-fade-in pb-16">
      {/* Stepper Progress Bar */}
      <div className="flex items-center justify-between border-b border-hairline-light pb-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === "address"
                  ? "bg-primary text-on-primary"
                  : "bg-aloe-10 text-ink"
              }`}
            >
              {step === "address" ? "1" : <CheckIcon className="h-3.5 w-3.5" />}
            </span>
            <span
              className={`text-eyebrow-cap font-semibold tracking-wider ${
                step === "address" ? "text-ink" : "text-shade-40"
              }`}
            >
              Address
            </span>
          </div>

          <span className="text-shade-30">/</span>

          <div className="flex items-center gap-2">
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === "payment"
                  ? "bg-primary text-on-primary"
                  : step === "confirm"
                  ? "bg-aloe-10 text-ink"
                  : "bg-shade-30 text-shade-50"
              }`}
            >
              {step === "confirm" ? <CheckIcon className="h-3.5 w-3.5" /> : "2"}
            </span>
            <span
              className={`text-eyebrow-cap font-semibold tracking-wider ${
                step === "payment" ? "text-ink" : "text-shade-40"
              }`}
            >
              Payment
            </span>
          </div>

          <span className="text-shade-30">/</span>

          <div className="flex items-center gap-2">
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === "confirm"
                  ? "bg-primary text-on-primary"
                  : "bg-shade-30 text-shade-50"
              }`}
            >
              3
            </span>
            <span
              className={`text-eyebrow-cap font-semibold tracking-wider ${
                step === "confirm" ? "text-ink" : "text-shade-40"
              }`}
            >
              Confirm
            </span>
          </div>
        </div>

        {step !== "confirm" && (
          <Link
            href="/cart"
            className="flex items-center gap-1 text-caption text-shade-60 hover:text-ink font-medium"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>Back to Cart</span>
          </Link>
        )}
      </div>

      {submitError && (
        <div className="flex items-start gap-3 text-body-md text-red-800 bg-red-50 p-4 rounded-xl border border-red-200/60" role="alert">
          <AlertCircleIcon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <span className="flex-1">{submitError}</span>
          <button
            type="button"
            onClick={() => setSubmitError("")}
            className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-700 transition shrink-0"
            aria-label="Dismiss"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* STEP 1: Address and Identity Verification */}
      {step === "address" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <form onSubmit={handleAddressSubmit} className="md:col-span-2 flex flex-col gap-6">
            <Card variant="default" className="p-6 flex flex-col gap-6 !overflow-visible rounded-[var(--radius)]">
              <h2 className="text-heading-lg font-semibold text-ink">
                Fulfillment Address
              </h2>

              <div className="flex flex-col gap-4">
                <div>
                  <FormLabel htmlFor="delivery-name">Full Name</FormLabel>
                  <Input
                    id="delivery-name"
                    type="text"
                    placeholder="Recipient's Name"
                    value={deliveryName}
                    onChange={(e) => setDeliveryName(e.target.value)}
                    error={!!errors.deliveryName}
                    className="rounded-[var(--radius)]"
                  />
                  {errors.deliveryName && (
                    <p className="text-xs text-red-500 mt-1">{errors.deliveryName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FormLabel htmlFor="delivery-phone">Delivery Phone</FormLabel>
                    <Input
                      id="delivery-phone"
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={deliveryPhone}
                      onChange={(e) => {
                        setDeliveryPhone(e.target.value)
                      }}
                      error={!!errors.deliveryPhone}
                      className="rounded-[var(--radius)]"
                    />
                    {errors.deliveryPhone && (
                      <p className="text-xs text-red-500 mt-1">{errors.deliveryPhone}</p>
                    )}
                  </div>

                  <div>
                  {shippingZones.length > 0 ? (
                    <div>
                      <FormLabel htmlFor="delivery-division">Division</FormLabel>
                      <Combobox
                        options={configuredDivisions}
                        value={selectedDivision || null}
                        onChange={handleDivisionChange}
                        getOptionLabel={(d) => d}
                        getOptionValue={(d) => d}
                        placeholder="Select Division..."
                        error={errors.deliveryCity}
                        className="rounded-[var(--radius)]"
                      />
                    </div>
                  ) : (
                    <div>
                      <FormLabel htmlFor="delivery-city">City</FormLabel>
                      <Input
                        id="delivery-city"
                        type="text"
                        placeholder="e.g. Dhaka"
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        error={!!errors.deliveryCity}
                        className="rounded-[var(--radius)]"
                      />
                      {errors.deliveryCity && (
                        <p className="text-xs text-red-500 mt-1">{errors.deliveryCity}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {shippingZones.length > 0 && (
                  <div>
                    <FormLabel htmlFor="delivery-district">District / Area</FormLabel>
                    <Combobox
                      options={configuredDistricts}
                      value={selectedDistrict || null}
                      onChange={handleDistrictChange}
                      getOptionLabel={(d) => d}
                      getOptionValue={(d) => d}
                      placeholder="Select District..."
                      disabled={!selectedDivision}
                      error={errors.deliveryCity}
                      className="rounded-[var(--radius)]"
                    />
                  </div>
                )}

                <div>
                  <FormLabel htmlFor="delivery-address">Address Details</FormLabel>
                  <textarea
                    id="delivery-address"
                    rows={3}
                    placeholder="House number, flat, road, area, landmarks..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full text-input rounded-[var(--radius)] border border-hairline-light bg-canvas-light text-ink p-3 text-body-md focus:border-primary focus:outline-none"
                  />
                  {errors.deliveryAddress && (
                    <p className="text-xs text-red-500 mt-1">{errors.deliveryAddress}</p>
                  )}
                </div>
              </div>
            </Card>

            <CheckoutIdentitySection
              phone={deliveryPhone}
              merchantId={merchantId}
              onVerified={handleVerified}
            />

            <Button
              type="submit"
              variant="primary"
              disabled={!isVerified || submitting}
              className="w-full py-4 min-h-12 text-body-strong font-semibold rounded-[var(--radius)]"
            >
              {submitting ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin mr-1.5" />
                  Processing Order...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </form>

          {/* Checkout Right Summary Panel */}
          <div className="flex flex-col gap-4">
            <Card variant="default" className="p-6 bg-canvas-light flex flex-col gap-4 rounded-[var(--radius)]">
              <h3 className="text-body-strong font-bold text-ink uppercase tracking-wider pb-3 border-b border-hairline-light">
                Summary
              </h3>
              <div className="flex flex-col gap-3 text-caption text-shade-60">
                {activeItems.map((i: any) => (
                  <div key={i.productId} className="flex justify-between gap-4">
                    <span className="truncate grow max-w-[160px]">
                      {i.name} <span className="font-semibold text-ink">× {i.quantity}</span>
                    </span>
                    <span className="font-mono text-ink">
                      {formatTaka(i.pricePaisa * i.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="h-px bg-hairline-light my-2" />

              <div className="flex justify-between items-center text-body-strong font-bold text-ink">
                <span>Subtotal</span>
                <span>{formatTaka(activeSubtotalPaisa)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Delivery</span>
                {isFreeShipping ? (
                  <span className="text-emerald-700 font-semibold uppercase">Free (Threshold Met)</span>
                ) : deliveryChargePaisa > 0 ? (
                  <span className="font-semibold text-ink">{formatTaka(deliveryChargePaisa)}</span>
                ) : (
                  <span className="text-emerald-700 font-semibold uppercase">Free</span>
                )}
              </div>

              <div className="h-px bg-hairline-light my-1" />

              <div className="flex justify-between items-center text-heading-lg font-bold text-ink">
                <span>Total</span>
                <span>{formatTaka(activeSubtotalPaisa + deliveryChargePaisa)}</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* STEP 2: Payment Instructions */}
      {step === "payment" && (
        <div className="max-w-2xl mx-auto w-full">
          <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-6">
            <Card variant="default" className="p-6 flex flex-col gap-6 rounded-[var(--radius)]">
              <div className="flex flex-col gap-1">
                <h2 className="text-heading-lg font-semibold text-ink">
                  {paymentMethod === "cod"
                    ? (payDeliveryChargeFirst ? "Advance Shipping Charge Payment" : "Confirm Cash on Delivery Order")
                    : "Manual bKash/Nagad Payment"}
                </h2>
                <p className="text-caption text-shade-50">
                  {paymentMethod === "cod"
                    ? (payDeliveryChargeFirst ? "Please pay the delivery charge upfront. The remaining product balance will be paid in cash at delivery." : "Your order will be processed and you can pay the full amount in cash at delivery time.")
                    : "Please send the exact order amount manually using your mobile wallet."}
                </p>
              </div>

              {/* Payment Method Selector */}
              <div className={`grid gap-4 ${codEnabled ? "grid-cols-3" : "grid-cols-2"}`}>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("bkash")
                    setTransactionId("")
                  }}
                  className={`py-3.5 px-6 rounded-[var(--radius)] font-bold flex items-center justify-center border transition-all text-body-strong ${
                    paymentMethod === "bkash"
                      ? "border-pink-600 bg-pink-50/50 text-pink-700 font-bold"
                      : "border-hairline-light bg-canvas-light text-shade-60 hover:border-shade-40"
                  }`}
                >
                  bKash
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("nagad")
                    setTransactionId("")
                  }}
                  className={`py-3.5 px-6 rounded-[var(--radius)] font-bold flex items-center justify-center border transition-all text-body-strong ${
                    paymentMethod === "nagad"
                      ? "border-orange-600 bg-orange-50/50 text-orange-700 font-bold"
                      : "border-hairline-light bg-canvas-light text-shade-60 hover:border-shade-40"
                  }`}
                >
                  Nagad
                </button>
                {codEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("cod")
                      setTransactionId("")
                    }}
                    className={`py-3.5 px-6 rounded-[var(--radius)] font-bold flex items-center justify-center border transition-all text-body-strong ${
                      paymentMethod === "cod"
                        ? "border-zinc-950 bg-zinc-100 text-zinc-950 font-bold"
                        : "border-hairline-light bg-canvas-light text-shade-60 hover:border-shade-40"
                    }`}
                  >
                    COD
                  </button>
                )}
              </div>

              {/* Payment Instructions Card */}
              {paymentMethod === "cod" ? (
                payDeliveryChargeFirst ? (
                  /* Upfront Delivery Payment Instructions */
                  <div className="bg-canvas-cream border border-hairline-light rounded-xl p-6 flex flex-col gap-4 text-ink">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-eyebrow-cap font-semibold text-shade-50 uppercase tracking-widest">
                        Advance Delivery Charge Payment
                      </span>
                      <p className="text-caption text-shade-70">
                        Please send the delivery charge of <strong className="text-ink">{formatTaka(deliveryChargePaisa)}</strong> to the merchant's personal wallet number below.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCodUpfrontMethod("bkash")}
                        className={`py-2 px-4 rounded-lg font-bold flex items-center justify-center border transition-all text-xs ${
                          codUpfrontMethod === "bkash"
                            ? "border-pink-650 bg-pink-50/50 text-pink-700"
                            : "border-hairline-light bg-canvas-light text-shade-60"
                        }`}
                      >
                        bKash
                      </button>
                      <button
                        type="button"
                        onClick={() => setCodUpfrontMethod("nagad")}
                        className={`py-2 px-4 rounded-lg font-bold flex items-center justify-center border transition-all text-xs ${
                          codUpfrontMethod === "nagad"
                            ? "border-orange-650 bg-orange-50/50 text-orange-700"
                            : "border-hairline-light bg-canvas-light text-shade-60"
                        }`}
                      >
                        Nagad
                      </button>
                    </div>

                    <div className="flex flex-col gap-1 mt-2">
                      <span className="text-[10px] text-shade-50 uppercase tracking-wider">Merchant {codUpfrontMethod === "bkash" ? "bKash" : "Nagad"} Wallet</span>
                      {activeMerchantNumber ? (
                        <span className="font-mono text-display-md font-bold text-ink">
                          {activeMerchantNumber}
                        </span>
                      ) : (
                        <span className="text-caption text-red-650 font-medium bg-red-50 p-2 rounded border border-red-200">
                          {codUpfrontMethod === "bkash" ? "bKash" : "Nagad"} number not configured. Contact store.
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 border-t border-hairline-light/60 pt-3">
                      <div className="flex justify-between items-center text-xs text-shade-60">
                        <span>Upfront Payment (Delivery Charge):</span>
                        <span className="font-semibold text-ink">{formatTaka(deliveryChargePaisa)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-shade-60">
                        <span>Cash on Delivery (Product Balance):</span>
                        <span className="font-semibold text-ink">{formatTaka(totalPaisaState - deliveryChargePaisa)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-hairline-light/45 pt-2 text-body-strong font-bold text-ink">
                        <span>Total Amount:</span>
                        <span>{formatTaka(totalPaisaState)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Cash on Delivery note */
                  <div className="bg-canvas-cream border border-hairline-light rounded-xl p-6 flex flex-col gap-4 text-ink">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-eyebrow-cap font-semibold text-shade-50 uppercase tracking-widest">
                        Cash on Delivery
                      </span>
                      <p className="text-body-md text-ink leading-relaxed">
                        Pay the full order amount in cash at your doorstep when the delivery agent delivers your package.
                      </p>
                    </div>
                    <div className="flex justify-between items-center border-t border-hairline-light/60 pt-3">
                      <span className="text-caption text-shade-60">Total Amount to Pay on Delivery:</span>
                      <span className="text-heading-lg font-bold text-ink">
                        {formatTaka(totalPaisaState)}
                      </span>
                    </div>
                  </div>
                )
              ) : (
                /* Regular Manual payment instructions */
                <div className="bg-canvas-cream border border-hairline-light rounded-xl p-6 flex flex-col gap-4 text-ink">
                  <div className="flex flex-col gap-1">
                    <span className="text-eyebrow-cap font-semibold text-shade-50 uppercase tracking-widest">
                      Merchant Wallet Number
                    </span>
                    {activeMerchantNumber ? (
                      <span className="font-mono text-display-md font-bold text-ink">
                        {activeMerchantNumber}
                      </span>
                    ) : (
                      <span className="text-caption text-red-650 font-medium bg-red-50 p-2 rounded border border-red-200">
                        Payment details not configured. Contact store to pay.
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center border-t border-hairline-light/60 pt-3">
                    <span className="text-caption text-shade-60">Total Amount:</span>
                    <span className="text-heading-lg font-bold text-ink">
                      {formatTaka(totalPaisaState)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 border-t border-hairline-light/60 pt-3">
                    <span className="text-eyebrow-cap font-semibold text-shade-50 uppercase tracking-widest">
                      Reference / Notes Field
                    </span>
                    <p className="text-caption text-shade-70">
                      Input your order code in the reference/note field during payment:
                    </p>
                    <span className="font-mono text-heading-xl text-primary font-bold bg-zinc-50 border border-hairline-light py-2 px-3 rounded-lg self-start">
                      #{orderId.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}

              {/* Transaction ID Input (Hidden for standard COD) */}
              {!(paymentMethod === "cod" && !payDeliveryChargeFirst) && (
                <div className="flex flex-col gap-1">
                  <FormLabel htmlFor="transaction-id">Transaction ID (TxID)</FormLabel>
                  <Input
                    id="transaction-id"
                    type="text"
                    placeholder="e.g. 7DF..."
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    error={!!errors.transactionId}
                    className="rounded-[var(--radius)] text-center text-heading-md font-mono py-6 font-bold"
                  />
                  <p className="text-xs text-shade-40 mt-1">
                    Enter the unique transaction code received via SMS/App after successful payment.
                  </p>
                </div>
              )}
            </Card>

            <Button
              type="submit"
              variant="primary"
              disabled={submitting || (paymentMethod === "cod" ? (payDeliveryChargeFirst && !activeMerchantNumber) : !activeMerchantNumber)}
              className="w-full py-4 min-h-12 text-body-strong font-semibold rounded-[var(--radius)]"
            >
              {submitting ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin mr-1.5" />
                  Submitting...
                </>
              ) : (
                paymentMethod === "cod" && !payDeliveryChargeFirst
                  ? "Confirm Order (Cash on Delivery)"
                  : "Confirm Payment & Place Order"
              )}
            </Button>
          </form>
        </div>
      )}

      {/* STEP 3: Success Confirmation */}
      {step === "confirm" && (
        <div className="max-w-md mx-auto text-center py-8">
          <Card variant="default" className="p-8 flex flex-col items-center justify-center gap-6 bg-canvas-light border border-hairline-light">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 animate-scale-up">
              <CheckIcon className="h-8 w-8 stroke-3" />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-heading-xl font-bold text-ink uppercase tracking-tight leading-tight">
                Order Placed Successfully!
              </h2>
              <p className="text-body-md text-shade-50">
                Thank you for shopping with <span className="font-semibold text-ink">{merchantName}</span>.
              </p>
            </div>

            <div className="bg-canvas-cream border border-hairline-light rounded-xl p-4 w-full">
              <div className="text-caption text-shade-50">Order Code</div>
              <div className="font-mono text-heading-xl font-bold text-ink mt-1">
                #{orderId.substring(0, 8).toUpperCase()}
              </div>
              <div className="text-xs text-shade-40 mt-2 truncate font-mono">
                ID: {orderId}
              </div>
            </div>

            <p className="text-caption text-shade-50 leading-relaxed max-w-xs">
              Your payment will be manually verified by the merchant. You will receive an SMS status update shortly.
            </p>

            <div className="flex flex-col gap-3 w-full mt-4">
              <Button
                variant="primary"
                onClick={() => { window.location.replace(`/orders/${orderId}`) }}
                className="w-full font-semibold rounded-[var(--radius)]"
              >
                Track Order & Save History
              </Button>
              <Button
                variant="outline-light"
                onClick={() => { window.location.replace("/") }}
                className="w-full font-medium rounded-[var(--radius)]"
              >
                Continue Shopping
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
