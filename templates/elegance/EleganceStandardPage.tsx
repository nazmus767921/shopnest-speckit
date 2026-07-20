import React from "react"
import { type StandardPageProps } from "../types"
import DOMPurify from "isomorphic-dompurify"

export function EleganceStandardPage({ store, page }: StandardPageProps) {
  const sanitizedContent = page.content ? DOMPurify.sanitize(page.content) : ""

  return (
    <div className="flex flex-col animate-fade-in pb-32">
      {/* Page Header */}
      <div className="w-full bg-[var(--color-canvas-light)] border-b border-[var(--color-hairline-light)] py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center flex flex-col gap-4">
          <h1 className="font-sans text-4xl md:text-5xl font-light tracking-tight text-ink">
            {page.title}
          </h1>
          {page.metaDescription && (
            <p className="text-lg text-zinc-500 font-light max-w-2xl mx-auto">
              {page.metaDescription}
            </p>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-24 prose prose-zinc max-w-none prose-headings:font-sans prose-headings:font-light prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
        <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
      </div>
    </div>
  )
}
