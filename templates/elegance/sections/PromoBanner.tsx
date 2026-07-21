"use client"

import React from "react"
import Link from "next/link"
import type { PromoBannerContent } from "@/lib/storefront/schema/sections"

export function PromoBanner({ content, merchantId, subdomain }: { content: PromoBannerContent, merchantId: string, subdomain: string }) {
  const { text, buttonLabel, buttonLink, backgroundColor } = content || {}

  return (
    <section 
      className="py-12 px-6 w-full text-center"
      style={{ backgroundColor: backgroundColor || "var(--color-shade-20)" }}
    >
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <h3 className="font-display text-2xl md:text-3xl text-white">
          {text}
        </h3>
        
        {buttonLabel && (
          <Link 
            href={buttonLink || "/products"}
            className="inline-flex h-12 items-center justify-center rounded-full bg-white text-black px-8 font-sans text-xs font-bold uppercase tracking-[0.2em] transition-transform hover:scale-105"
          >
            {buttonLabel}
          </Link>
        )}
      </div>
    </section>
  )
}
