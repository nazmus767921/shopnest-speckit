"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, ChevronLeft, Loader2, AlertCircle } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { type CartItem } from "@/lib/cart/cart-store"
import { addressSchema, paymentSchema } from "@/lib/validations/checkout"
import { CheckoutIdentitySection } from "./CheckoutIdentitySection"
import { Card, Button, Input, FormLabel, Combobox } from "@/components/ui"
import { formatTaka } from "@/lib/utils"
import { submitAddress, submitPayment } from "@/app/(storefront)/[subdomain]/checkout/actions"
import { useCheckoutStore } from "@/lib/checkout/checkout-store"

interface Props {
  merchantId: string
  merchantName: string
  subdomain: string
  bkashNumber: string | null
  nagadNumber: string | null
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
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad">("bkash")
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
        <Card variant="default" className="p-8 flex flex-col items-center gap-4 border border-red-200 bg-red-50/10">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-heading-lg font-semibold text-ink">Checkout Unavailable</h2>
          <p className="text-body-md text-shade-50 font-light">
            This store has not configured any shipping zones. Checkout is currently unavailable. Please contact the merchant.
          </p>
          <Link href="/" className="mt-4">
            <Button variant="outline-light">Back to Shop</Button>
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
        setSubmitError(res.error || "An error occurred.")
      } else {
        setOrderId(res.orderId)
        setTotalPaisaState(res.totalPaisa)
        setStep("payment")
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong. Please try again."
      setSubmitError(errorMsg)
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
      transactionId,
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
        setSubmitError(res.error || "Failed to submit payment details.")
      } else {
        setStep("confirm")
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to submit payment details."
      setSubmitError(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const activeMerchantNumber = paymentMethod === "bkash" ? bkashNumber : nagadNumber

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
              {step === "address" ? "1" : <Check className="h-3.5 w-3.5" />}
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
              {step === "confirm" ? <Check className="h-3.5 w-3.5" /> : "2"}
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
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Cart</span>
          </Link>
        )}
      </div>

      {submitError && (
        <div className="text-body-md text-red-600 bg-red-50 p-4 rounded-xl border border-red-200/50">
          {submitError}
        </div>
      )}

      {/* STEP 1: Address and Identity Verification */}
      {step === "address" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <form onSubmit={handleAddressSubmit} className="md:col-span-2 flex flex-col gap-6">
            <Card variant="default" className="p-6 flex flex-col gap-6 !overflow-visible">
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
                        setIsVerified(false) // Re-verify on phone change
                      }}
                      error={!!errors.deliveryPhone}
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
                    className="w-full text-input rounded-md border border-hairline-light bg-canvas-light text-ink p-3 text-body-md focus:border-primary focus:outline-none"
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
              className="w-full py-4 min-h-12 text-body-strong font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Processing Order...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </form>

          {/* Checkout Right Summary Panel */}
          <div className="flex flex-col gap-4">
            <Card variant="default" className="p-6 bg-canvas-light flex flex-col gap-4">
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
            <Card variant="default" className="p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-heading-lg font-semibold text-ink">
                  Manual bKash/Nagad Payment
                </h2>
                <p className="text-caption text-shade-50">
                  Please send the exact order amount manually using your mobile wallet.
                </p>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bkash")}
                  className={`py-3.5 px-6 rounded-xl font-bold flex items-center justify-center border transition-all text-body-strong ${
                    paymentMethod === "bkash"
                      ? "border-pink-600 bg-pink-50/50 text-pink-700 font-bold"
                      : "border-hairline-light bg-canvas-light text-shade-60 hover:border-shade-40"
                  }`}
                >
                  bKash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("nagad")}
                  className={`py-3.5 px-6 rounded-xl font-bold flex items-center justify-center border transition-all text-body-strong ${
                    paymentMethod === "nagad"
                      ? "border-orange-600 bg-orange-50/50 text-orange-700 font-bold"
                      : "border-hairline-light bg-canvas-light text-shade-60 hover:border-shade-40"
                  }`}
                >
                  Nagad
                </button>
              </div>

              {/* Payment Instructions Card */}
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
                    <span className="text-caption text-red-600 font-medium bg-red-50 p-2 rounded border border-red-200">
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

              {/* Transaction ID Input */}
              <div className="flex flex-col gap-1">
                <FormLabel htmlFor="transaction-id">Transaction ID (TxID)</FormLabel>
                <Input
                  id="transaction-id"
                  type="text"
                  placeholder="8XK9L..."
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  error={!!errors.transactionId}
                  className="font-mono uppercase"
                />
                <p className="text-xs text-shade-40 mt-1">
                  Enter the unique transaction code received via SMS/App after successful payment.
                </p>
              </div>
            </Card>

            <Button
              type="submit"
              variant="primary"
              disabled={submitting || !activeMerchantNumber}
              className="w-full py-4 min-h-12 text-body-strong font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Submitting Payment...
                </>
              ) : (
                "Confirm Payment & Place Order"
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
              <Check className="h-8 w-8 stroke-3" />
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
                className="w-full font-semibold"
              >
                Track Order & Save History
              </Button>
              <Button
                variant="outline-light"
                onClick={() => { window.location.replace("/") }}
                className="w-full font-medium"
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
