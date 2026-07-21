"use client"
import React, { useEffect, useState } from "react"
import { FeaturedProductsContent } from "@/lib/storefront/schema/sections"
import { fetchFeaturedProducts, fetchProductsByIds } from "@/app/actions/storefront"
import { ProductSlider } from "@/components/storefront/shared/ProductSlider"

interface DynamicProductGridProps {
  content: FeaturedProductsContent
  merchantId: string
  subdomain: string
}

export function DynamicProductGrid({ content, merchantId, subdomain }: DynamicProductGridProps) {
  const [products, setProducts] = useState<any[]>([])
  const [promoType, setPromoType] = useState("")

  useEffect(() => {
    if (content.productIds && content.productIds.length > 0) {
      fetchProductsByIds(merchantId, content.productIds).then(setProducts)
    } else {
      fetchFeaturedProducts(merchantId, 8).then(res => {
        setProducts(res)
        setPromoType("featured")
      })
    }
  }, [merchantId, content.productIds])

  if (products.length === 0) {
    return <div className="h-96 w-full animate-pulse bg-zinc-100" />
  }

  return (
    <div className="relative overflow-hidden w-full max-w-10xl mx-auto px-4 md:px-8 mt-24 mb-24">
      <div className="flex flex-col items-center text-center gap-4 mb-16">
        {content.subheadline && (
          <span className="text-zinc-500 text-xs font-sans font-light uppercase tracking-[0.2em] select-none">
            {content.subheadline}
          </span>
        )}
        <h2 className="font-sans text-4xl md:text-5xl font-light tracking-tight text-primary">
          {content.headline}
        </h2>
      </div>

      <ProductSlider
        products={products as any}
        subdomain={subdomain}
        merchantId={merchantId}
        totalCount={products.length}
        promoType={promoType as any}
        themeClass="storefront-theme-fashion"
      />
    </div>
  )
}
