import React, { Suspense } from "react"
import { StorefrontSection } from "@/lib/storefront-sections/types"
import { SectionKey } from "@/lib/storefront-sections/section-catalog"
import { TemplateModule, SectionProps } from "@/templates/types"
import { FullBleedHero } from "./FullBleedHero"
import { AnnouncementMarquee } from "./AnnouncementMarquee"
import { CategoryMosaic } from "./CategoryMosaic"
import { BrandStory } from "./BrandStory"
import { DynamicProductGrid } from "./DynamicProductGrid"
import { FaqSection } from "./FaqSection"

interface SectionRendererProps {
  sections: StorefrontSection[]
  merchantId: string
  subdomain: string
  templateModule?: TemplateModule
  rhythm?: Record<string, string>
}

// Map of fallback components for sections that the template doesn't override
const FallbackSections: Partial<Record<SectionKey, React.ComponentType<SectionProps & { merchantId: string; subdomain: string }>>> = {
  announcement_bar: ({ section }) => <AnnouncementMarquee content={section.content as any} />,
  hero: ({ section }) => <FullBleedHero content={section.content as any} />,
  category_showcase: ({ section, merchantId }) => (
    <Suspense fallback={<div className="h-96 w-full animate-pulse bg-zinc-100" />}>
      <CategoryMosaic content={section.content as any} merchantId={merchantId} />
    </Suspense>
  ),
  brand_story: ({ section }) => <BrandStory content={section.content as any} />,
  featured_products: ({ section, merchantId, subdomain }) => (
    <Suspense fallback={<div className="h-96 w-full animate-pulse bg-zinc-100" />}>
      <DynamicProductGrid content={section.content as any} merchantId={merchantId} subdomain={subdomain} />
    </Suspense>
  ),
  faq: ({ section }) => <FaqSection content={section.content as any} />,
}

export function SectionRenderer({ sections, merchantId, subdomain, templateModule, rhythm }: SectionRendererProps) {
  // Sort sections by sortOrder just in case they aren't already sorted
  const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder)
  
  // Filter only visible sections
  const visibleSections = sortedSections.filter(s => s.isVisible)

  return (
    <>
      {visibleSections.map((section) => {
        const key = section.sectionKey as SectionKey
        const sectionRhythm = rhythm?.[key]
        
        let ComponentToRender: React.ComponentType<any> | null = null

        // 1. Try template-specific section
        if (templateModule?.sections?.[key]) {
          ComponentToRender = templateModule.sections[key]!
        }
        // 2. Fall back to shared default
        else if (FallbackSections[key]) {
          ComponentToRender = FallbackSections[key]!
        }

        if (!ComponentToRender) return null

        return (
          <div key={section.id || key} data-rhythm={sectionRhythm}>
            <ComponentToRender section={section} merchantId={merchantId} subdomain={subdomain} />
          </div>
        )
      })}
    </>
  )
}
