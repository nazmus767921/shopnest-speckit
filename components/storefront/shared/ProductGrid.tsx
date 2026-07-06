"use client"

import React from "react"

interface ProductGridProps<T> {
  products?: T[]
  columns?: {
    mobile?: number
    sm?: number
    md?: number
    lg?: number
  }
  gapClassName?: string
  className?: string
  renderCard?: (product: T) => React.ReactNode
  children?: React.ReactNode
}

export function ProductGrid({
  products = [],
  columns = { mobile: 1, sm: 2, md: 3, lg: 4 },
  gapClassName = "gap-8",
  className = "",
  renderCard,
  children
}: ProductGridProps<any>) {
  const getColClass = (cols: number) => {
    switch (cols) {
      case 1: return "grid-cols-1"
      case 2: return "grid-cols-2"
      case 3: return "grid-cols-3"
      case 4: return "grid-cols-4"
      case 5: return "grid-cols-5"
      default: return "grid-cols-4"
    }
  }

  const colClasses = [
    getColClass(columns.mobile ?? 1),
    columns.sm ? `sm:${getColClass(columns.sm)}` : "",
    columns.md ? `md:${getColClass(columns.md)}` : "",
    columns.lg ? `lg:${getColClass(columns.lg)}` : "",
  ].filter(Boolean).join(" ")

  return (
    <div className={`grid ${colClasses} ${gapClassName} ${className}`}>
      {renderCard
        ? products.map((product) => renderCard(product))
        : children}
    </div>
  )
}
