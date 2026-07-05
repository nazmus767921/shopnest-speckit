import React from "react"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getPublishedProductBySlug, getPublishedProducts } from "@/db/queries/products"
import { StorefrontImageGallery } from "@/components/storefront/StorefrontImageGallery"
import { formatTaka } from "@/lib/utils"
import type { Metadata } from "next"
import { AddToCartButton } from "@/components/storefront/AddToCartButton"
import { BuyNowButton } from "@/components/storefront/BuyNowButton"
import { supabase } from "@/lib/supabase/client"
import { ProductMetadata } from "@/components/storefront/product-metadata/ProductMetadata"
import { getMetadataByProductId, getAttributesWithOptionsByProductId, getVariantsWithCombinationsByProductId } from "@/db/queries/variants"
import { VariantProductClient } from "./VariantProductClient"
import { ProductCard } from "@/components/storefront/ProductCard"
import { ProductTabs } from "@/components/storefront/ProductTabs"
import { Suspense } from "react"
import { connection } from "next/server"

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

export default function ProductDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailPageContent params={params} />
    </Suspense>
  )
}

async function ProductDetailPageContent({ params }: Props) {
  await connection()
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

  // For variant products, stock is managed per-variant — skip product-level indicators
  const showStockWarnings = !product.hasVariants
  const isOutOfStock = showStockWarnings && product.stockCount === 0
  const isLowStock = showStockWarnings && !isOutOfStock && product.stockCount <= product.lowStockThreshold

  // Fetch metadata and variant data when product has variants
  const metadata = product.hasVariants ? await getMetadataByProductId(product.id) : []

  const variantAttributes = product.hasVariants
    ? await getAttributesWithOptionsByProductId(product.id)
    : []
  const variants = product.hasVariants
    ? await getVariantsWithCombinationsByProductId(product.id)
    : []

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

  // Fetch all published products to get related items
  const allProducts = await getPublishedProducts(merchantId)
  const relatedProducts = allProducts.filter((p) => p.id !== product.id).slice(0, 4)

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in">
      {/* Breadcrumb Hierarchy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline-light pb-4">
        <nav className="flex items-center gap-2 text-storefront-caption text-shade-50">
          <a href="/" className="hover:text-ink transition-colors font-medium">
            Home
          </a>
          <span className="text-shade-30">/</span>
          <a href="/products" className="hover:text-ink transition-colors font-medium">
            Shop
          </a>
          {product.category && (
            <>
              <span className="text-shade-30">/</span>
              <span className="hover:text-ink transition-colors font-medium cursor-pointer">
                {product.category.name}
              </span>
            </>
          )}
          <span className="text-shade-30">/</span>
          <span className="text-shade-70 font-semibold line-clamp-1">{product.name}</span>
        </nav>

        <a
          href="/"
          className="flex items-center gap-1.5 text-storefront-caption text-shade-60 hover:text-ink transition-colors self-start sm:self-auto font-medium"
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
            <h1 className="text-storefront-display-lg font-bold text-ink uppercase tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div>
              <span className="font-sans text-storefront-display-lg font-bold text-ink">
                {formatTaka(product.pricePaisa)}
              </span>
            </div>
          </div>

          <div className="h-px bg-hairline-light w-full my-6" />

          {/* Description */}
          <div className="flex flex-col gap-2 mb-8">
            <h2 className="text-storefront-body-strong font-bold text-shade-40 uppercase tracking-widest">
              Description
            </h2>
            <p className="text-storefront-body-md text-shade-50 font-normal leading-relaxed whitespace-pre-line">
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
                  options: a.options.map((o) => ({
                    label: o.label,
                    value: o.value,
                    swatchColor: o.swatchColor ?? undefined,
                  })),
                }))}
                variants={variants.map((v) => ({
                  id: v.id,
                  sku: v.sku,
                  pricePaisa: v.pricePaisa,
                  stockCount: v.stockCount,
                  isActive: v.isActive,
                  attributeCombination: v.attributeCombination,
                }))}
              />
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <AddToCartButton
                  merchantId={merchantId}
                  product={cartProduct}
                  size="lg"
                  className="w-full btn-storefront-primary py-4 font-bold rounded-md"
                />
                <BuyNowButton
                  subdomain={subdomain}
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
      <ProductTabs description={product.description || ""} faqs={[]} />

      {/* Related Products: You Might Also Like */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 pt-8 border-t border-hairline-light flex flex-col gap-8">
          <h2 className="text-storefront-display-lg font-bold text-center text-ink uppercase tracking-tight">
            You might also like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  ...p,
                  images: p.images.map((img) => ({ storagePath: img.storagePath })),
                }}
                subdomain={subdomain}
                merchantId={merchantId}
              />
            ))}
          </div>
        </div>
      )}
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
