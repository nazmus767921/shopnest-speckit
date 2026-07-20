/** @deprecated Replaced by template-specific components in the elegance template. */
import React from "react"
import Link from "next/link"
import { HeroContent } from "@/lib/storefront-sections/types"
import { Button } from "@/components/ui/button"

export function FullBleedHero({ content }: { content: HeroContent }) {
  const { title, subtitle, buttonText, buttonLink, imageUrl, overlayOpacity = 50 } = content

  return (
    <div className="relative w-[100vw] min-h-[90vh] left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] flex flex-col lg:flex-row bg-[var(--color-background,white)] overflow-hidden">
      
      {/* Left Typography Panel (40%) */}
      <div className="flex-[0.4] flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20 lg:py-0 bg-transparent z-10">
        <div className="max-w-lg space-y-8">
          <h1 className="text-6xl md:text-7xl lg:text-[5.5rem] font-[family-name:var(--font-heading)] italic text-ink leading-[1.05] tracking-tight animate-fade-in-up">
            {title}
          </h1>
          
          {subtitle && (
            <p className="text-lg md:text-xl text-ink/80 font-[family-name:var(--font-body)] font-light animate-fade-in-up" style={{ animationDelay: "150ms" }}>
              {subtitle}
            </p>
          )}
          
          {buttonText && (
            <div className="pt-8 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              <Link href={buttonLink || "/products"}>
                <Button 
                  size="lg" 
                  className="rounded-[var(--radius)] bg-primary! text-on-primary! hover:opacity-80 border-none font-[family-name:var(--font-body)] font-normal px-12 py-7 text-xs uppercase tracking-[0.2em] transition-opacity duration-500"
                >
                  {buttonText}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Right Image Panel (60%) */}
      <div className="flex-[0.6] relative min-h-[50vh] lg:min-h-full">
        {imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div 
              className="absolute inset-0 bg-black" 
              style={{ opacity: overlayOpacity / 100 }} 
            />
          </>
        ) : (
          <div className="absolute inset-0 w-full h-full bg-shade-30 flex items-center justify-center">
            <span className="text-shade-50 font-[family-name:var(--font-body)] font-light tracking-widest uppercase text-sm">Hero Image Placeholder</span>
          </div>
        )}
      </div>

    </div>
  )
}
