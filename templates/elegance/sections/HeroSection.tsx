"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import type { HeroContent } from "@/lib/storefront/schema/sections"

export function HeroSection({ content }: { content: HeroContent, merchantId: string, subdomain: string }) {
  const { headline, subheadline, primaryButtonLabel, primaryButtonLink, imageUrl, imageAlt } = content || {}

  return (
    <section className="relative w-full h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-[var(--color-surface)]">
      {/* Background Image */}
      {imageUrl ? (
        <>
          <div className="absolute inset-0 z-0">
            <Image
              src={imageUrl}
              alt={imageAlt || headline || "Hero Image"}
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>
          {/* Subtle gradient overlay for text readability */}
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 z-0 bg-[var(--color-shade-20)] flex items-center justify-center">
          <span className="text-[var(--color-shade-50)] font-sans text-sm tracking-widest uppercase">Hero Image</span>
        </div>
      )}

      {/* Content Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-12 text-center flex flex-col items-center">
        <h1 className="font-display text-5xl md:text-7xl lg:text-[5.5rem] font-medium tracking-tight text-white leading-[1.1] mb-6 drop-shadow-md">
          {headline}
        </h1>
        
        {subheadline && (
          <p className="font-sans text-lg md:text-xl text-white/90 font-light max-w-2xl mb-10 drop-shadow">
            {subheadline}
          </p>
        )}
        
        {primaryButtonLabel && (
          <Link 
            href={primaryButtonLink || "/products"}
            className="inline-flex h-14 items-center justify-center rounded-[var(--radius-none)] bg-white text-black px-10 font-sans text-xs font-bold uppercase tracking-[0.2em] transition-transform hover:scale-105 hover:bg-white/90 shadow-lg"
          >
            {primaryButtonLabel}
          </Link>
        )}
      </div>
    </section>
  )
}
