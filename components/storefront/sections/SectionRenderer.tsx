import React, { Suspense } from "react"
import { StorefrontSection } from "@/lib/storefront/schema/sections"
import { SectionKey } from "@/lib/storefront-sections/section-catalog"
import { TemplateModule } from "@/templates/types"
import { FullBleedHero } from "./FullBleedHero"
import { AnnouncementMarquee } from "./AnnouncementMarquee"
import { CategoryMosaic } from "./CategoryMosaic"
import { BrandStory } from "./BrandStory"
import { DynamicProductGrid } from "./DynamicProductGrid"
import { FaqSection } from "./FaqSection"
import { SectionErrorBoundary } from "../shared/SectionErrorBoundary"

interface SectionRendererProps {
  sections: StorefrontSection[]
  merchantId: string
  subdomain: string
  templateModule?: TemplateModule
  rhythm?: Record<string, string>
}

// Map of fallback components for sections that the template doesn't override
const FallbackSections: Partial<Record<SectionKey, React.ComponentType<{ content: any; merchantId: string; subdomain: string }>>> = {
  announcement_bar: ({ content }) => <AnnouncementMarquee content={content} />,
  hero: ({ content }) => <FullBleedHero content={content} />,
  category_showcase: ({ content, merchantId }) => (
    <Suspense fallback={<div className="h-96 w-full animate-pulse bg-zinc-100" />}>
      <CategoryMosaic content={content} merchantId={merchantId} />
    </Suspense>
  ),
  brand_story: ({ content }) => <BrandStory content={content} />,
  featured_products: ({ content, merchantId, subdomain }) => (
    <Suspense fallback={<div className="h-96 w-full animate-pulse bg-zinc-100" />}>
      <DynamicProductGrid content={content} merchantId={merchantId} subdomain={subdomain} />
    </Suspense>
  ),
  faq: ({ content }) => <FaqSection content={content} />,
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
          <div key={(section as any).id || key} data-rhythm={sectionRhythm}>
            <SectionErrorBoundary sectionKey={key}>
              <ComponentToRender content={section.content} merchantId={merchantId} subdomain={subdomain} />
            </SectionErrorBoundary>
          </div>
        )
      })}
    </>
  )
}
