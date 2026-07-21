"use client"

import React, { useEffect, useState } from "react"
import { PreviewSectionRenderer } from "@/components/storefront/sections/PreviewSectionRenderer"
import { StorefrontSection } from "@/lib/storefront-sections/types"
import { ThemeSettings } from "@/templates/types"
import { getThemeVariables } from "@/lib/storefront/theme/tokens"

interface PreviewClientProps {
  initialSections: StorefrontSection[]
  initialThemeSettings: ThemeSettings | null
}

export function PreviewClient({ initialSections, initialThemeSettings }: PreviewClientProps) {
  const [sections, setSections] = useState<StorefrontSection[]>(initialSections)
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(initialThemeSettings)

  useEffect(() => {
    const themeVars = getThemeVariables(themeSettings)
    Object.entries(themeVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value as string)
    })
  }, [themeSettings])

  useEffect(() => {
    // Send ready message to parent iframe container
    window.parent.postMessage({ type: "preview-ready" }, "*")

    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return

      if (event.data.type === "preview-update") {
        if (event.data.sections) {
          setSections(event.data.sections)
        }
        if (event.data.themeSettings) {
          setThemeSettings(event.data.themeSettings)
        }
      }

      if (event.data.type === "focus-section" && event.data.sectionKey) {
        const el = document.getElementById(`preview-section-${event.data.sectionKey}`)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  return (
    <div className="preview-container">
      <PreviewSectionRenderer sections={sections} />
    </div>
  )
}
