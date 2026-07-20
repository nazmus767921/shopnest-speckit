"use client"

import React, { useEffect, useState, useCallback } from "react"
import { ShoppingCartIcon, ArrowLeftIcon, AlertTriangleIcon, TagIcon, ArrowRightIcon } from "@/lib/icons";

import { useCart } from "@/hooks/use-cart"
import { EleganceCartItemRow } from "./components/EleganceCartItemRow"
import { type CartItem } from "@/lib/cart/cart-store"
import { Card } from "@/components/ui"
import { formatTaka } from "@/lib/utils"
import { validateCartVariantsAction } from "@/app/actions/validate-cart"
import { Breadcrumbs } from "@/components/storefront/shared/Breadcrumbs"
import { type CartPageProps } from "../types"

export function EleganceCartPage({ store }: CartPageProps) {
  const { items, updateQuantity, removeItem, subtotalPaisa } = useCart(store.id)
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
        <div className="animate-pulse text-[var(--color-shade-40)] font-sans">Loading your cart...</div>
      </div>
    )
  }

  const enrichedItems = items.map((item: CartItem) => {
    const itemKey = item.variantId ?? item.productId
    return unavailableKeys.has(itemKey)
      ? { ...item, isUnavailable: true }
      : item
  })

  const hasUnavailableItems = enrichedItems.some((i: CartItem) => i.isUnavailable)
  const isEmpty = items.length === 0

  return (
    <div className="flex flex-col gap-6 md:gap-8 w-full max-w-10xl mx-auto animate-fade-in px-4 md:px-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cart" }
        ]}
        className="mb-1"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-hairline-warm)] pb-4">
        <h1 className="text-3xl md:text-4xl font-display font-normal text-[var(--color-ink)] leading-none uppercase">
          Your Cart Bag
        </h1>
        <a
          href="/"
          className="flex items-center gap-1.5 text-xs font-sans tracking-wide uppercase text-[var(--color-shade-60)] hover:text-[var(--color-ink)] transition-colors font-semibold"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Continue Shopping</span>
        </a>
      </div>

      {isEmpty ? (
        /* Elegant Minimalist Empty State */
        <div className="border border-[var(--color-hairline-warm)] py-24 px-6 flex flex-col items-center justify-center text-center gap-6 min-h-[350px] bg-[var(--color-surface-product)]/20 max-w-lg mx-auto w-full mt-6 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[var(--color-ink)] border border-[var(--color-hairline-warm)] shrink-0">
            <ShoppingCartIcon className="h-5 w-5 stroke-[1.2] text-zinc-400" />
          </div>
          <div className="flex flex-col gap-3 max-w-sm">
            <h2 className="font-display text-2xl md:text-3xl font-light uppercase tracking-[0.15em] text-[var(--color-ink)]">
              Your Bag is Vacant
            </h2>
            <p className="text-[11px] font-sans text-zinc-400 tracking-wider uppercase leading-relaxed">
              Explore our boutique catalog to find your next signature silhouette.
            </p>
          </div>
          <button
            onClick={() => { window.location.href = "/" }}
            className="mt-2 px-8 py-3.5 bg-black hover:bg-zinc-800 text-white rounded-full font-sans text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer border-none"
          >
            Return to Shop
          </button>
        </div>
      ) : (
        /* Cart Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Items List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="border border-[var(--color-hairline-warm)]/70 rounded-2xl bg-white p-5 md:p-6">
              <div className="flex flex-col divide-y divide-[var(--color-hairline-warm)]/60">
                {enrichedItems.map((item: CartItem) => (
                  <EleganceCartItemRow
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
            <div className="border border-[var(--color-hairline-warm)]/70 rounded-2xl p-6 md:p-8 sticky top-24 bg-[var(--color-surface-product)]/10 flex flex-col">
              <h2 className="text-lg md:text-xl font-display font-normal text-[var(--color-ink)] mb-6 uppercase tracking-wider">
                Order Summary
              </h2>

              <div className="flex flex-col gap-4 text-xs text-zinc-500 font-sans tracking-wide uppercase">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[var(--color-ink)]">
                    {formatTaka(subtotalPaisa)}
                  </span>
                </div>
                
                {discountPercent > 0 && (
                  <div className="flex justify-between items-center text-[var(--color-discount-text)]">
                    <span>Discount (-{discountPercent}%)</span>
                    <span className="font-semibold text-[var(--color-ink)]">
                      -{formatTaka(discountPaisa)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-[var(--color-ink)]">
                    {formatTaka(deliveryPaisa)}
                  </span>
                </div>

                <div className="h-px bg-[var(--color-hairline-warm)]/60 my-2" />

                <div className="flex justify-between items-center text-sm font-semibold text-[var(--color-ink)]">
                  <span>Total</span>
                  <span className="text-base md:text-lg font-bold">
                    {formatTaka(totalPaisa)}
                  </span>
                </div>
              </div>

              {/* Minimalist Inline Promo Code Input */}
              <div className="mt-6 flex flex-col gap-1.5">
                <div className="flex items-center justify-between border-b border-zinc-200 focus-within:border-black py-2.5 gap-4">
                  <input
                    type="text"
                    placeholder="ENTER PROMO CODE"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs text-[var(--color-ink)] w-full placeholder:text-zinc-400 font-sans tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="text-xs font-bold font-sans uppercase tracking-wider text-black hover:text-zinc-650 transition-colors border-none bg-transparent cursor-pointer shrink-0"
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <p className="text-red-500 text-[10px] mt-1 font-sans uppercase tracking-wider">{promoError}</p>
                )}
                {appliedPromoCode && (
                  <p className="text-emerald-600 text-[10px] mt-1 font-sans uppercase tracking-wider font-semibold">
                    ✓ Code {appliedPromoCode} Applied (20% Off)
                  </p>
                )}
              </div>

              {/* Unavailable items warning */}
              {hasUnavailableItems && (
                <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 border border-red-200 mt-6 font-sans" role="alert">
                  <AlertTriangleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 leading-normal">
                    Some items are no longer available.{" "}
                    <strong>Please remove them to checkout.</strong>
                  </p>
                </div>
              )}

              <div className="mt-8">
                <button
                  disabled={hasUnavailableItems}
                  onClick={() => { window.location.href = `/checkout?deliveryCharge=${deliveryPaisa}&discount=${discountPaisa}` }}
                  className="w-full h-14 bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)] rounded-[var(--radius)] font-sans font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border-none disabled:opacity-50 disabled:pointer-events-none transition-opacity cursor-pointer"
                >
                  <span>Go to Checkout</span>
                  <ArrowRightIcon className="h-4 w-4 stroke-[1.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
