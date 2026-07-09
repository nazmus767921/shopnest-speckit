"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"

interface FashionEditorialHeroProps {
  name: string
  subtitle: string | null
  heroImageUrl: string | null
}

export function FashionEditorialHero({ name, subtitle, heroImageUrl }: FashionEditorialHeroProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface-product)] py-16 md:py-24 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-[var(--color-hairline-warm)]">
      {/* Text column */}
      <div className="flex flex-col gap-4 max-w-xl">
        <span className="text-[var(--color-shade-50)] text-[11px] font-semibold tracking-[2px] uppercase font-sans">
          The Autumn Editorial
        </span>
        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-normal text-[var(--color-ink)] leading-[1.1] tracking-tight">
          {name}
        </h1>
        {subtitle && (
          <p className="text-base md:text-lg text-[var(--color-shade-50)] font-sans font-light leading-relaxed max-w-md">
            {subtitle}
          </p>
        )}
        <div className="mt-4">
          <Link
            href="/products"
            className="inline-block bg-[var(--color-primary)] text-[var(--color-on-primary)] font-sans text-sm font-medium tracking-wide uppercase px-8 py-3.5 rounded-[var(--radius-pill)] hover:opacity-90 transition-opacity"
          >
            Explore Editorial Shop
          </Link>
        </div>
      </div>

      {/* Image column */}
      {heroImageUrl && (
        <div className="relative w-full md:w-[45%] aspect-[3/4] rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-hairline-warm)]">
          <Image
            src={heroImageUrl}
            alt={name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 500px"
            className="object-cover"
          />
        </div>
      )}
    </div>
  )
}
