"use client"

import React from "react"
import { StorefrontSection } from "@/lib/storefront-sections/types"
import { FullBleedHero } from "./FullBleedHero"
import { AnnouncementMarquee } from "./AnnouncementMarquee"
import { BrandStory } from "./BrandStory"
import { FaqSection } from "./FaqSection"

interface PreviewSectionRendererProps {
  sections: StorefrontSection[]
}

function PlaceholderSection({ title, subtitle }: { title: string, subtitle?: string }) {
  return (
    <div className="py-24 px-8 flex items-center justify-center bg-zinc-50 border-y border-zinc-100">
      <div className="text-center space-y-4 max-w-md mx-auto">
        <div className="mx-auto w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center mb-6">
          <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
        <h3 className="text-xl font-medium text-zinc-900">{title}</h3>
        <p className="text-zinc-500 text-sm">
          {subtitle || "This section relies on actual store data and cannot be fully previewed. It will render correctly on your live storefront."}
        </p>
      </div>
    </div>
  )
}

export function PreviewSectionRenderer({ sections }: PreviewSectionRendererProps) {
  const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder)
  const visibleSections = sortedSections.filter(s => s.isVisible)

  return (
    <>
      {visibleSections.map((section) => {
        let content: React.ReactNode = null

        switch (section.sectionKey) {
          case "announcement_bar":
            content = <AnnouncementMarquee content={section.content as any} />
            break
          case "hero":
            content = <FullBleedHero content={section.content as any} />
            break
          case "about":
            content = <BrandStory content={section.content as any} />
            break
          case "faq":
            content = <FaqSection content={section.content as any} />
            break
          case "category_showcase":
            content = (
              <PlaceholderSection 
                title="Category Showcase" 
                subtitle="Categories are loaded dynamically from your store. They will appear here on your live storefront."
              />
            )
            break
          case "product_grid":
          case "product_grid_featured":
          case "product_grid_new_arrivals":
          case "product_grid_exclusive":
            content = (
              <PlaceholderSection 
                title="Product Grid" 
                subtitle="Products are loaded dynamically based on your inventory. They will appear here on your live storefront."
              />
            )
            break
          default:
            return null
        }

        return (
          <div key={section.id || section.sectionKey} id={`preview-section-${section.sectionKey}`}>
            {content}
          </div>
        )
      })}
    </>
  )
}
