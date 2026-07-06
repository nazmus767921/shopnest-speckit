"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui"
import { ImageIcon } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useCart } from "@/hooks/use-cart"
import { PriceDisplay } from "@/components/storefront/shared/PriceDisplay"
import {
  VariantQuickSelectDialog,
  type DialogProduct,
} from "./VariantQuickSelectDialog"
import type { VariantOption, AttributeInfo } from "./variant-selector/VariantSelector"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProductVariant extends VariantOption {}
export type ProductAttributeInfo = AttributeInfo

interface FormattedProduct {
  id: string
  name: string
  slug: string
  description: string | null
  pricePaisa: number
  compareAtPricePaisa?: number | null
  stockCount: number
  lowStockThreshold: number
  images: { storagePath: string }[]
  category?: { id: string; name: string } | null
  promotions?: { promotionType: string }[]
  /** Variant data for the quick-select dialog */
  variants?: ProductVariant[]
  attributes?: ProductAttributeInfo[]
}

interface ProductCardProps {
  product: FormattedProduct
  subdomain: string
  merchantId: string
  /** Active storefront theme class, forwarded to the dialog portal */
  themeClass?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProductCard({
  product,
  subdomain,
  merchantId,
  themeClass = "storefront-theme-default",
}: ProductCardProps) {
  const isOutOfStock = product.stockCount === 0
  const isLowStock = !isOutOfStock && product.stockCount <= product.lowStockThreshold

  const thumbnailImage = product.images[0]?.storagePath
  const publicUrl = thumbnailImage
    ? supabase.storage.from("product-images").getPublicUrl(thumbnailImage).data.publicUrl
    : null

  // Deterministic rating between 3.5 and 5.0 based on product.id
  const idSum = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const rating = 3.5 + (idSum % 4) * 0.5 // yields 3.5, 4.0, 4.5, 5.0

  // Deterministic discount details or real compareAtPricePaisa
  const hasRealComparePrice = product.compareAtPricePaisa !== undefined && product.compareAtPricePaisa !== null && product.compareAtPricePaisa > product.pricePaisa
  const hasDiscount = hasRealComparePrice || (idSum % 2 === 0)
  const discountPercent = hasRealComparePrice
    ? Math.round(((product.compareAtPricePaisa! - product.pricePaisa) / product.compareAtPricePaisa!) * 100)
    : (hasDiscount ? (idSum % 3 === 0 ? 30 : 20) : 0)
  const originalPricePaisa = hasRealComparePrice
    ? product.compareAtPricePaisa!
    : (hasDiscount ? Math.round(product.pricePaisa / (1 - discountPercent / 100)) : product.pricePaisa)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const { addItem, updateQuantity } = useCart(merchantId)

  const hasVariants = (product.variants?.length ?? 0) > 0

  const dialogProduct: DialogProduct | null = hasVariants
    ? {
        id: product.id,
        name: product.name,
        imageUrl: publicUrl,
        pricePaisa: product.pricePaisa,
        compareAtPricePaisa: product.compareAtPricePaisa,
        stockCount: product.stockCount,
        attributes: product.attributes ?? [],
        variants: product.variants ?? [],
      }
    : null

  const handleAddToCart = async (variantId: string, quantity: number) => {
    const variant = product.variants?.find((v) => v.id === variantId)
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      pricePaisa: variant?.pricePaisa ?? product.pricePaisa,
      stockCount: product.stockCount,
      imageUrl: publicUrl,
      variantId,
      variantLabel: variant
        ? Object.values(variant.attributeCombination).join(" / ")
        : null,
    })
    if (quantity > 1) {
      updateQuantity(product.id, quantity, variantId)
    }
  }

  const handleCartButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return
    if (hasVariants) {
      setDialogOpen(true)
    } else {
      // No variants: add directly with no variantId
      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        pricePaisa: product.pricePaisa,
        stockCount: product.stockCount,
        imageUrl: publicUrl,
        variantId: null,
        variantLabel: null,
      })
    }
  }

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
    <>
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
          <PriceDisplay
            pricePaisa={product.pricePaisa}
            originalPricePaisa={originalPricePaisa}
            discountPercent={discountPercent}
          />

          {/* Cart trigger — opens dialog for variant products, direct add for simple products */}
          <button
            type="button"
            onClick={handleCartButtonClick}
            disabled={isOutOfStock}
            aria-label={
              isOutOfStock
                ? "Out of stock"
                : hasVariants
                  ? `Select options for ${product.name}`
                  : `Add ${product.name} to cart`
            }
            className="w-9 h-9 min-h-0 p-0 rounded-full flex items-center justify-center bg-black hover:bg-zinc-800 text-white transition-all select-none shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 stroke-[1.5]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </Card>

      {/* Variant Quick Select Dialog */}
      {dialogProduct && (
        <VariantQuickSelectDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          product={dialogProduct}
          themeClass={themeClass}
          onAddToCart={handleAddToCart}
        />
      )}
    </>
  )
}
