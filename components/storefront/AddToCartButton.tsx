"use client"

import React, { useState } from "react"
import { ShoppingCart } from "lucide-react"
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
  }
  size?: "sm" | "md" | "lg"
  className?: string
}

export function AddToCartButton({ merchantId, product, size = "sm", className }: Props) {
  const { addItem } = useCart(merchantId)
  const [added, setAdded] = useState(false)

  const isOutOfStock = product.stockCount === 0

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product)
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
    }, 1500)
  }

  return (
    <Button
      variant="primary"
      size={size}
      disabled={isOutOfStock}
      onClick={handleAdd}
      className={className}
    >
      {added ? (
        <span>Added ✓</span>
      ) : (
        <span className="flex items-center gap-1.5 justify-center">
          <span>Add to Cart</span>
          <ShoppingCart className="h-4 w-4 stroke-[1.5]" />
        </span>
      )}
    </Button>
  )
}
