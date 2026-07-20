"use client"

import React from "react"
import { CategoryCard } from "@/components/storefront/primitives/CategoryCard"
import { type SectionProps } from "../../types"
import Link from "next/link"

export function CategoryShowcase({ section }: SectionProps) {
  const content = section.content as any
  const title = content.title || "Shop by Category"
  const categories = content.categories || []

  if (categories.length === 0) {
    return null
  }

  return (
    <section className="py-20 px-6 md:px-12 max-w-10xl mx-auto w-full bg-[var(--color-surface)]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <h2 className="font-display text-3xl md:text-4xl text-[var(--color-ink)]">
          {title}
        </h2>
        <Link 
          href="/products" 
          className="font-sans text-xs font-bold tracking-widest uppercase text-[var(--color-ink)] hover:text-[var(--color-shade-60)] transition-colors border-b border-[var(--color-ink)] pb-1"
        >
          View All Collections
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.slice(0, 4).map((cat: any, idx: number) => (
          <CategoryCard
            key={idx}
            name={cat.name}
            slug={cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}
            imageUrl={cat.imageUrl}
            imageAspectRatio={idx % 2 === 0 ? "aspect-[4/5]" : "aspect-square"}
          />
        ))}
      </div>
    </section>
  )
}
