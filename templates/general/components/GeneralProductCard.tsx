"use client"

import React from "react"
import { ProductCard } from "@/components/storefront/ProductCard"
import { type Product } from "../../types"

interface GeneralProductCardProps {
  product: Product
  subdomain: string
  merchantId: string
}

export function GeneralProductCard({ product, subdomain, merchantId }: GeneralProductCardProps) {
  return (
    <ProductCard
      product={product}
      subdomain={subdomain}
      merchantId={merchantId}
      themeClass="storefront-theme-default"
    />
  )
}
