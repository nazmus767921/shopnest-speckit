import React from "react"
import { type StandardPageProps } from "../types"
import DOMPurify from "isomorphic-dompurify"

export function GeneralStandardPage({ store, page }: StandardPageProps) {
  const sanitizedContent = page.content ? DOMPurify.sanitize(page.content) : ""

  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto animate-fade-in px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col gap-4 border-b border-[var(--color-hairline-light)] pb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-ink)]">
          {page.title}
        </h1>
        {page.metaDescription && (
          <p className="text-lg text-[var(--color-shade-50)] max-w-3xl">
            {page.metaDescription}
          </p>
        )}
      </div>

      <div className="prose prose-zinc max-w-none prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
        <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
      </div>
    </div>
  )
}
