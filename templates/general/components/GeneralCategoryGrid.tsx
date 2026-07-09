"use client"

import React from "react"
import Link from "next/link"
import { type Category } from "../../types"

interface GeneralCategoryGridProps {
  categories: Category[]
}

export function GeneralCategoryGrid({ categories }: GeneralCategoryGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full select-none">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/products?category=${cat.id}`}
          className="flex items-center justify-center p-6 bg-[var(--color-surface-secondary)] hover:opacity-90 transition-opacity rounded-[var(--radius-md)] text-center text-[var(--color-ink)] font-bold text-base"
        >
          {cat.name}
        </Link>
      ))}
    </div>
  )
}
