"use client"

import React from "react"
import { ArrowLeftIcon } from "@/lib/icons";

import Link from "next/link"
import { ImageGallery } from "@/components/storefront/shared/ImageGallery"
import { PriceDisplay } from "@/components/storefront/shared/PriceDisplay"
import { Breadcrumbs } from "@/components/storefront/shared/Breadcrumbs"
import { AddToCartButton } from "@/components/storefront/shared/AddToCartButton"
import { BuyNowButton } from "@/components/storefront/shared/BuyNowButton"
import { ProductGrid } from "@/components/storefront/shared/ProductGrid"
import { ProductTabs } from "@/components/storefront/ProductTabs"
import { FashionVariantProductClient } from "./components/FashionVariantProductClient"
import { FashionProductCard } from "./components/FashionProductCard"
import { type PDPProps } from "../types"

export function FashionPDP({ store, product, relatedProducts, faqs }: PDPProps) {
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
    <div className="w-full max-w-10xl mx-auto flex flex-col gap-6 md:gap-10 animate-fade-in px-4 md:px-8">
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
          className="flex items-center gap-1.5 text-xs font-sans tracking-wider uppercase text-[var(--color-shade-50)] hover:text-[var(--color-ink)] transition-colors self-start sm:self-auto font-semibold"
          prefetch={false}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* 5/7 (12-column) Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 pt-4 items-start">
        {/* Gallery column (5/12 columns) */}
        <div className="lg:col-span-5 w-full">
          <ImageGallery
            images={product.images}
            productName={product.name}
            aspectRatioClassName="aspect-[3/4]"
            thumbnailLayout="bottom"
          />
        </div>

        {/* Details column (7/12 columns) */}
        <div className="lg:col-span-7 flex flex-col justify-start">
          <div className="flex flex-col gap-5">
            {/* Status indicators */}
            {isLowStock && (
              <span className="self-start text-[10px] text-amber-700 font-bold uppercase tracking-[1.5px] bg-amber-50 border border-amber-200/40 px-3.5 py-1 rounded-[var(--radius-pill)]">
                Only {product.stockCount} Left
              </span>
            )}
            {isOutOfStock && (
              <span className="self-start text-[10px] text-zinc-600 font-bold uppercase tracking-[1.5px] bg-zinc-100 border border-zinc-200 px-3.5 py-1 rounded-[var(--radius-pill)]">
                Out of Stock
              </span>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-display font-normal text-[var(--color-ink)] leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-0.5 select-none">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="h-4 w-4 fill-[var(--color-rating-star)] text-[var(--color-rating-star)]" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs font-sans text-[var(--color-shade-50)]">
                (4.9 Rating)
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

          <div className="h-px bg-[var(--color-hairline-warm)] w-full my-6" />

          {/* Description */}
          <div className="flex flex-col gap-2.5 mb-8">
            <span className="text-xs font-semibold font-sans text-[var(--color-shade-50)] uppercase tracking-[1.5px]">
              Editor's Note
            </span>
            <p className="text-sm font-light text-[var(--color-shade-50)] leading-relaxed whitespace-pre-line font-sans">
              {product.description || "Boutique exclusive design. Handcrafted using premium natural fibres and finished with meticulous detail."}
            </p>
          </div>

          {/* Actions: Variant selector or AddToCart */}
          <div className="mt-auto flex flex-col gap-4">
            {hasVariants ? (
              <FashionVariantProductClient
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
                  className="w-full btn-storefront-primary py-4 font-sans font-medium uppercase tracking-wider text-xs rounded-full border-none"
                />
                <BuyNowButton
                  subdomain={store.subdomain}
                  product={cartProduct}
                  size="lg"
                  className="w-full btn-storefront-outline py-4 font-sans font-medium uppercase tracking-wider text-xs rounded-full"
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
        faqs={faqs || []}
      />

      {/* Related Products: Complete the Look */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 pt-10 border-t border-[var(--color-hairline-warm)] flex flex-col gap-10">
          <div className="flex flex-col gap-1.5 text-center">
            <span className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--color-shade-50)] font-sans">
              Complete the Look
            </span>
            <h2 className="font-display text-3xl font-normal text-[var(--color-ink)] uppercase">
              You might also love
            </h2>
          </div>
          
          <ProductGrid
            products={relatedProducts}
            columns={{ mobile: 2, sm: 2, md: 4, lg: 4 }}
            renderCard={(p) => (
              <FashionProductCard
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
