"use client"

import React, { useState } from "react"
import { ShoppingCart, Check } from "lucide-react"
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
}

export function AddToCartButton({ merchantId, product, quantity = 1, size = "sm", className, iconOnly = false }: Props) {
  const { addItem, updateQuantity } = useCart(merchantId)
  const [added, setAdded] = useState(false)

  const isOutOfStock = product.stockCount === 0

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
        className={`w-10 h-10 min-h-0 p-0 rounded-full flex items-center justify-center bg-black hover:bg-zinc-800 text-white transition-all select-none shrink-0 ${className || ""}`}
      >
        {added ? (
          <Check className="h-5 w-5 stroke-[2.5]" />
        ) : (
          <ShoppingCart className="h-5 w-5 stroke-[1.5]" />
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

