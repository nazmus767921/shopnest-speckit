import React, { Suspense } from "react"
import { FullBleedHero } from "./FullBleedHero"
import { AnnouncementMarquee } from "./AnnouncementMarquee"
import { CategoryMosaic } from "./CategoryMosaic"
import { BrandStory } from "./BrandStory"
import { DynamicProductGrid } from "./DynamicProductGrid"
import { FaqSection } from "./FaqSection"
import { SectionErrorBoundary } from "../shared/SectionErrorBoundary"

interface SectionRendererProps {
  section: {
    id: string
    type: string
    settings: any
  }
  store: any
}

export default function SectionRenderer({ section, store }: SectionRendererProps) {
  let ComponentToRender: React.ComponentType<any> | null = null

  // Map JSON 'type' to React components
  switch (section.type) {
    case 'hero':
      ComponentToRender = FullBleedHero
      break
    case 'announcement_bar':
      ComponentToRender = AnnouncementMarquee
      break
    case 'category_showcase':
      ComponentToRender = CategoryMosaic
      break
    case 'brand_story':
      ComponentToRender = BrandStory
      break
    case 'featured_products':
      ComponentToRender = DynamicProductGrid
      break
    case 'faq':
      ComponentToRender = FaqSection
      break
    // 'promo_banner', 'newsletter', 'testimonials' etc. could be added here
    default:
      ComponentToRender = null
      break
  }

  if (!ComponentToRender) {
    return (
      <div className="p-4 border border-dashed border-red-300 bg-red-50 text-red-800 text-center text-sm my-4">
        Unknown section type: <strong>{section.type}</strong>
      </div>
    )
  }

  return (
    <SectionErrorBoundary sectionKey={section.type}>
      <Suspense fallback={<div className="h-64 w-full animate-pulse bg-zinc-100" />}>
        {/* We map the JSON settings to the 'content' prop that these legacy components expect,
            or pass them directly if the component is updated. For now, assuming they take 'content'.
            Also passing merchantId and subdomain as required by some components. */}
        <ComponentToRender 
          content={section.settings} 
          merchantId={store.id} 
          subdomain={store.subdomain} 
          settings={section.settings}
        />
      </Suspense>
    </SectionErrorBoundary>
  )
}
