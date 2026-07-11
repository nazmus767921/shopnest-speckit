"use client"

import React, { useState } from "react"
import { ShoppingCartIcon, CheckIcon } from "@/lib/icons";

import { useCart } from "@/hooks/use-cart"
import { Button } from "@/components/ui"

interface Props {
  merchantId: string
  product: {
    productId: string
    slug: string
    name: string
    pricePaisa: number
    stockCount: number
    imageUrl: string | null
    variantId?: string | null
    variantLabel?: string | null
  }
  quantity?: number
  size?: "sm" | "md" | "lg"
  className?: string
  iconOnly?: boolean
  disabled?: boolean
}

export function AddToCartButton({ merchantId, product, quantity = 1, size = "sm", className, iconOnly = false, disabled }: Props) {
  const { addItem, updateQuantity } = useCart(merchantId)
  const [added, setAdded] = useState(false)

  const isOutOfStock = product.stockCount === 0 || disabled

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    if (quantity > 1) {
      updateQuantity(product.productId, quantity, product.variantId)
    }
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
    }, 1500)
  }

  if (iconOnly) {
    return (
      <Button
        variant="primary"
        disabled={isOutOfStock}
        onClick={handleAdd}
        className={`w-10 h-10 min-h-0 p-0 rounded-[var(--radius-pill)] flex items-center justify-center bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-on-primary)] transition-all select-none shrink-0 ${className || ""}`}
      >
        {added ? (
          <CheckIcon className="h-5 w-5 stroke-[2.5]" />
        ) : (
          <ShoppingCartIcon className="h-5 w-5 stroke-[1.5]" />
        )}
      </Button>
    )
  }

  return (
    <Button
      variant="primary"
      size={size}
      disabled={isOutOfStock}
      onClick={handleAdd}
      className={`bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-90 rounded-[var(--radius-pill)] ${className || ""}`}
    >
      {added ? (
        <span>Added ✓</span>
      ) : (
        <span className="flex items-center gap-1.5 justify-center">
          <span>Add to Cart</span>
          <ShoppingCartIcon className="h-4 w-4 stroke-[1.5]" />
        </span>
      )}
    </Button>
  )
}
