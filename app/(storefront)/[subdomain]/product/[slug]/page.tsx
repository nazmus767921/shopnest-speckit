import React from "react"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getCachedPublishedProducts } from "@/lib/cache/products"
import { getCachedPublishedProductBySlug } from "@/lib/cache/products"
import { getCachedMerchantById } from "@/lib/cache/merchants"
import { getTemplate } from "@/templates/registry"
import { getAttributesWithOptionsByProductId, getVariantsWithCombinationsByProductId } from "@/db/queries/variants"
import { getCachedStorefrontSections } from "@/lib/cache/storefront"
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

  const product = merchantId ? await getCachedPublishedProductBySlug(merchantId, slug) : null

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
  const template = headersList.get("x-merchant-template") || "general"

  if (!merchantId) {
    notFound()
  }

  const product = await getCachedPublishedProductBySlug(merchantId, slug)

  if (!product) {
    notFound()
  }

  const merchant = await getCachedMerchantById(merchantId)

  // Fetch metadata and variant data
  const variantAttributes = product.hasVariants
    ? await getAttributesWithOptionsByProductId(product.id)
    : []
  const variants = product.hasVariants
    ? await getVariantsWithCombinationsByProductId(product.id)
    : []

  const formattedProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    pricePaisa: product.pricePaisa,
    compareAtPricePaisa: product.compareAtPricePaisa,
    stockCount: product.stockCount,
    lowStockThreshold: product.lowStockThreshold,
    images: product.images.map((img) => ({ storagePath: img.storagePath })),
    category: product.category ? { id: product.category.id, name: pCategoryName(product.category) } : null,
    promotions: product.promotions ? product.promotions.map((pr) => ({ promotionType: pr.promotionType })) : [],
    attributes: variantAttributes.map((attr) => ({
      name: attr.name,
      displayType: attr.displayType as "swatch" | "dropdown" | "radio",
      options: attr.options.map((opt) => ({
        value: opt.value,
        label: opt.label,
        swatchColor: opt.swatchColor ?? undefined,
      })),
    })),
    variants: variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      pricePaisa: v.pricePaisa,
      compareAtPricePaisa: v.compareAtPricePaisa,
      stockCount: v.stockCount,
      isActive: v.isActive,
      attributeCombination: v.attributeCombination,
    })),
  }

  // Fetch related products
  const allProducts = await getCachedPublishedProducts(merchantId)
  const relatedProducts = allProducts.filter((p) => p.id !== product.id).slice(0, 4)

  const formattedRelatedProducts = relatedProducts.map((p) => {
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      pricePaisa: p.pricePaisa,
      compareAtPricePaisa: p.compareAtPricePaisa,
      stockCount: p.stockCount,
      lowStockThreshold: p.lowStockThreshold,
      images: p.images.map((img) => ({ storagePath: img.storagePath })),
      category: p.category ? { id: p.category.id, name: pCategoryName(p.category) } : null,
      promotions: p.promotions ? p.promotions.map((pr) => ({ promotionType: pr.promotionType })) : [],
      attributes: [],
      variants: [],
    }
  })

  const store = {
    id: merchant?.id || "",
    name: merchant?.name || "Boutique Store",
    subdomain: merchant?.subdomain || subdomain,
    template,
  }

  const sections = merchantId ? await getCachedStorefrontSections(merchantId) : []
  const faqSection = sections.find((s: any) => s.sectionKey === "faq")
  const faqs = (faqSection?.content as any)?.questions || []

  const templateModule = getTemplate(template)

  return (
    <templateModule.PDP
      store={store}
      product={formattedProduct}
      relatedProducts={formattedRelatedProducts}
      faqs={faqs}
    />
  )
}

function pCategoryName(cat: any): string {
  if (typeof cat === "string") return cat
  return cat.name || ""
}

function ProductDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-pulse mt-8">
      <div className="h-8 w-48 bg-zinc-200 rounded-full mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 pt-4">
        <div className="bg-zinc-100 rounded-lg h-96 w-full" />
        <div className="flex flex-col gap-4">
          <div className="h-10 w-64 bg-zinc-200 rounded-full" />
          <div className="h-8 w-32 bg-zinc-200 rounded-full" />
          <div className="h-32 bg-zinc-100 rounded-lg w-full mt-4" />
        </div>
      </div>
    </div>
  )
}
