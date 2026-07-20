"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { type SectionProps } from "../../types"

export function PromoBanner({ section }: SectionProps) {
  const content = section.content as any
  const { title, subtitle, buttonText, buttonLink, imageUrl } = content

  return (
    <section className="relative w-full py-24 md:py-32 flex items-center justify-center overflow-hidden bg-[var(--color-primary)] my-12">
      {/* Background Image */}
      {imageUrl && (
        <>
          <div className="absolute inset-0 z-0">
            <Image
              src={imageUrl}
              alt={title || "Promo Banner"}
              fill
              className="object-cover object-center opacity-40 mix-blend-overlay"
              sizes="100vw"
            />
          </div>
        </>
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
        <h2 className="font-display text-4xl md:text-5xl text-[var(--color-on-primary)] leading-tight mb-6 tracking-wide">
          {title}
        </h2>
        
        {subtitle && (
          <p className="font-sans text-lg md:text-xl text-[var(--color-on-primary)]/80 font-light max-w-2xl mb-10">
            {subtitle}
          </p>
        )}
        
        {buttonText && (
          <Link 
            href={buttonLink || "/products"}
            className="inline-flex h-12 items-center justify-center rounded-[var(--radius-none)] bg-[var(--color-on-primary)] text-[var(--color-primary)] px-10 font-sans text-xs font-bold uppercase tracking-[0.2em] transition-transform hover:scale-105"
          >
            {buttonText}
          </Link>
        )}
      </div>
    </section>
  )
}
