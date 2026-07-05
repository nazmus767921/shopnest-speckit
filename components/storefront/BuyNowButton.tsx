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
  size?: "sm" | "md" | "lg"
  className?: string
}

export function BuyNowButton({ subdomain, product, quantity = 1, size = "sm", className }: Props) {
  const { handleBuyNow } = useBuyNow(subdomain)
  const isOutOfStock = product.stockCount === 0

  return (
    <Button
      variant="outline-light"
      size={size}
      disabled={isOutOfStock}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        handleBuyNow(product, quantity)
      }}
      className={className}
    >
      Buy Now
    </Button>
  )
}
