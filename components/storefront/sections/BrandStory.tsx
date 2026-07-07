import React from "react"
import Link from "next/link"
import { AboutContent } from "@/lib/storefront-sections/types"

export function BrandStory({ content }: { content: AboutContent }) {
  const { title, description, imageUrl, buttonText, buttonLink } = content

  return (
    <section className="py-24 md:py-36 px-4 md:px-8 bg-[var(--color-surface-product)]/15">
      <div className="max-w-10xl mx-auto flex flex-col md:flex-row items-center gap-16 md:gap-28">
        
        {/* Text Content Column */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-6 order-2 md:order-1">
          <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[var(--color-shade-50)] font-sans">
            The Essence
          </span>
          <h2 className="font-display text-4xl md:text-6xl font-light uppercase tracking-wide text-[var(--color-ink)] leading-[1.15] max-w-xl">
            {title}
          </h2>
          
          <div className="w-16 h-px bg-[var(--color-hairline-warm)] my-1" />
          
          <p className="text-sm md:text-base text-zinc-550 leading-relaxed font-sans font-light max-w-xl">
            {description}
          </p>
          
          {buttonText && (
            <div className="pt-4">
              <Link href={buttonLink || "/about"}>
                <button className="h-12 px-10 rounded-full border border-zinc-300 hover:border-black text-ink bg-transparent font-sans font-semibold text-xs uppercase tracking-[0.15em] transition-colors duration-300 cursor-pointer select-none">
                  {buttonText}
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Image Content Column */}
        <div className="flex-[0.9] w-full order-1 md:order-2">
          {imageUrl ? (
            <div className="relative aspect-[3/4] w-full max-w-lg mx-auto md:ml-auto overflow-hidden rounded-2xl border border-[var(--color-hairline-warm)]/40 bg-[var(--color-surface-product)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={imageUrl} 
                alt={title}
                className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out hover:scale-105"
              />
            </div>
          ) : (
            <div className="relative aspect-[3/4] w-full max-w-lg mx-auto md:ml-auto bg-[var(--color-surface-product)] border border-[var(--color-hairline-warm)]/40 rounded-2xl flex items-center justify-center">
              <span className="text-zinc-400 font-sans text-xs tracking-widest uppercase font-light">Boutique Story</span>
            </div>
          )}
        </div>

      </div>
    </section>
  )
}
