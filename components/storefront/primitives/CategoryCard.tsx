"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"

interface CategoryCardProps {
  name: string
  slug: string
  imageUrl?: string | null
  className?: string
  imageAspectRatio?: string
}

export function CategoryCard({ name, slug, imageUrl, className, imageAspectRatio = "aspect-[4/5]" }: CategoryCardProps) {
  return (
    <Link
      href={`/category/${slug}`}
      className={`group relative overflow-hidden rounded-[var(--radius-lg)] block ${className || ""}`}
    >
      <div className={`w-full ${imageAspectRatio} relative bg-[var(--color-surface-product)]`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 350px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--color-shade-40)] font-sans text-xs">
            No Image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className="absolute bottom-0 left-0 p-5 md:p-6 w-full">
        <h3 className="text-white font-display text-xl md:text-2xl font-medium tracking-wide drop-shadow-sm">
          {name}
        </h3>
        <span className="inline-flex items-center gap-2 text-white/90 font-sans text-xs font-semibold tracking-widest uppercase mt-2 opacity-0 -translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          Shop Now
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
      </div>
    </Link>
  )
}
