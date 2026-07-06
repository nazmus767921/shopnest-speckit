"use client"

import React from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ImageGallery } from "@/components/storefront/shared/ImageGallery"
import { PriceDisplay } from "@/components/storefront/shared/PriceDisplay"
import { Breadcrumbs } from "@/components/storefront/shared/Breadcrumbs"
import { AddToCartButton } from "@/components/storefront/shared/AddToCartButton"
import { BuyNowButton } from "@/components/storefront/shared/BuyNowButton"
import { ProductGrid } from "@/components/storefront/shared/ProductGrid"
import { ProductCard } from "@/components/storefront/ProductCard"
import { ProductTabs } from "@/components/storefront/ProductTabs"
import { VariantProductClient } from "@/app/(storefront)/[subdomain]/product/[slug]/VariantProductClient"
import { type PDPProps } from "../types"

export function GeneralPDP({ store, product, relatedProducts }: PDPProps) {
  const isOutOfStock = product.stockCount === 0
  const isLowStock = !isOutOfStock && product.stockCount <= product.lowStockThreshold
  const hasVariants = product.variants && product.variants.length > 0

  const cartProduct = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    pricePaisa: product.pricePaisa,
    compareAtPricePaisa: product.compareAtPricePaisa,
    stockCount: product.stockCount,
    imageUrl: product.images[0]?.storagePath || null,
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 md:gap-8 animate-fade-in">
      {/* Breadcrumb Hierarchy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/products" },
            ...(product.category ? [{ label: product.category.name }] : []),
            { label: product.name }
          ]}
        />

        <Link
          href="/"
          className="flex items-center gap-1.5 text-base tracking-tighter font-sans text-[var(--color-shade-60)] hover:text-[var(--color-ink)] transition-colors self-start sm:self-auto font-semibold"
          prefetch={false}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pt-4 items-start">
        {/* Left Column: Gallery */}
        <div className="w-full">
          <ImageGallery
            images={product.images}
            productName={product.name}
            aspectRatioClassName="aspect-square"
            thumbnailLayout="left"
          />
        </div>

        {/* Right Column: Info */}
        <div className="flex flex-col justify-start">
          <div className="flex flex-col gap-4">
            {/* Status indicators */}
            {isLowStock && (
              <span className="self-start text-[11px] text-amber-700 font-semibold uppercase tracking-wider bg-amber-50 border border-amber-200/40 px-3 py-1 rounded-full">
                Only {product.stockCount} Left
              </span>
            )}
            {isOutOfStock && (
              <span className="self-start text-[11px] text-zinc-600 font-semibold uppercase tracking-wider bg-zinc-100 border border-zinc-200 px-3 py-1 rounded-full">
                Out of Stock
              </span>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-display uppercase tracking-tighter text-[var(--color-ink)] leading-none">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-1 select-none">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <svg key={i} className="h-5 w-5 fill-[var(--color-rating-star)] text-[var(--color-rating-star)]" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <svg className="h-5 w-5 text-[var(--color-rating-star)]" viewBox="0 0 20 20" fill="currentColor">
                  <defs>
                    <linearGradient id="half-star">
                      <stop offset="50%" stopColor="var(--color-rating-star)" />
                      <stop offset="50%" stopColor="#E5E7EB" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <path fill="url(#half-star)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <span className="text-sm font-sans text-[var(--color-shade-60)]">
                <span className="text-[var(--color-ink)] font-semibold">4.5</span>/5
              </span>
            </div>

            {/* Price */}
            {!hasVariants && (
              <PriceDisplay
                pricePaisa={product.pricePaisa}
                originalPricePaisa={product.compareAtPricePaisa}
                size="lg"
              />
            )}
          </div>

          <div className="h-px bg-[var(--color-hairline-light)] w-full my-6" />

          {/* Description */}
          <div className="flex flex-col gap-2 mb-8">
            <h2 className="text-sm font-bold font-sans text-[var(--color-shade-40)] uppercase tracking-widest">
              Description
            </h2>
            <p className="text-sm md:text-base font-normal text-[var(--color-shade-50)] leading-relaxed whitespace-pre-line font-sans">
              {product.description || "Boutique exclusive design."}
            </p>
          </div>

          {/* Actions: Variant selector or AddToCart */}
          <div className="mt-auto flex flex-col gap-4">
            {hasVariants ? (
              <VariantProductClient
                merchantId={store.id}
                subdomain={store.subdomain}
                product={cartProduct}
                attributes={product.attributes}
                variants={product.variants}
              />
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <AddToCartButton
                  merchantId={store.id}
                  product={cartProduct}
                  size="lg"
                  className="w-full btn-storefront-primary py-4 font-bold rounded-md"
                />
                <BuyNowButton
                  subdomain={store.subdomain}
                  product={cartProduct}
                  size="lg"
                  className="w-full btn-storefront-outline py-4 font-bold rounded-md"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation (Details, reviews, faqs) */}
      <ProductTabs
        description={product.description || ""}
        metadata={[]}
        faqs={store.customFaqs || []}
      />

      {/* Related Products: You Might Also Like */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 pt-8 border-t border-[var(--color-hairline-light)] flex flex-col gap-8">
          <h2 className="text-storefront-display-lg font-bold text-center text-[var(--color-ink)] uppercase tracking-tight">
            You might also like
          </h2>
          <ProductGrid
            products={relatedProducts}
            columns={{ mobile: 2, sm: 2, md: 4, lg: 4 }}
            renderCard={(p) => (
              <ProductCard
                key={p.id}
                product={p}
                subdomain={store.subdomain}
                merchantId={store.id}
              />
            )}
          />
        </div>
      )}
    </div>
  )
}
