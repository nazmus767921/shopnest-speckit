"use client"

import React from "react"
import { Card } from "@/components/ui"
import { ImageIcon } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { formatTaka } from "@/lib/utils"
import { AddToCartButton } from "./AddToCartButton"
import { BuyNowButton } from "./BuyNowButton"

interface FormattedProduct {
  id: string
  name: string
  slug: string
  description: string | null
  pricePaisa: number
  stockCount: number
  lowStockThreshold: number
  images: { storagePath: string }[]
  category?: { id: string; name: string } | null
  promotions?: { promotionType: string }[]
}

interface ProductCardProps {
  product: FormattedProduct
  subdomain: string
  merchantId: string
}

export function ProductCard({ product, subdomain, merchantId }: ProductCardProps) {
  const isOutOfStock = product.stockCount === 0
  const isLowStock = !isOutOfStock && product.stockCount <= product.lowStockThreshold

  const thumbnailImage = product.images[0]?.storagePath
  const publicUrl = thumbnailImage
    ? supabase.storage.from("product-images").getPublicUrl(thumbnailImage).data.publicUrl
    : null

  const cartProduct = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    pricePaisa: product.pricePaisa,
    stockCount: product.stockCount,
    imageUrl: publicUrl,
  }

  return (
    <Card
      className="flex flex-col border border-hairline-light bg-white overflow-hidden group hover:border-shade-40 transition-all duration-300 p-4 rounded-md relative gap-4"
    >
      <a href={`/product/${product.slug}`} className="flex flex-col gap-4 grow cursor-pointer">
        {/* Image Container with light gray background (#F0EEED) */}
        <div className="aspect-3/4 relative bg-[#F0EEED] rounded-md flex items-center justify-center overflow-hidden border border-hairline-light/30">
          {/* Promotion Badges Overlays */}
          {product.promotions && product.promotions.length > 0 && (
            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-20">
              {product.promotions.map((promo) => {
                const type = promo.promotionType
                if (type === "featured") {
                  return (
                    <span key={type} className="bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider select-none">
                      Featured
                    </span>
                  )
                }
                if (type === "new_arrival") {
                  return (
                    <span key={type} className="bg-zinc-200 text-black text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider select-none border border-hairline-light">
                      New
                    </span>
                  )
                }
                if (type === "exclusive") {
                  return (
                    <span key={type} className="bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider select-none">
                      Exclusive
                    </span>
                  )
                }
                return null
              })}
            </div>
          )}
          {publicUrl ? (
            <img
              src={publicUrl}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                isOutOfStock ? "grayscale-20 opacity-80" : ""
              }`}
            />
          ) : (
            <div className="w-full h-full bg-[#F0EEED] flex items-center justify-center text-shade-40">
              <ImageIcon className="h-8 w-8 stroke-[1.5]" />
            </div>
          )}
 
          {/* Sold Out Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-[#F0EEED]/60 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="text-eyebrow-cap tracking-widest text-ink font-semibold border-2 border-ink px-4 py-2 bg-white rounded-md">
                OUT OF STOCK
              </span>
            </div>
          )}
        </div>
 
        {/* Info & Content - Centered text */}
        <div className="flex flex-col items-center text-center gap-1 grow">
          {/* Low Stock Warning */}
          {isLowStock && (
            <span className="text-[11px] text-amber-700 font-semibold uppercase tracking-wider mb-0.5">
              Only {product.stockCount} Left
            </span>
          )}
 
          {/* Name */}
          <h3 className="text-storefront-body-strong font-bold text-ink line-clamp-1 group-hover:text-shade-70 transition-colors">
            {product.name}
          </h3>
          
          {/* Description */}
          <p className="text-storefront-caption text-shade-40 font-normal line-clamp-1 max-w-full leading-relaxed">
            {product.description || "Boutique exclusive design"}
          </p>
          
          {/* Price */}
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <span className="font-sans text-storefront-body-strong font-bold text-ink">
              {formatTaka(product.pricePaisa)}
            </span>
          </div>
        </div>
      </a>
 
      {/* Footer Action: Single Full-width Add to Cart button & Buy Now */}
      <div className="pt-3 border-t border-hairline-light/60 mt-auto flex flex-col gap-2">
        <AddToCartButton
          merchantId={merchantId}
          product={cartProduct}
          className="w-full btn-storefront-primary py-2.5 text-xs rounded-md"
        />
        <BuyNowButton
          subdomain={subdomain}
          product={cartProduct}
          className="w-full btn-storefront-outline py-2.5 text-xs rounded-md"
        />
      </div>
    </Card>
  )
}

