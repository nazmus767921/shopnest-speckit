
import React from "react"
import Link from "next/link"
import Image from "next/image"
import { PackageOpen, Sparkles, Flame } from "lucide-react"
import { Card } from "@/components/ui"
import { ProductSlider } from "@/components/storefront/ProductSlider"
import { type HomePageProps } from "../types"
import { GeneralHeroBanner } from "./components/GeneralHeroBanner"

import { SectionRenderer } from "@/components/storefront/sections/SectionRenderer"

export function GeneralHomePage({ store, sections = [] }: HomePageProps) {
  const parsedFaqs = store.customFaqs || []

  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto animate-fade-in px-4 sm:px-6 lg:px-8">
      <GeneralHeroBanner
        name={store.name}
        subtitle={store.subtitle}
        heroImageUrl={store.heroImageUrl}
      />

      <SectionRenderer sections={sections} merchantId={store.id} subdomain={store.subdomain} />

      {sections.length === 0 && (
        /* Empty State */
        <Card variant="default" className="border border-[var(--color-hairline-light)] p-12 flex flex-col items-center justify-center text-center gap-6 min-h-64 bg-[var(--color-canvas-light)] max-w-xl mx-auto rounded-[var(--radius-md)] mt-12">
          <div className="w-16 h-16 rounded-[var(--radius-pill)] bg-zinc-100 flex items-center justify-center text-[var(--color-ink)] border border-[var(--color-hairline-light)]">
            <PackageOpen className="h-8 w-8 stroke-[1.5]" />
          </div>
          <div className="flex flex-col gap-2 max-w-sm">
            <h2 className="text-2xl font-medium text-[var(--color-ink)]">
              No Collections Yet
            </h2>
            <p className="text-sm text-[var(--color-shade-50)]">
              We are currently setting up our collections. Check back soon for beautiful boutique clothing!
            </p>
          </div>
        </Card>
      )}
      <div className="flex flex-col items-center justify-center py-10">
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
  )
}
