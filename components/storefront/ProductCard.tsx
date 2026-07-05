"use client"

import React from "react"
import { Card } from "@/components/ui"
import { ImageIcon } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { formatTaka } from "@/lib/utils"
import { AddToCartButton } from "./AddToCartButton"

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

  // Deterministic rating between 3.5 and 5.0 based on product.id
  const idSum = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const rating = 3.5 + (idSum % 4) * 0.5 // yields 3.5, 4.0, 4.5, 5.0

  // Deterministic discount details
  const hasDiscount = idSum % 2 === 0
  const discountPercent = hasDiscount ? (idSum % 3 === 0 ? 30 : 20) : 0
  const originalPricePaisa = hasDiscount ? Math.round(product.pricePaisa / (1 - discountPercent / 100)) : product.pricePaisa

  const renderStars = (ratingVal: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      if (ratingVal >= i) {
        stars.push(
          <svg key={i} className="h-4 w-4 text-[var(--color-rating-star)] fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        )
      } else if (ratingVal > i - 1 && ratingVal < i) {
        stars.push(
          <div key={i} className="relative h-4 w-4">
            <svg className="absolute inset-0 h-4 w-4 text-zinc-200 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <svg className="h-4 w-4 text-[var(--color-rating-star)] fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
          </div>
        )
      } else {
        stars.push(
          <svg key={i} className="h-4 w-4 text-zinc-200 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        )
      }
    }
    return stars
  }

  return (
    <Card
      className="flex flex-col bg-white overflow-hidden group transition-all duration-300 relative gap-3 w-full border-none shadow-none"
    >
      <a href={`/product/${product.slug}`} className="flex flex-col gap-3 w-full cursor-pointer">
        {/* Image Container with light gray background (#F0EEED) */}
        <div className="aspect-3/4 relative bg-[#F0EEED] rounded-[var(--radius-md)] flex items-center justify-center overflow-hidden border border-hairline-light/30">
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
              className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${isOutOfStock ? "grayscale-20 opacity-80" : ""
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

        {/* Info & Content - Left-aligned text */}
        <div className="flex px-2 flex-col items-start text-left gap-1 w-full">
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

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1 select-none">
            <div className="flex items-center gap-0.5">
              {renderStars(rating)}
            </div>
            <span className="text-storefront-caption text-shade-40 font-medium font-sans ml-1">
              {rating}/5
            </span>
          </div>
        </div>
      </a>

      {/* Price & Add to Cart button row */}
      <div className="flex px-2 items-center justify-between w-full mt-1 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-sans text-base md:text-lg font-bold text-ink">
            {formatTaka(product.pricePaisa)}
          </span>
          {hasDiscount && (
            <>
              <span className="font-sans text-xs md:text-sm text-shade-50 line-through">
                {formatTaka(originalPricePaisa)}
              </span>
              <span className="bg-[var(--color-discount-bg)] text-[var(--color-discount-text)] text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full select-none">
                -{discountPercent}%
              </span>
            </>
          )}
        </div>

        <AddToCartButton
          merchantId={merchantId}
          product={cartProduct}
          iconOnly={true}
          className="w-9 h-9"
        />
      </div>
    </Card>
  )
}
