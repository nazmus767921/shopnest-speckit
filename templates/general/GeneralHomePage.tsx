"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { PackageOpen, Sparkles, Flame } from "lucide-react"
import { Card } from "@/components/ui"
import { ProductSlider } from "@/components/storefront/ProductSlider"
import { type HomePageProps } from "../types"
import { GeneralHeroBanner } from "./components/GeneralHeroBanner"

export function GeneralHomePage({ store, featuredProducts, newArrivals }: HomePageProps) {
  const hasProducts = featuredProducts.length > 0 || newArrivals.length > 0
  const parsedFaqs = store.customFaqs || []

  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto animate-fade-in px-4 sm:px-6 lg:px-8">
      <GeneralHeroBanner
        name={store.name}
        subtitle={store.subtitle}
        heroImageUrl={store.heroImageUrl}
      />

      {!hasProducts ? (
        /* Empty State */
        <Card variant="default" className="border border-[var(--color-hairline-light)] p-12 flex flex-col items-center justify-center text-center gap-6 min-h-64 bg-[var(--color-canvas-light)] max-w-xl mx-auto rounded-[var(--radius-md)]">
          <div className="w-16 h-16 rounded-[var(--radius-pill)] bg-zinc-100 flex items-center justify-center text-[var(--color-ink)] border border-[var(--color-hairline-light)]">
            <PackageOpen className="h-8 w-8 stroke-[1.5]" />
          </div>
          <div className="flex flex-col gap-2 max-w-sm">
            <h2 className="text-2xl font-medium text-[var(--color-ink)]">
              No Products Yet
            </h2>
            <p className="text-sm text-[var(--color-shade-50)]">
              We are currently setting up our collections. Check back soon for beautiful boutique clothing!
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-14 w-full">
          {/* Featured Section Container */}
          {featuredProducts.length > 0 && (
            <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-emerald-800/10 bg-gradient-to-br from-emerald-50/20 via-[var(--color-canvas-cream)]/30 to-emerald-50/10 p-6 sm:p-8">
              {/* Ambient Glow */}
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-700/5 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex flex-col gap-1.5 mb-6 pb-4 border-b border-emerald-800/10">
                <div className="inline-flex items-center gap-2 bg-emerald-800/10 text-emerald-850 px-3 py-1 rounded-[var(--radius-pill)] text-[10px] font-bold uppercase tracking-wider self-start select-none">
                  <Sparkles className="h-3 w-3 stroke-[2.5]" />
                  <span>Curated Collection</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-ink)] uppercase">
                  Featured Exclusives
                </h2>
                <p className="text-xs text-[var(--color-shade-50)] font-light">
                  Handpicked luxury items and signature boutique designs.
                </p>
              </div>

              <ProductSlider
                products={featuredProducts}
                subdomain={store.subdomain}
                merchantId={store.id}
                totalCount={featuredProducts.length}
                promoType="featured"
                themeClass="storefront-theme-default"
              />
            </div>
          )}

          {/* New Arrivals Section Container */}
          {newArrivals.length > 0 && (
            <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-amber-500/10 bg-gradient-to-br from-amber-50/10 via-[var(--color-canvas-cream)]/30 to-amber-50/5 p-6 sm:p-8">
              {/* Ambient Glow */}
              <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="flex flex-col gap-1.5 mb-6 pb-4 border-b border-amber-550/10">
                <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-850 px-3 py-1 rounded-[var(--radius-pill)] text-[10px] font-bold uppercase tracking-wider self-start select-none">
                  <Flame className="h-3 w-3 stroke-[2.5]" />
                  <span>Just Dropped</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-ink)] uppercase">
                  New Arrivals
                </h2>
                <p className="text-xs text-[var(--color-shade-50)] font-light">
                  Freshly styled designs and seasonal boutique essentials.
                </p>
              </div>

              <ProductSlider
                products={newArrivals}
                subdomain={store.subdomain}
                merchantId={store.id}
                totalCount={newArrivals.length}
                promoType="new_arrival"
                themeClass="storefront-theme-default"
              />
            </div>
          )}

          {/* CTA to Products Page */}
          <div className="flex flex-col items-center justify-center py-10 border-t border-[var(--color-hairline-light)] mt-4">
            <Link
              href="/products"
              className="btn-storefront-primary hover:opacity-90 transition-opacity"
            >
              Shop All Products
            </Link>
          </div>

          {/* FAQs Accordion */}
          {parsedFaqs.length > 0 && (
            <section className="flex flex-col gap-6 border-t border-[var(--color-hairline-light)] pt-10">
              <h2 className="text-storefront-heading-lg font-semibold text-[var(--color-ink)] uppercase tracking-tight">
                Frequently Asked Questions
              </h2>
              <div className="flex flex-col divide-y divide-[var(--color-hairline-light)] border border-[var(--color-hairline-light)] rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-canvas-light)]">
                {parsedFaqs.map((faq, i) => (
                  <details key={i} className="group p-5 cursor-pointer">
                    <summary className="flex items-center justify-between font-semibold text-storefront-body-strong text-[var(--color-ink)] list-none">
                      <span>{faq.question}</span>
                      <span className="text-[var(--color-shade-40)] group-open:rotate-45 transition-transform duration-250 text-xl leading-none select-none">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-storefront-body-md text-[var(--color-shade-50)] font-light leading-relaxed animate-fade-in">
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
