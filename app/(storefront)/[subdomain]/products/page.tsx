import React from "react"
import { headers } from "next/headers"
import { getFilteredPublishedProducts } from "@/db/queries/products"
import { getCategories } from "@/db/queries/categories"
import { getMerchantById } from "@/db/queries/merchants"
import { getTemplate } from "@/templates/registry"
import { type Category } from "@/templates/types"
import { Suspense } from "react"
import { connection } from "next/server"

export const instant = false

type Props = {
  params: Promise<{ subdomain: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function ProductsPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsPageContent params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function ProductsPageContent({ params, searchParams }: Props) {
  await connection()
  const { subdomain } = await params
  const sParams = await searchParams
  
  const search = typeof sParams.search === "string" ? sParams.search : null
  const categoryId = typeof sParams.category === "string" ? sParams.category : null
  const price = typeof sParams.price === "string" ? sParams.price : null
  const page = typeof sParams.page === "string" ? parseInt(sParams.page) : 1

  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id") || ""
  const template = headersList.get("x-merchant-template") || "general"

  const merchant = merchantId ? await getMerchantById(merchantId) : null
  const rawCategories = merchantId ? await getCategories(merchantId) : []
  const products = merchantId
    ? await getFilteredPublishedProducts(merchantId, { categoryId, search })
    : []

  const categories: Category[] = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: null,
  }))

  let formattedProducts = products.map((p) => {
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

  // In-memory price range filter
  if (price) {
    formattedProducts = formattedProducts.filter((product) => {
      const priceTaka = product.pricePaisa / 100
      if (price === "under-1000") return priceTaka < 1000
      if (price === "1000-2000") return priceTaka >= 1000 && priceTaka <= 2000
      if (price === "2000-5000") return priceTaka >= 2000 && priceTaka <= 5000
      if (price === "over-5000") return priceTaka > 5000
      return true
    })
  }

  const limit = 6
  const totalCount = formattedProducts.length
  const totalPages = Math.max(1, Math.ceil(totalCount / limit))
  const paginatedProducts = formattedProducts.slice((page - 1) * limit, page * limit)

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

  const activeFilters = {
    categorySlug: categoryId || undefined,
  }

  const pagination = {
    currentPage: page,
    totalPages,
    pageSize: limit,
  }

  const templateModule = getTemplate(template)

  return (
    <templateModule.PLP
      store={store}
      products={paginatedProducts}
      categories={categories}
      activeFilters={activeFilters}
      pagination={pagination}
    />
  )
}

function ProductsPageSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse px-2">
      <div className="flex flex-col gap-2 border-b border-zinc-200 pb-6 mt-4">
        <div className="h-8 w-48 bg-zinc-200 rounded-full" />
        <div className="h-4 w-64 bg-zinc-200 rounded-full" />
      </div>
      <div className="h-16 w-full bg-zinc-200 rounded-md" />
    </div>
  )
}
