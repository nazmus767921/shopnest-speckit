import React from "react"
import Link from "next/link"
import { SparklesIcon, FlameIcon, PackageOpenIcon } from "@/lib/icons";

import { Card } from "@/components/ui"
import { ProductSlider } from "@/components/storefront/ProductSlider"
import { SectionRenderer } from "@/components/storefront/sections/SectionRenderer"
import { type HomePageProps } from "../types"
import { assignColorRhythm } from "@/lib/storefront-sections/color-rhythm"
import * as eleganceModule from "./index"

export function EleganceHomePage({ store, sections = [] }: HomePageProps) {
  const visibleKeys = sections
    .filter(s => s.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(s => s.sectionKey)

  const rhythm = assignColorRhythm(visibleKeys, ['light', 'dark', 'accent'])

  return (
    <div className="flex flex-col animate-fade-in pb-32">

      {/* Dynamic Sections from DB */}
      <SectionRenderer 
        sections={sections} 
        merchantId={store.id} 
        subdomain={store.subdomain} 
        templateModule={eleganceModule}
        rhythm={rhythm}
      />

      {sections.length === 0 && (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center gap-8 py-32 max-w-xl mx-auto mt-24">
          <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
            <PackageOpenIcon className="h-8 w-8 stroke-[1]" />
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
      )}
      
      {/* CTA to Products Page */}
      <div className="flex flex-col items-center justify-center pt-8">
        <Link
          href="/products"
          className="inline-block bg-primary text-[var(--color-background,white)] font-sans text-sm font-medium tracking-[0.2em] uppercase px-12 py-5 rounded-[var(--radius)] hover:opacity-80 transition-opacity duration-300"
        >
          Browse Catalog
        </Link>
      </div>
    </div>
  )
}
