import React from "react"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { ArrowLeft, ChevronRightIcon } from "lucide-react"
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
import Link from "next/link"

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

  // Fetch metadata and variant data
  const metadata = await getMetadataByProductId(product.id)

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
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 md:gap-8 animate-fade-in">
      {/* Breadcrumb Hierarchy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <nav className="flex items-center gap-2 font-sans tracking-tighter text-base text-shade-40">
          <Link prefetch={false} href="/" className="hover:text-ink transition-colors">
            Home
          </Link>
          <ChevronRightIcon className="h-4 w-4" />
          <Link prefetch={false} href="/products" className="hover:text-ink transition-colors">
            Shop
          </Link>
          {product.category && (
            <>
              <ChevronRightIcon className="h-4 w-4" />
              <span className="hover:text-ink transition-colors cursor-pointer">
                {product.category.name}
              </span>
            </>
          )}
          <ChevronRightIcon className="h-4 w-4" />
          <span className="text-ink font-semibold line-clamp-1">{product.name}</span>
        </nav>

        <Link
          href="/"
          className="flex items-center gap-1.5 text-base tracking-tighter font-sans text-shade-60 hover:text-ink transition-colors self-start sm:self-auto font-semibold"
          prefetch={false}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pt-4 items-start">
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
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-display uppercase tracking-tighter text-ink leading-none">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-1 select-none">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <svg key={i} className="h-5 w-5 fill-[#FFC633] text-[#FFC633]" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <svg className="h-5 w-5 text-[#FFC633]" viewBox="0 0 20 20" fill="currentColor">
                  <defs>
                    <linearGradient id="half-star">
                      <stop offset="50%" stopColor="#FFC633" />
                      <stop offset="50%" stopColor="#E5E7EB" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <path fill="url(#half-star)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <span className="text-sm font-sans text-shade-60">
                <span className="text-ink font-semibold">4.5</span>/5
              </span>
            </div>

            {/* Price */}
            {!product.hasVariants && (
              <div className="flex items-center gap-3 mt-2">
                <span className="font-sans text-2xl md:text-3xl font-extrabold text-ink">
                  {formatTaka(product.pricePaisa)}
                </span>
                <span className="font-sans text-lg md:text-xl font-bold text-shade-40 line-through">
                  {formatTaka(Math.round(product.pricePaisa * 1.3))}
                </span>
                <span className="bg-[#FF33331A] text-[#FF3333] px-3 py-0.5 rounded-full text-xs md:text-sm font-bold font-sans">
                  -23%
                </span>
              </div>
            )}
          </div>

          <div className="h-px bg-hairline-light w-full my-6" />

          {/* Description */}
          <div className="flex flex-col gap-2 mb-8">
            <h2 className="text-sm font-bold font-sans text-shade-40 uppercase tracking-widest">
              Description
            </h2>
            <p className="text-sm md:text-base font-normal text-shade-50 leading-relaxed whitespace-pre-line font-sans">
              {product.description || "Boutique exclusive design."}
            </p>
          </div>

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
      <ProductTabs
        description={product.description || ""}
        metadata={metadata.map((m) => ({
          key: m.key,
          value: m.value,
        }))}
        faqs={[]}
      />

      {/* Related Products: You Might Also Like */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 pt-8 border-t border-hairline-light flex flex-col gap-8">
          <h2 className="text-storefront-display-lg font-bold text-center text-ink uppercase tracking-tight">
            You might also like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => {
              // Exclude raw DB variant shape — related cards link to PDP
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { variants: _v, attributes: _a, ...rest } = p
              return (
                <ProductCard
                  key={p.id}
                  product={{
                    ...rest,
                    images: p.images.map((img) => ({ storagePath: img.storagePath })),
                  }}
                  subdomain={subdomain}
                  merchantId={merchantId}
                />
              )
            })}
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
