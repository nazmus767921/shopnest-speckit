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
  }
  size?: "sm" | "md" | "lg"
  className?: string
}

export function BuyNowButton({ subdomain, product, size = "sm", className }: Props) {
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
        handleBuyNow(product)
      }}
      className={className}
    >
      Buy Now
    </Button>
  )
}
