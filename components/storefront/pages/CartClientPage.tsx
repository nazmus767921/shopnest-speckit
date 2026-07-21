"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCartIcon, ArrowLeftIcon, AlertTriangleIcon, TagIcon, ArrowRightIcon } from "@/lib/icons";

import { useCart } from "@/hooks/use-cart"
import { CartItemRow } from "@/components/storefront/primitives/CartItemRow"
import { type CartItem } from "@/lib/cart/cart-store"
import { Card, Button } from "@/components/ui"
import { formatTaka } from "@/lib/utils"
import { validateCartVariantsAction } from "@/app/actions/validate-cart"

interface Props {
  merchantId: string
  merchantName: string
  subdomain: string
}

export function CartClientPage({ merchantId, merchantName, subdomain }: Props) {
  const router = useRouter()
  const { items, updateQuantity, removeItem, subtotalPaisa } = useCart(merchantId)
  const [mounted, setMounted] = useState(false)

  // ── Promo Code & Summary Calculations State ────────────────────────────────
  const [promoInput, setPromoInput] = useState("")
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [promoError, setPromoError] = useState<string | null>(null)

  const handleApplyPromo = useCallback(() => {
    const code = promoInput.trim().toUpperCase()
    if (!code) return

    if (code === "DISCOUNT20" || code === "SHOP20" || code === "20OFF") {
      setAppliedPromoCode(code)
      setDiscountPercent(20)
      setPromoError(null)
    } else {
      setPromoError("Invalid promo code. Try 'DISCOUNT20'.")
    }
  }, [promoInput])

  const discountPaisa = (subtotalPaisa * discountPercent) / 100
  const deliveryPaisa = items.length > 0 ? 1500 : 0 // flat ৳15.00 delivery fee (1500 paisa)
  const totalPaisa = Math.max(0, subtotalPaisa - discountPaisa + deliveryPaisa)

  // ── Deleted variant detection ──────────────────────────────────────────────
  // Track which cart items (by itemKey = variantId ?? productId) reference
  // cascade-deleted variants. Re-validate on mount and when items change.
  const [unavailableKeys, setUnavailableKeys] = useState<Set<string>>(new Set())

  const validateCart = useCallback(async () => {
    const variantIds = items
      .filter((i: CartItem) => i.variantId)
      .map((i: CartItem) => i.variantId as string)

    if (variantIds.length === 0) {
      setUnavailableKeys(new Set())
      return
    }

    try {
      const { deletedVariantIds } = await validateCartVariantsAction(variantIds)
      if (deletedVariantIds.length > 0) {
        setUnavailableKeys(new Set(deletedVariantIds))
      } else {
        setUnavailableKeys(new Set())
      }
    } catch {
      // Validation failure is non-blocking — cart still works
      console.error("Failed to validate cart variants.")
    }
  }, [items])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      validateCart()
    }
  }, [mounted, validateCart])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-pulse text-shade-40">Loading your cart...</div>
      </div>
    )
  }

  // Enrich items with isUnavailable flag from the validation result
  const enrichedItems = items.map((item: CartItem) => {
    const itemKey = item.variantId ?? item.productId
    return unavailableKeys.has(itemKey)
      ? { ...item, isUnavailable: true }
      : item
  })

  const hasUnavailableItems = enrichedItems.some((i: CartItem) => i.isUnavailable)
  const isEmpty = items.length === 0

  return (
    <div className="flex flex-col gap-6 md:gap-8 w-full max-w-7xl mx-auto animate-fade-in">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm font-sans text-shade-40 select-none mb-1">
        <a href="/" className="hover:text-ink transition-colors">Home</a>
        <span>&gt;</span>
        <span className="text-ink font-semibold">Cart</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline-light pb-4">
        <h1 className="text-4xl md:text-5xl font-extrabold font-display uppercase tracking-tighter text-ink leading-none">
          Your Cart
        </h1>
        <a
          href="/"
          className="flex items-center gap-1.5 text-storefront-caption text-shade-60 hover:text-ink transition-colors font-semibold font-sans"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Continue Shopping</span>
        </a>
      </div>

      {isEmpty ? (
        /* Empty State */
        <Card variant="default" className="border border-hairline-light p-12 flex flex-col items-center justify-center text-center gap-6 min-h-64 bg-white max-w-md mx-auto w-full mt-6 rounded-md">
          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-ink border border-hairline-light">
            <ShoppingCartIcon className="h-8 w-8 stroke-[1.5]" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-storefront-heading-md font-bold text-ink font-sans">
              Your Cart is Empty
            </h2>
            <p className="text-storefront-body-md text-shade-50">
              Looks like you haven't added any products to your cart yet.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            className="btn-storefront-primary py-4 px-8 rounded-md"
            onClick={() => { window.location.href = "/" }}
          >
            Browse Products
          </Button>
        </Card>
      ) : (
        /* Cart Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Items List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="border border-hairline-light rounded-[20px] bg-white p-4 md:p-5">
              <div className="flex flex-col divide-y divide-hairline-light">
                {enrichedItems.map((item: CartItem) => (
                  <CartItemRow
                    key={item.variantId ?? item.productId}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="flex flex-col gap-4">
            <div className="border border-hairline-light rounded-[20px] p-4 md:p-5 sticky top-24 bg-white flex flex-col">
              <h2 className="text-xl md:text-2xl font-bold font-sans text-ink mb-6">
                Order Summary
              </h2>

              <div className="flex flex-col gap-4 text-storefront-body-md text-shade-70">
                <div className="flex justify-between items-center text-base font-sans text-shade-60">
                  <span>Subtotal</span>
                  <span className="font-bold text-ink font-sans">
                    {formatTaka(subtotalPaisa)}
                  </span>
                </div>
                
                {discountPercent > 0 && (
                  <div className="flex justify-between items-center text-base font-sans">
                    <span className="text-shade-60">Discount (-{discountPercent}%)</span>
                    <span className="font-bold text-[#FF3333] font-sans">
                      -{formatTaka(discountPaisa)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-base font-sans text-shade-60">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-ink font-sans">
                    {formatTaka(deliveryPaisa)}
                  </span>
                </div>

                <div className="h-px bg-hairline-light my-2" />

                <div className="flex justify-between items-center text-lg md:text-xl font-bold text-ink font-sans">
                  <span>Total</span>
                  <span className="text-xl md:text-2xl font-extrabold text-ink font-sans">
                    {formatTaka(totalPaisa)}
                  </span>
                </div>
              </div>

              {/* Promo Code Input */}
              <div className="mt-6 flex flex-col gap-2">
                <div className="flex gap-3">
                  <div className="flex-1 flex items-center bg-[#F2F0F1] rounded-full px-4 h-12 gap-2 border border-transparent focus-within:border-ink/20">
                    <TagIcon className="h-5 w-5 text-shade-40 shrink-0" />
                    <input
                      type="text"
                      placeholder="Add promo code"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm md:text-base text-ink w-full placeholder:text-shade-40 font-sans"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="btn-storefront-primary px-6 md:px-8 h-12 text-sm md:text-base font-bold rounded-full whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <p className="text-red-500 text-xs mt-1 ml-4 font-sans">{promoError}</p>
                )}
                {appliedPromoCode && (
                  <p className="text-emerald-600 text-xs mt-1 ml-4 font-sans">
                    ✓ Promo code <strong>{appliedPromoCode}</strong> applied (20% off)
                  </p>
                )}
              </div>

              {/* Unavailable items warning */}
              {hasUnavailableItems && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200 mt-4 font-sans" role="alert">
                  <AlertTriangleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">
                    Some items are no longer available.{" "}
                    <strong>Remove them to proceed to checkout.</strong>
                  </p>
                </div>
              )}

              <div className="mt-6">
                <Button
                  variant="primary"
                  size="md"
                  disabled={hasUnavailableItems}
                  onClick={() => { window.location.href = `/checkout?deliveryCharge=${deliveryPaisa}&discount=${discountPaisa}` }}
                  className="w-full bg-primary text-white rounded-full font-bold text-base md:text-lg flex items-center justify-center gap-2 h-14 cursor-pointer hover:bg-zinc-800 transition-colors"
                >
                  <span>Go to Checkout</span>
                  <ArrowRightIcon className="h-5 w-5 stroke-[2.5]" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
