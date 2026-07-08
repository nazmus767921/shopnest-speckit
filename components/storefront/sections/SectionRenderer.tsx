import React, { Suspense } from "react"
import { StorefrontSection } from "@/lib/storefront-sections/types"
import { FullBleedHero } from "./FullBleedHero"
import { AnnouncementMarquee } from "./AnnouncementMarquee"
import { CategoryMosaic } from "./CategoryMosaic"
import { BrandStory } from "./BrandStory"
import { DynamicProductGrid } from "./DynamicProductGrid"

interface SectionRendererProps {
  sections: StorefrontSection[]
  merchantId: string
  subdomain: string
}

export function SectionRenderer({ sections, merchantId, subdomain }: SectionRendererProps) {
  // Sort sections by sortOrder just in case they aren't already sorted
  const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder)
  
  // Filter only visible sections
  const visibleSections = sortedSections.filter(s => s.isVisible)

  return (
    <>
      {visibleSections.map((section) => {
        switch (section.sectionKey) {
          case "announcement_bar":
            return (
              <AnnouncementMarquee 
                key={section.id || "announcement_bar"} 
                content={section.content as any} 
              />
            )
          case "hero":
            return (
              <FullBleedHero 
                key={section.id || "hero"} 
                content={section.content as any} 
              />
            )
          case "category_showcase":
            return (
              <Suspense key={section.id || "category_showcase"} fallback={<div className="h-96 w-full animate-pulse bg-zinc-100" />}>
                <CategoryMosaic 
                  content={section.content as any} 
                  merchantId={merchantId} 
                />
              </Suspense>
            )
          case "about":
            return (
              <BrandStory 
                key={section.id || "about"} 
                content={section.content as any} 
              />
            )
          case "product_grid":
          case "product_grid_featured":
          case "product_grid_new_arrivals":
          case "product_grid_exclusive":
            return (
              <Suspense key={section.id || section.sectionKey} fallback={<div className="h-96 w-full animate-pulse bg-zinc-100" />}>
                <DynamicProductGrid 
                  content={section.content as any} 
                  merchantId={merchantId}
                  subdomain={subdomain}
                />
              </Suspense>
            )
          default:
            return null // Unknown section, ignore
        }
      })}
    </>
  )
}
