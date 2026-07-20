import type { TemplateModule } from "./types"
import * as elegance from "./elegance"

export const templates: Record<string, TemplateModule> = {
  elegance,
}

export function getTemplate(slug: string): TemplateModule {
  return templates[slug] ?? templates.elegance
}
