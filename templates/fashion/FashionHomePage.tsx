
import React from "react"
import Link from "next/link"
import { Sparkles, Flame, PackageOpen } from "lucide-react"
import { Card } from "@/components/ui"
import { ProductSlider } from "@/components/storefront/ProductSlider"
import { SectionRenderer } from "@/components/storefront/sections/SectionRenderer"
import { type HomePageProps } from "../types"

export function FashionHomePage({ store, featuredProducts, newArrivals, categories, sections = [] }: HomePageProps) {
  const hasProducts = featuredProducts.length > 0 || newArrivals.length > 0
  const parsedFaqs = store.customFaqs || []

  return (
    <div className="flex flex-col animate-fade-in pb-32">

      {/* Dynamic Sections from DB */}
      <SectionRenderer sections={sections} merchantId={store.id} />

      {!hasProducts ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center gap-8 py-32 max-w-xl mx-auto mt-24">
          <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
            <PackageOpen className="h-8 w-8 stroke-[1]" />
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="font-sans text-3xl font-light text-ink tracking-tight">
              Empty Collection
            </h2>
            <p className="text-base font-sans text-zinc-500 font-light">
              Our designers are currently curating new arrivals. Please check back shortly.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-24 md:gap-40 w-full max-w-10xl mx-auto px-4 md:px-8 mt-24">
          {/* New Arrivals Section */}
          {newArrivals.length > 0 && (
            <div className="relative overflow-hidden">
              {/* Header */}
              <div className="flex flex-col items-center text-center gap-4 mb-16">
                <span className="text-zinc-500 text-xs font-sans font-light uppercase tracking-[0.2em] select-none">
                  Just Released
                </span>
                <h2 className="font-sans text-4xl md:text-5xl font-light tracking-tight text-ink">
                  New Arrivals
                </h2>
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
            <div className="relative overflow-hidden">
              {/* Header */}
              <div className="flex flex-col items-center text-center gap-4 mb-16">
                <span className="text-zinc-500 text-xs font-sans font-light uppercase tracking-[0.2em] select-none">
                  Editorial Choice
                </span>
                <h2 className="font-sans text-4xl md:text-5xl font-light tracking-tight text-ink">
                  Curated Exclusives
                </h2>
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
          <div className="flex flex-col items-center justify-center pt-8">
            <Link
              href="/products"
              className="inline-block bg-ink text-white font-sans text-sm font-medium tracking-[0.2em] uppercase px-12 py-5 rounded-full hover:bg-zinc-800 transition-colors duration-300"
            >
              Browse Catalog
            </Link>
          </div>

          {/* FAQs Accordion */}
          {parsedFaqs.length > 0 && (
            <section className="flex flex-col gap-16 pt-16 max-w-3xl mx-auto w-full">
              <h2 className="font-sans text-3xl md:text-4xl text-center text-ink font-light tracking-tight">
                Common Questions
              </h2>
              <div className="flex flex-col divide-y divide-zinc-200">
                {parsedFaqs.map((faq, i) => (
                  <details key={i} className="group py-6 cursor-pointer">
                    <summary className="flex items-center justify-between font-medium text-lg text-ink list-none font-sans">
                      <span>{faq.question}</span>
                      <span className="text-zinc-400 group-open:rotate-45 transition-transform duration-300 text-2xl font-light leading-none select-none">
                        +
                      </span>
                    </summary>
                    <p className="mt-6 text-base text-zinc-500 font-sans font-light leading-relaxed animate-fade-in pr-8">
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
