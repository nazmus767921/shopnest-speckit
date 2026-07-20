"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { PriceDisplay } from "@/components/storefront/shared/PriceDisplay"
import { type Product } from "@/templates/types"
import { useCart } from "@/hooks/use-cart"
import { VariantQuickSelectDialog, type DialogProduct } from "@/components/storefront/VariantQuickSelectDialog"

interface ProductCardProps {
  product: Product
  subdomain: string
  merchantId: string
  className?: string
  imageAspectRatio?: string
}

export function ProductCard({ product, subdomain, merchantId, className, imageAspectRatio = "aspect-[3/4]" }: ProductCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { addItem, updateQuantity } = useCart(merchantId)
  
  const imageUrl = product.images[0]?.storagePath || null
  const hasDiscount = product.compareAtPricePaisa !== null && product.compareAtPricePaisa > product.pricePaisa

  const colorAttr = product.attributes?.find(
    (attr) => attr.name.toLowerCase() === "color" || attr.name.toLowerCase() === "colour"
  )
  const swatches = colorAttr?.options?.slice(0, 4) || []

  const hasVariants = (product.variants?.length ?? 0) > 0
  const isOutOfStock = product.stockCount !== null && product.stockCount <= 0

  const dialogProduct: DialogProduct | null = hasVariants
    ? {
        id: product.id,
        name: product.name,
        imageUrl: imageUrl,
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
      imageUrl: imageUrl,
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
      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        pricePaisa: product.pricePaisa,
        stockCount: product.stockCount,
        imageUrl: imageUrl,
        variantId: null,
        variantLabel: null,
      })
    }
  }

  return (
    <div className={`group flex flex-col gap-3.5 select-none text-left ${className || ""}`}>
      <Link
        href={`/product/${product.slug}`}
        className={`relative ${imageAspectRatio} w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-hairline-warm)] bg-[var(--color-surface-product)] block`}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 350px"
            className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--color-shade-40)] font-sans text-xs">
            No Image
          </div>
        )}
        
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-[var(--color-discount-bg)] text-[var(--color-discount-text)] font-sans text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-[var(--radius-pill)] border border-[var(--color-discount-text)]/10 z-10 shadow-sm">
            Sale
          </span>
        )}
      </Link>

      <div className="flex flex-col gap-1.5 px-0.5">
        {product.category && (
          <span className="text-[10px] font-semibold tracking-wider text-[var(--color-shade-50)] uppercase font-sans">
            {product.category.name}
          </span>
        )}

        <Link href={`/product/${product.slug}`}>
          <h3 className="font-display text-lg md:text-xl font-normal text-[var(--color-ink)] hover:underline leading-tight truncate">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg
                  key={i}
                  className="h-3.5 w-3.5 fill-[var(--color-rating-star)] text-[var(--color-rating-star)]"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-[11px] text-[var(--color-shade-50)] font-sans">(4.8)</span>
          </div>

          {swatches.length > 0 && (
            <div className="flex items-center gap-1">
              {swatches.map((opt) => (
                <span
                  key={opt.value}
                  title={opt.label}
                  className="h-3 w-3 rounded-full border border-[var(--color-hairline-warm)] shrink-0"
                  style={{ backgroundColor: opt.swatchColor || "#cccccc" }}
                  aria-label={`Available in color: ${opt.label}`}
                  role="img"
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 mt-2 border-t border-[var(--color-hairline-warm)]/40 pt-3">
          <PriceDisplay
            pricePaisa={product.pricePaisa}
            originalPricePaisa={product.compareAtPricePaisa}
            size="sm"
          />

          <button
            type="button"
            onClick={handleCartButtonClick}
            disabled={isOutOfStock}
            className="h-8 px-4 rounded-full bg-[var(--color-ink)] hover:bg-[var(--color-shade-80)] text-[var(--color-surface)] font-sans text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed shrink-0 border-none"
            aria-label={
              isOutOfStock
                ? "Out of stock"
                : hasVariants
                  ? `Select options for ${product.name}`
                  : `Add ${product.name} to cart`
            }
          >
            {isOutOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>

      {dialogProduct && (
        <VariantQuickSelectDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          product={dialogProduct}
          themeClass="storefront-template-elegance"
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  )
}
