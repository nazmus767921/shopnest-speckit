"use client"

import React from "react"
import { useBuyNow } from "@/hooks/use-buy-now"
import { Button } from "@/components/ui"

interface Props {
  subdomain: string
  product: {
    productId: string
    slug: string
    name: string
    pricePaisa: number
    stockCount: number
    imageUrl: string | null
    variantId?: string
    variantLabel?: string
  }
  quantity?: number
  size?: "default" | "sm" | "lg"
  className?: string
}

export function BuyNowButton({ subdomain, product, quantity = 1, size = "sm", className }: Props) {
  const { handleBuyNow } = useBuyNow(subdomain)
  const isOutOfStock = product.stockCount === 0

  return (
    <Button
      variant="outline"
      size={size}
      disabled={isOutOfStock}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        handleBuyNow(product, quantity)
      }}
      className={`border-[var(--color-ink)] text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-on-primary)] rounded-[var(--radius-pill)] transition-all ${className || ""}`}
    >
      Buy Now
    </Button>
  )
}
