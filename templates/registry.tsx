import React from "react"
import type { TemplateModule } from "./types"
import { elegance } from "./elegance"

export function createDefaultSection(key: string) {
  return function DefaultSection() {
    return (
      <div className="p-8 border border-dashed border-red-500 text-red-500 bg-red-50 rounded-md text-center">
        Section <strong>{key}</strong> is not implemented in this template.
      </div>
    )
  }
}

export function defineTemplate(module: TemplateModule): TemplateModule {
  return module
}

export const templates: Record<string, TemplateModule> = {
  elegance,
}

export function getTemplate(slug: string): TemplateModule {
  if (templates[slug]) {
    return templates[slug]
  }
  
  if (slug && slug !== 'general') {
    console.warn(`[Storefront] Template '${slug}' not found in registry. Falling back to default template 'elegance'.`)
  }
  
  return templates['elegance'] // Default fallback
}
