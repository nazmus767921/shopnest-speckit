import type { TemplateModule } from "./types"
import * as general from "./general"
import * as fashion from "./fashion"

export const templates: Record<string, TemplateModule> = {
  general,
  fashion,
}

export function getTemplate(slug: string): TemplateModule {
  return templates[slug] ?? templates.general
}
