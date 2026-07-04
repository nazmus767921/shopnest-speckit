"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, ArrowLeft, AlertTriangle } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { CartItemRow } from "./CartItemRow"
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
    <div className="flex flex-col gap-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline-light pb-4">
        <h1 className="font-display text-heading-xl font-light text-ink uppercase tracking-tight">
          Your Cart
        </h1>
        <a
          href="/"
          className="flex items-center gap-1.5 text-caption text-shade-60 hover:text-ink transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Continue Shopping</span>
        </a>
      </div>

      {isEmpty ? (
        /* Empty State */
        <Card variant="default" className="border border-hairline-light p-12 flex flex-col items-center justify-center text-center gap-6 min-h-64 bg-canvas-light max-w-md mx-auto w-full mt-6">
          <div className="w-16 h-16 rounded-full bg-pistachio-10 flex items-center justify-center text-ink border border-hairline-light">
            <ShoppingCart className="h-8 w-8 stroke-[1.5]" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-heading-xl font-medium text-ink">
              Your Cart is Empty
            </h2>
            <p className="text-body-md text-shade-50">
              Looks like you haven't added any products to your cart yet.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            className="rounded-full"
            onClick={() => { window.location.href = "/" }}
          >
            Browse Products
          </Button>
        </Card>
      ) : (
        /* Cart Layout */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Card variant="default" className="p-6">
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
            </Card>
          </div>

          {/* Order Summary */}
          <div className="flex flex-col gap-4">
            <Card variant="default" className="p-6 sticky top-24 bg-canvas-light">
              <h2 className="text-heading-xl font-medium text-ink mb-6 border-b border-hairline-light pb-4">
                Order Summary
              </h2>

              <div className="flex flex-col gap-4 text-body-md text-shade-70">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-semibold text-ink">
                    {formatTaka(subtotalPaisa)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-caption">
                  <span>Delivery fee</span>
                  <span className="text-emerald-700 font-semibold uppercase">Free</span>
                </div>

                <div className="h-px bg-hairline-light my-2" />

                <div className="flex justify-between items-center text-heading-lg font-bold text-ink">
                  <span>Total</span>
                  <span>{formatTaka(subtotalPaisa)}</span>
                </div>
              </div>

              {/* Unavailable items warning */}
              {hasUnavailableItems && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200" role="alert">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-caption text-red-700">
                    Some items are no longer available.{" "}
                    <strong>Remove them to proceed to checkout.</strong>
                  </p>
                </div>
              )}

              <div className="mt-8">
                <Button
                  variant="primary"
                  size="md"
                  disabled={hasUnavailableItems}
                  onClick={() => { window.location.href = "/checkout" }}
                  className="w-full py-3.5 min-h-12 text-body-strong font-medium"
                >
                  Proceed to Checkout
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
