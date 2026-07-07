import React from "react"
import { headers } from "next/headers"
import { getPublishedProducts } from "@/db/queries/products"
import { getMerchantById } from "@/db/queries/merchants"
import { getTemplate } from "@/templates/registry"
import { type CategoryWithProducts } from "@/templates/types"
import { getStorefrontSections } from "@/db/queries/storefront-sections"
import { defaultStorefrontSections } from "@/lib/storefront-sections/defaults"
import { Suspense } from "react"
import { connection } from "next/server"

export const instant = false

type Props = {
  params: Promise<{ subdomain: string }>
}

export default function StorefrontPage({ params }: Props) {
  return (
    <Suspense fallback={<StorefrontPageSkeleton />}>
      <StorefrontPageContent params={params} />
    </Suspense>
  )
}

async function StorefrontPageContent({ params }: Props) {
  await connection()
  const { subdomain } = await params
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id") || ""
  const template = headersList.get("x-merchant-template") || "general"

  const merchant = merchantId ? await getMerchantById(merchantId) : null
  const products = merchantId ? await getPublishedProducts(merchantId) : []

  const formattedProducts = products.map((p) => {
    const attrNameById: Record<string, string> = {}
    for (const attr of p.attributes ?? []) {
      for (const opt of attr.options ?? []) {
        attrNameById[opt.id] = attr.name
      }
    }

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
      category: p.category ? { id: p.category.id, name: p.category.name } : null,
      promotions: p.promotions.map((pr) => ({ promotionType: pr.promotionType })),
      attributes: (p.attributes ?? []).map((attr) => ({
        name: attr.name,
        displayType: attr.displayType as "swatch" | "dropdown" | "radio",
        options: (attr.options ?? []).map((opt) => ({
          value: opt.value,
          label: opt.label,
          swatchColor: opt.swatchColor ?? undefined,
        })),
      })),
      variants: (p.variants ?? []).map((v) => ({
        id: v.id,
        sku: v.sku,
        pricePaisa: v.pricePaisa,
        compareAtPricePaisa: v.compareAtPricePaisa,
        stockCount: v.stockCount,
        isActive: v.isActive,
        attributeCombination: Object.fromEntries(
          (v.attributeLinks ?? []).map((link) => [
            attrNameById[link.attributeOptionId] ?? "",
            link.attributeOption.value,
          ])
        ),
      })),
    }
  })

  const featuredProducts = formattedProducts.filter((p) =>
    p.promotions?.some((pr) => pr.promotionType === "featured")
  ).slice(0, 5)

  const newArrivalProducts = formattedProducts.filter((p) =>
    p.promotions?.some((pr) => pr.promotionType === "new_arrival")
  ).slice(0, 5)

  // Construct CategoryWithProducts array from products
  const categoriesMap = new Map<string, CategoryWithProducts>()
  for (const product of formattedProducts) {
    if (product.category) {
      const cat = product.category
      if (!categoriesMap.has(cat.id)) {
        categoriesMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          slug: cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: null,
          products: []
        })
      }
      categoriesMap.get(cat.id)!.products.push(product)
    }
  }
  const categories = Array.from(categoriesMap.values())

  const store = {
    id: merchant?.id || "",
    name: merchant?.name || "Boutique Store",
    subdomain: merchant?.subdomain || subdomain,
    template,
    heroImageUrl: merchant?.heroImageUrl || null,
    subtitle: merchant?.subtitle || null,
    description: merchant?.storeDescription || null,
    address: merchant?.storeAddress || null,
    socialLinks: merchant?.socialLinks || null,
    customFaqs: merchant?.customFaqs || null,
  }

  let sections = merchantId ? await getStorefrontSections(merchantId) : []
  if (!sections || sections.length === 0) {
    sections = defaultStorefrontSections as any
  }

  const templateModule = getTemplate(template)

  return (
    <templateModule.HomePage
      store={store}
      featuredProducts={featuredProducts}
      newArrivals={newArrivalProducts}
      categories={categories}
      sections={sections as any}
    />
  )
}

function StorefrontPageSkeleton() {
  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto animate-pulse px-4 sm:px-6 lg:px-8">
      <div className="relative aspect-[3/1] w-full rounded-3xl bg-zinc-200 mt-4" />
      <div className="flex flex-col gap-6 w-full">
        <div className="h-6 w-48 bg-zinc-200 rounded-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-64 bg-zinc-200 rounded-2xl" />
          <div className="h-64 bg-zinc-200 rounded-2xl" />
          <div className="h-64 bg-zinc-200 rounded-2xl" />
          <div className="h-64 bg-zinc-200 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
