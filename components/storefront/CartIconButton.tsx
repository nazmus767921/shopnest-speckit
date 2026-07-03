"use client"

import React, { useEffect, useState } from "react"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import Link from "next/link"

interface Props {
  merchantId: string
  subdomain: string
}

export function CartIconButton({ merchantId, subdomain }: Props) {
  const { totalItems } = useCart(merchantId)
  const [mounted, setMounted] = useState(false)

  // Prevent SSR hydration mismatch for local storage state
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="p-2 text-ink relative min-w-9 min-h-9 flex items-center justify-center">
        <ShoppingCart className="h-5 w-5" />
      </div>
    )
  }

  return (
    <Link
      href="/cart"
      className="p-2 text-ink hover:text-shade-70 transition-colors relative flex items-center justify-center min-w-9 min-h-9"
      aria-label="Cart"
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span
          className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-primary text-on-primary text-[10px] font-bold border-2 border-canvas-light"
        >
          {totalItems}
        </span>
      )}
    </Link>
  )
}
