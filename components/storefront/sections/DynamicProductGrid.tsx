/** @deprecated Replaced by template-specific components in the elegance template. */
import React from "react"
import { FeaturedProductsContent } from "@/lib/storefront/schema/sections"
import { getNewArrivals, getFeaturedProducts, getExclusiveProducts, getProductsByIds } from "@/lib/products/data"
import { ProductSlider } from "@/components/storefront/shared/ProductSlider"

interface DynamicProductGridProps {
  content: FeaturedProductsContent
  merchantId: string
  subdomain: string
}

export async function DynamicProductGrid({ content, merchantId, subdomain }: DynamicProductGridProps) {
  let products: any[] = []
  let promoType = ""

  if (content.productIds && content.productIds.length > 0) {
    products = await getProductsByIds(merchantId, content.productIds)
  } else {
    products = await getFeaturedProducts(merchantId, 8)
    promoType = "featured"
  }

  if (products.length === 0) {
    return null
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
