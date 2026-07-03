"use client"

import { useCheckoutStore } from "@/lib/checkout/checkout-store"
import { useRouter } from "next/navigation"

export function useBuyNow(subdomain: string) {
  const setBuyNow = useCheckoutStore((s) => s.setBuyNow)
  const router = useRouter()

  const handleBuyNow = (item: {
    productId: string
    slug: string
    name: string
    pricePaisa: number
    stockCount: number
    imageUrl: string | null
  }) => {
    setBuyNow(item)
    router.push("/checkout")
  }

  return { handleBuyNow }
}
