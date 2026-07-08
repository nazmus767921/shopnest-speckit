import React from "react"
import { ProductGridContent } from "@/lib/storefront-sections/types"
import { getNewArrivals, getFeaturedProducts, getExclusiveProducts, getProductsByIds } from "@/lib/products/data"
import { ProductSlider } from "../ProductSlider"

interface DynamicProductGridProps {
  content: ProductGridContent
  merchantId: string
  subdomain: string
}

export async function DynamicProductGrid({ content, merchantId, subdomain }: DynamicProductGridProps) {
  let products: any[] = []
  let promoType = ""

  if (content.gridType === 'new_arrivals') {
    products = await getNewArrivals(merchantId, 8)
    promoType = "new_arrival"
  } else if (content.gridType === 'featured') {
    products = await getFeaturedProducts(merchantId, 8)
    promoType = "featured"
  } else if (content.gridType === 'exclusive') {
    products = await getExclusiveProducts(merchantId, 8)
    promoType = "exclusive"
  } else if (content.gridType === 'manual_selection' && content.productIds) {
    products = await getProductsByIds(merchantId, content.productIds)
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="relative overflow-hidden w-full max-w-10xl mx-auto px-4 md:px-8 mt-24 mb-24">
      <div className="flex flex-col items-center text-center gap-4 mb-16">
        <span className="text-zinc-500 text-xs font-sans font-light uppercase tracking-[0.2em] select-none">
          {content.gridType === 'new_arrivals' ? 'Just Released' : 
           content.gridType === 'featured' ? 'Must Have' : 'Curated For You'}
        </span>
        <h2 className="font-sans text-4xl md:text-5xl font-light tracking-tight text-primary">
          {content.title}
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
