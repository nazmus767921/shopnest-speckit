import React from "react"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getPublishedProductBySlug } from "@/db/queries/products"
import { StorefrontImageGallery } from "@/components/storefront/StorefrontImageGallery"
import { formatTaka } from "@/lib/utils"
import type { Metadata } from "next"
import { AddToCartButton } from "@/components/storefront/AddToCartButton"
import { BuyNowButton } from "@/components/storefront/BuyNowButton"
import { supabase } from "@/lib/supabase/client"
import { ProductMetadata } from "@/components/storefront/product-metadata/ProductMetadata"
import { getMetadataByProductId, getAttributesByProductId, getVariantsByProductId } from "@/db/queries/variants"
import { VariantProductClient } from "./VariantProductClient"

type Props = {
  params: Promise<{ subdomain: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain, slug } = await params
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id") || ""
  const merchantName = headersList.get("x-merchant-name") || "Boutique Store"

  const product = merchantId ? await getPublishedProductBySlug(merchantId, slug) : null

  if (!product) {
    return {
      title: "Product Not Found",
    }
  }

  return {
    title: `${product.name} — ${merchantName}`,
    description: product.description ?? `Shop ${product.name} at ${merchantName}.`,
  }
}

import { Suspense } from "react"

export default function ProductDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailPageContent params={params} />
    </Suspense>
  )
}

async function ProductDetailPageContent({ params }: Props) {
  const { subdomain, slug } = await params
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id") || ""
  const merchantName = headersList.get("x-merchant-name") || "Boutique Store"

  if (!merchantId) {
    notFound()
  }

  const product = await getPublishedProductBySlug(merchantId, slug)

  if (!product) {
    notFound()
  }

  const isOutOfStock = product.stockCount === 0
  const isLowStock = !isOutOfStock && product.stockCount <= product.lowStockThreshold

  // Fetch metadata and variant data when product has variants
  const metadata = product.hasVariants ? await getMetadataByProductId(product.id) : []

  const variantAttributes = product.hasVariants ? await getAttributesByProductId(product.id) : []
  const variants = product.hasVariants ? await getVariantsByProductId(product.id) : []

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
    <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in">
      {/* Breadcrumb / Back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline-light pb-4">
        <nav className="flex items-center gap-2 text-caption text-shade-50">
          <a href="/" className="hover:text-ink transition-colors font-medium">
            Store
          </a>
          <span className="text-shade-30">/</span>
          <span className="text-shade-70 font-normal line-clamp-1">{product.name}</span>
        </nav>

        <a
          href="/"
          className="flex items-center gap-1.5 text-caption text-shade-60 hover:text-ink transition-colors self-start sm:self-auto font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Catalog</span>
        </a>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 pt-4">
        {/* Left Column: Gallery */}
        <div>
          <StorefrontImageGallery images={product.images} productName={product.name} />
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
            <h1 className="font-display text-heading-xl sm:text-display-md font-medium text-ink tracking-tight leading-tight uppercase">
              {product.name}
            </h1>

            {/* Price */}
            <div>
              <span className="font-sans text-display-md font-bold text-ink">
                {formatTaka(product.pricePaisa)}
              </span>
            </div>
          </div>

          <div className="h-px bg-hairline-light w-full my-6" />

          {/* Description */}
          <div className="flex flex-col gap-2 mb-8">
            <h2 className="text-eyebrow-cap font-semibold text-shade-40 uppercase tracking-widest">
              Description
            </h2>
            <p className="text-body-md text-shade-50 font-normal leading-relaxed whitespace-pre-line">
              {product.description || "Boutique exclusive design."}
            </p>
          </div>

          {/* Metadata display */}
          {metadata.length > 0 && (
            <ProductMetadata
              metadata={metadata.map((m) => ({
                key: m.key,
                value: m.value,
                sortOrder: m.sortOrder,
              }))}
            />
          )}

          {/* Actions: Variant selector or AddToCart */}
          <div className="mt-auto flex flex-col gap-4">
            {product.hasVariants && variantAttributes.length > 0 && variants.length > 0 ? (
              <VariantProductClient
                merchantId={merchantId}
                subdomain={subdomain}
                product={cartProduct}
                attributes={variantAttributes.map((a) => ({
                  name: a.name,
                  displayType: a.displayType as "swatch" | "dropdown" | "radio",
                  options: [], // populated client-side via link
                }))}
                variants={variants.map((v) => ({
                  id: v.id,
                  sku: v.sku,
                  pricePaisa: v.pricePaisa,
                  stockCount: v.stockCount,
                  isActive: v.isActive,
                  attributeCombination: {} as Record<string, string>,
                }))}
              />
            ) : (
              <>
                <AddToCartButton
                  merchantId={merchantId}
                  product={cartProduct}
                  size="lg"
                  className="w-full text-body-strong font-medium"
                />
                <BuyNowButton
                  subdomain={subdomain}
                  product={cartProduct}
                  size="lg"
                  className="w-full text-body-strong font-medium"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-pulse">
      <div className="h-8 w-48 bg-shade-30 rounded-full mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 pt-4">
        <div className="bg-canvas-light border border-hairline-light rounded-lg h-96 w-full" />
        <div className="flex flex-col gap-4">
          <div className="h-10 w-64 bg-shade-30 rounded-full" />
          <div className="h-8 w-32 bg-shade-30 rounded-full" />
          <div className="h-32 bg-shade-20 rounded-lg w-full mt-4" />
        </div>
      </div>
    </div>
  )
}

