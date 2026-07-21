"use client"

import React from "react"
import { ProductCard } from "@/components/storefront/primitives/ProductCard"
import type { FeaturedProductsContent } from "@/lib/storefront/schema/sections"
import Link from "next/link"

export function FeaturedProducts({ content, merchantId, subdomain }: { content: FeaturedProductsContent, merchantId: string, subdomain: string }) {
  const { headline, subheadline, productIds } = content || {}

  if (!productIds || productIds.length === 0) {
    return null
  }

  return (
    <section className="py-24 px-6 md:px-12 max-w-10xl mx-auto w-full bg-[var(--color-surface)]">
      <div className="flex flex-col items-center justify-center mb-16 text-center">
        <h2 className="font-display text-4xl text-[var(--color-ink)] mb-4">
          {headline}
        </h2>
        {subheadline && <p className="text-[var(--color-ink)] mb-4">{subheadline}</p>}
        <div className="w-16 h-px bg-[var(--color-hairline-warm)]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        {productIds.slice(0, 8).map((id) => (
          <div key={id} className="p-4 border border-[var(--color-hairline-warm)] text-center">
            {/* Stub for resolved product */}
            Product ID: {id}
          </div>
        ))}
      </div>

      <div className="mt-16 flex justify-center">
        <Link 
          href="/products" 
          className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--color-ink)] text-[var(--color-ink)] px-8 font-sans text-xs font-bold uppercase tracking-[0.2em] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-surface)]"
        >
          View All Products
        </Link>
      </div>
    </section>
  )
}
