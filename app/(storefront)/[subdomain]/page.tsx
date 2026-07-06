import React from "react"
import { headers } from "next/headers"
import { Card } from "@/components/ui"
import { PackageOpen, Sparkles, Flame } from "lucide-react"
import { getPublishedProducts } from "@/db/queries/products"
import { getMerchantById } from "@/db/queries/merchants"
import { ProductSlider } from "@/components/storefront/ProductSlider"
import Image from "next/image"
import Link from "next/link"

import { Suspense } from "react"

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
  const { subdomain } = await params
  const headersList = await headers()
  const merchantName = headersList.get("x-merchant-name") || "Boutique Store"
  const merchantId = headersList.get("x-merchant-id") || ""

  // Fetch full merchant record
  const merchant = merchantId ? await getMerchantById(merchantId) : null

  // Fetch published products
  const products = merchantId ? await getPublishedProducts(merchantId) : []

  // Parse custom FAQs
  const parsedFaqs: Array<{ question: string; answer: string }> = merchant?.customFaqs || []
  const template = merchant?.template || "general"
  const themeClass = `storefront-theme-${template === "general" ? "default" : template}`

  // Map database structures to matching types
  const formattedProducts = products.map((p) => {
    // Build a lookup: attributeOption.id → attribute name
    // so we can resolve attributeCombination keys without an extra join.
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
      // ── Variant data for VariantQuickSelectDialog ──────────────────────────
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


  // Extract promotion collections (limit 5 per slider)
  const featuredProductsTotal = formattedProducts.filter((p) => p.promotions?.some((pr) => pr.promotionType === "featured"))
  const featuredProducts = featuredProductsTotal.slice(0, 5)

  const newArrivalProductsTotal = formattedProducts.filter((p) => p.promotions?.some((pr) => pr.promotionType === "new_arrival"))
  const newArrivalProducts = newArrivalProductsTotal.slice(0, 5)

  const hasPromotions = featuredProducts.length > 0 || newArrivalProducts.length > 0

  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto animate-fade-in px-4 sm:px-6 lg:px-8">
      {/* Hero Banner Section */}
      {merchant?.heroImageUrl ? (
        <div className="relative aspect-[3/1] w-full rounded-3xl overflow-hidden mt-4 border border-hairline-light bg-canvas-cream/20">
          <Image
            src={merchant.heroImageUrl}
            alt={merchantName}
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-10">
            <h1 className="font-display text-heading-xl sm:text-display-xl font-light text-white uppercase tracking-tight leading-none">
              {merchantName}
            </h1>
            {merchant.subtitle && (
              <p className="text-body-md sm:text-body-lg text-white/90 font-light mt-2 max-w-xl">
                {merchant.subtitle}
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Editorial Header Fallback */
        <div className="flex flex-col gap-2 border-b border-hairline-light pb-6 mt-4">
          <h1 className="font-display text-display-xl font-light text-ink tracking-tight leading-none uppercase">
            {merchantName}
          </h1>
          <p className="text-body-lg text-shade-50 font-light max-w-xl">
            {merchant?.subtitle ?? "Browse our boutique clothing collections and order directly online."}
          </p>
        </div>
      )}

      {products.length === 0 ? (
        /* Empty State */
        <Card variant="default" className="border border-hairline-light p-12 flex flex-col items-center justify-center text-center gap-6 min-h-64 bg-canvas-light max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-pistachio-10 flex items-center justify-center text-ink border border-hairline-light">
            <PackageOpen className="h-8 w-8 stroke-[1.5]" />
          </div>
          <div className="flex flex-col gap-2 max-w-sm">
            <h2 className="text-heading-xl font-medium text-ink">
              No Products Yet
            </h2>
            <p className="text-body-md text-shade-50">
              We are currently setting up our collections. Check back soon for beautiful boutique clothing!
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-14 w-full">
          {/* Featured Section Container */}
          {featuredProducts.length > 0 && (
            <div className="relative overflow-hidden rounded-3xl border border-emerald-800/10 bg-gradient-to-br from-emerald-50/20 via-canvas-cream/30 to-emerald-50/10 p-6 sm:p-8">
              {/* Ambient Glow */}
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-700/5 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex flex-col gap-1.5 mb-6 pb-4 border-b border-emerald-800/10">
                <div className="inline-flex items-center gap-2 bg-emerald-800/10 text-emerald-850 px-3 py-1 rounded-full text-micro font-bold uppercase tracking-wider self-start select-none">
                  <Sparkles className="h-3 w-3 stroke-[2.5]" />
                  <span>Curated Collection</span>
                </div>
                <h2 className="font-display text-heading-xl font-bold tracking-tight text-ink uppercase">
                  Featured Exclusives
                </h2>
                <p className="text-caption text-shade-50 font-light">
                  Handpicked luxury items and signature boutique designs.
                </p>
              </div>

              <ProductSlider
                products={featuredProducts}
                subdomain={subdomain}
                merchantId={merchantId}
                totalCount={featuredProductsTotal.length}
                promoType="featured"
                themeClass={themeClass}
              />
            </div>
          )}

          {/* New Arrivals Section Container */}
          {newArrivalProducts.length > 0 && (
            <div className="relative overflow-hidden rounded-3xl border border-amber-500/10 bg-gradient-to-br from-amber-50/10 via-canvas-cream/30 to-amber-50/5 p-6 sm:p-8">
              {/* Ambient Glow */}
              <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex flex-col gap-1.5 mb-6 pb-4 border-b border-amber-550/10">
                <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-800 px-3 py-1 rounded-full text-micro font-bold uppercase tracking-wider self-start select-none">
                  <Flame className="h-3 w-3 stroke-[2.5]" />
                  <span>Just Dropped</span>
                </div>
                <h2 className="font-display text-heading-xl font-bold tracking-tight text-ink uppercase">
                  New Arrivals
                </h2>
                <p className="text-caption text-shade-50 font-light">
                  Freshly styled designs and seasonal boutique essentials.
                </p>
              </div>

              <ProductSlider
                products={newArrivalProducts}
                subdomain={subdomain}
                merchantId={merchantId}
                totalCount={newArrivalProductsTotal.length}
                promoType="new_arrival"
                themeClass={themeClass}
              />
            </div>
          )}

          {/* CTA to Products Page */}
          <div className="flex flex-col items-center justify-center py-10 border-t border-hairline-light mt-4">
            <Link
              href="/products"
              className="inline-flex items-center justify-center bg-primary text-on-primary font-medium rounded-full px-8 py-3.5 hover:bg-shade-70 transition-all text-body-md shadow-sm select-none"
            >
              Shop All Products
            </Link>
          </div>

          {/* FAQs Accordion */}
          {parsedFaqs.length > 0 && (
            <section className="flex flex-col gap-6 border-t border-hairline-light pt-10">
              <h2 className="text-heading-lg font-semibold text-ink uppercase tracking-tight">
                Frequently Asked Questions
              </h2>
              <div className="flex flex-col divide-y divide-hairline-light border border-hairline-light rounded-2xl overflow-hidden bg-canvas-light">
                {parsedFaqs.map((faq, i) => (
                  <details key={i} className="group p-5 cursor-pointer">
                    <summary className="flex items-center justify-between font-semibold text-body-strong text-ink list-none">
                      <span>{faq.question}</span>
                      <span className="text-shade-40 group-open:rotate-45 transition-transform duration-250 text-xl leading-none select-none">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-body-md text-shade-50 font-light leading-relaxed animate-fade-in">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function StorefrontPageSkeleton() {
  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto animate-pulse px-4 sm:px-6 lg:px-8">
      {/* Skeleton Hero Banner */}
      <div className="relative aspect-[3/1] w-full rounded-3xl bg-shade-30 mt-4" />

      {/* Skeleton Product List/Slider */}
      <div className="flex flex-col gap-6 w-full">
        <div className="h-6 w-48 bg-shade-30 rounded-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-64 bg-shade-30 rounded-2xl" />
          <div className="h-64 bg-shade-30 rounded-2xl" />
          <div className="h-64 bg-shade-30 rounded-2xl" />
          <div className="h-64 bg-shade-30 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
