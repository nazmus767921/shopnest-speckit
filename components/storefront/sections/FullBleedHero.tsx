import React from "react"
import Link from "next/link"
import { HeroContent } from "@/lib/storefront-sections/types"
import { Button } from "@/components/ui/primitives/Button"

export function FullBleedHero({ content }: { content: HeroContent }) {
  const { title, subtitle, buttonText, buttonLink, imageUrl, overlayOpacity = 50 } = content

  return (
    <div className="relative w-[100vw] min-h-[90vh] left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] flex flex-col lg:flex-row bg-white overflow-hidden">
      
      {/* Left Typography Panel (40%) */}
      <div className="flex-[0.4] flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20 lg:py-0 bg-zinc-50 z-10">
        <div className="max-w-lg space-y-8">
          <h1 className="text-6xl md:text-7xl lg:text-[5.5rem] font-serif italic text-black leading-[1.05] tracking-tight animate-fade-in-up">
            {title}
          </h1>
          
          {subtitle && (
            <p className="text-lg md:text-xl text-zinc-600 font-sans font-light animate-fade-in-up" style={{ animationDelay: "150ms" }}>
              {subtitle}
            </p>
          )}
          
          {buttonText && (
            <div className="pt-8 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              <Link href={buttonLink || "/products"}>
                <Button 
                  size="lg" 
                  className="rounded-full bg-black! text-white! hover:bg-black/80! border-none font-sans font-normal px-12 py-7 text-xs uppercase tracking-[0.2em] transition-colors duration-500"
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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-zinc-200 flex items-center justify-center">
            <span className="text-zinc-400 font-sans font-light tracking-widest uppercase text-sm">Hero Image Placeholder</span>
          </div>
        )}
      </div>

    </div>
  )
}
