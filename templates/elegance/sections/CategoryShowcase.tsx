"use client"

import React from "react"
import type { CategoryShowcaseContent } from "@/lib/storefront/schema/sections"

export function CategoryShowcase({ content, merchantId, subdomain }: { content: CategoryShowcaseContent, merchantId: string, subdomain: string }) {
  const { headline, categoryIds } = content || {}

  if (!categoryIds || categoryIds.length === 0) {
    return null
  }

  return (
    <section className="py-24 px-6 md:px-12 max-w-10xl mx-auto w-full bg-[var(--color-surface)]">
      <div className="flex flex-col items-center justify-center mb-16 text-center">
        <h2 className="font-display text-4xl text-[var(--color-ink)] mb-4">
          {headline}
        </h2>
        <div className="w-16 h-px bg-[var(--color-hairline-warm)]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {categoryIds.map((id) => (
          <div key={id} className="p-8 border border-[var(--color-hairline-warm)] text-center bg-gray-50">
            {/* Stub for resolved category */}
            Category ID: {id}
          </div>
        ))}
      </div>
    </section>
  )
}
