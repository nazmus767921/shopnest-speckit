import { ThemeSettings } from "@/templates/types"
import React from "react"

export function getThemeVariables(settings?: ThemeSettings | null): React.CSSProperties {
  if (!settings) return {}

  const vars: any = {}

  if (settings.colors) {
    if (settings.colors.primary) {
      vars["--color-primary"] = settings.colors.primary
    }
    if (settings.colors.secondary) {
      vars["--color-secondary"] = settings.colors.secondary
      vars["--color-surface-secondary"] = settings.colors.secondary
    }
    if (settings.colors.background) {
      vars["--color-background"] = settings.colors.background
      vars["--color-canvas-light"] = settings.colors.background
      vars["--color-canvas-cream"] = settings.colors.background
    }
    if (settings.colors.text) {
      vars["--color-text"] = settings.colors.text
      vars["--color-ink"] = settings.colors.text
    }
  }

  if (settings.layout?.borderRadius) {
    const radiusMap = {
      none: "0",
      sm: "0.25rem",
      md: "0.5rem",
      lg: "1rem",
      full: "9999px",
    }
    const r = radiusMap[settings.layout.borderRadius]
    vars["--radius"] = r
    vars["--radius-sm"] = r
    vars["--radius-md"] = r
    vars["--radius-lg"] = r
    vars["--radius-xl"] = r
    vars["--radius-pill"] = r
  }

  return vars as React.CSSProperties
}
