"use client"

import React from "react"
import Image from "next/image"

interface GeneralHeroBannerProps {
  name: string
  subtitle: string | null
  heroImageUrl: string | null
}

export function GeneralHeroBanner({ name, subtitle, heroImageUrl }: GeneralHeroBannerProps) {
  return heroImageUrl ? (
    <div className="relative aspect-[3/1] w-full rounded-[var(--radius-xl)] overflow-hidden mt-4 border border-[var(--color-hairline-light)] bg-[var(--color-canvas-cream)]/20">
      <Image
        src={heroImageUrl}
        alt={name}
        fill
        priority
        sizes="(max-width: 1280px) 100vw, 1280px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-10">
        <h1 className="font-display text-storefront-display-huge text-white">
          {name}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-base text-white/90 font-light mt-2 max-w-xl">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  ) : (
    /* Editorial Header Fallback */
    <div className="flex flex-col gap-2 border-b border-[var(--color-hairline-light)] pb-6 mt-4">
      <h1 className="font-display text-storefront-display-huge text-[var(--color-ink)] tracking-tight leading-none uppercase">
        {name}
      </h1>
      <p className="text-base sm:text-lg text-[var(--color-shade-50)] font-light max-w-xl">
        {subtitle ?? "Browse our boutique clothing collections and order directly online."}
      </p>
    </div>
  )
}
