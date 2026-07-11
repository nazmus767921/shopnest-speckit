
import React from "react"
import Link from "next/link"
import Image from "next/image"
import { PackageOpenIcon, SparklesIcon, FlameIcon } from "@/lib/icons";

import { Card } from "@/components/ui"
import { ProductSlider } from "@/components/storefront/ProductSlider"
import { type HomePageProps } from "../types"

import { SectionRenderer } from "@/components/storefront/sections/SectionRenderer"

export function GeneralHomePage({ store, sections = [] }: HomePageProps) {
  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto animate-fade-in px-4 sm:px-6 lg:px-8">
      <SectionRenderer sections={sections} merchantId={store.id} subdomain={store.subdomain} />

      {sections.length === 0 && (
        /* Empty State */
        <Card className="border border-[var(--color-hairline-light)] p-12 flex flex-col items-center justify-center text-center gap-6 min-h-64 bg-[var(--color-canvas-light)] max-w-xl mx-auto rounded-[var(--radius-md)] mt-12">
          <div className="w-16 h-16 rounded-[var(--radius-pill)] bg-zinc-100 flex items-center justify-center text-[var(--color-ink)] border border-[var(--color-hairline-light)]">
            <PackageOpenIcon className="h-8 w-8 stroke-[1.5]" />
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
    </div>
  )
}
