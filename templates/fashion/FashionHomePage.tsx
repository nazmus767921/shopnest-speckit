"use client"

import React from "react"
import Link from "next/link"
import { Sparkles, Flame, PackageOpen } from "lucide-react"
import { Card } from "@/components/ui"
import { ProductSlider } from "@/components/storefront/ProductSlider"
import { FashionEditorialHero } from "./components/FashionEditorialHero"
import { FashionLookbookCard } from "./components/FashionLookbookCard"
import { type HomePageProps } from "../types"

export function FashionHomePage({ store, featuredProducts, newArrivals, categories }: HomePageProps) {
  const hasProducts = featuredProducts.length > 0 || newArrivals.length > 0
  const parsedFaqs = store.customFaqs || []

  // Slice categories for the asymmetric lookbook grid
  const lookbookCategories = categories.slice(0, 3)

  return (
    <div className="flex flex-col gap-16 md:gap-24 max-w-7xl mx-auto animate-fade-in px-4 sm:px-6 lg:px-8">
      {/* Editorial Hero Banner */}
      <FashionEditorialHero
        name={store.name}
        subtitle={store.subtitle}
        heroImageUrl={store.heroImageUrl}
      />

      {/* Asymmetric Lookbook Category Grid */}
      {lookbookCategories.length > 0 && (
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-2 text-center max-w-lg mx-auto">
            <span className="text-[11px] font-semibold tracking-[2px] uppercase text-[var(--color-shade-50)] font-sans">
              Seasonal Focus
            </span>
            <h2 className="font-display text-3xl md:text-4xl text-[var(--color-ink)] font-normal">
              Boutique Lookbooks
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {lookbookCategories.map((cat, idx) => {
              // Asymmetric sizing
              const heightClass = idx === 0 ? "md:col-span-1" : "md:col-span-1"
              // Fallback image if category doesn't have products with images
              const catImage = cat.products?.[0]?.images?.[0]?.storagePath || null
              
              return (
                <FashionLookbookCard
                  key={cat.id}
                  title={cat.name}
                  subtitle="Collection"
                  imageUrl={catImage}
                  href={`/products?category=${cat.id}`}
                  className={heightClass}
                />
              )
            })}
          </div>
        </section>
      )}

      {!hasProducts ? (
        /* Empty State */
        <Card variant="default" className="border border-[var(--color-hairline-warm)] p-12 flex flex-col items-center justify-center text-center gap-6 min-h-64 bg-[var(--color-canvas-light)] max-w-xl mx-auto rounded-[var(--radius-lg)]">
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface-product)] flex items-center justify-center text-[var(--color-ink)] border border-[var(--color-hairline-warm)]">
            <PackageOpen className="h-8 w-8 stroke-[1.2]" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-2xl text-[var(--color-ink)]">
              Empty Collection
            </h2>
            <p className="text-sm font-sans text-[var(--color-shade-50)]">
              Our designers are currently curating new arrivals. Please check back shortly.
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-16 md:gap-24 w-full">
          {/* New Arrivals Section */}
          {newArrivals.length > 0 && (
            <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-hairline-warm)] bg-[var(--color-canvas-light)] p-8">
              {/* Header */}
              <div className="flex flex-col gap-1.5 mb-8 pb-4 border-b border-[var(--color-hairline-warm)]">
                <div className="inline-flex items-center gap-2 text-[var(--color-discount-text)] text-[10px] font-bold uppercase tracking-[1.5px] font-sans self-start select-none">
                  <Flame className="h-3.5 w-3.5 stroke-[2.2]" />
                  <span>Just Released</span>
                </div>
                <h2 className="font-display text-3xl font-normal tracking-tight text-[var(--color-ink)]">
                  The New Arrivals
                </h2>
                <p className="text-xs text-[var(--color-shade-50)] font-sans font-light">
                  Fresh cuts and seasonal boutique essentials curated for you.
                </p>
              </div>

              <ProductSlider
                products={newArrivals}
                subdomain={store.subdomain}
                merchantId={store.id}
                totalCount={newArrivals.length}
                promoType="new_arrival"
                themeClass="storefront-theme-fashion"
              />
            </div>
          )}

          {/* Featured Section */}
          {featuredProducts.length > 0 && (
            <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-hairline-warm)] bg-[var(--color-canvas-light)] p-8">
              {/* Header */}
              <div className="flex flex-col gap-1.5 mb-8 pb-4 border-b border-[var(--color-hairline-warm)]">
                <div className="inline-flex items-center gap-2 text-[var(--color-rating-star)] text-[10px] font-bold uppercase tracking-[1.5px] font-sans self-start select-none">
                  <Sparkles className="h-3.5 w-3.5 stroke-[2.2]" />
                  <span>Editorial Choice</span>
                </div>
                <h2 className="font-display text-3xl font-normal tracking-tight text-[var(--color-ink)]">
                  Curated Exclusives
                </h2>
                <p className="text-xs text-[var(--color-shade-50)] font-sans font-light">
                  Hand-selected pieces displaying impeccable tailor-made details.
                </p>
              </div>

              <ProductSlider
                products={featuredProducts}
                subdomain={store.subdomain}
                merchantId={store.id}
                totalCount={featuredProducts.length}
                promoType="featured"
                themeClass="storefront-theme-fashion"
              />
            </div>
          )}

          {/* CTA to Products Page */}
          <div className="flex flex-col items-center justify-center pt-4">
            <Link
              href="/products"
              className="inline-block bg-[var(--color-primary)] text-[var(--color-on-primary)] font-sans text-sm font-medium tracking-wide uppercase px-10 py-4 rounded-[var(--radius-pill)] hover:opacity-90 transition-opacity"
            >
              Browse Catalog
            </Link>
          </div>

          {/* FAQs Accordion */}
          {parsedFaqs.length > 0 && (
            <section className="flex flex-col gap-8 border-t border-[var(--color-hairline-warm)] pt-16">
              <h2 className="font-display text-3xl text-center text-[var(--color-ink)] font-normal">
                Frequently Asked Questions
              </h2>
              <div className="flex flex-col divide-y divide-[var(--color-hairline-warm)] border border-[var(--color-hairline-warm)] rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-canvas-light)] max-w-4xl mx-auto w-full">
                {parsedFaqs.map((faq, i) => (
                  <details key={i} className="group p-6 cursor-pointer">
                    <summary className="flex items-center justify-between font-medium text-base text-[var(--color-ink)] list-none font-sans">
                      <span>{faq.question}</span>
                      <span className="text-[var(--color-shade-40)] group-open:rotate-45 transition-transform duration-250 text-xl leading-none select-none">
                        +
                      </span>
                    </summary>
                    <p className="mt-4 text-sm text-[var(--color-shade-50)] font-sans font-light leading-relaxed animate-fade-in pl-1">
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
