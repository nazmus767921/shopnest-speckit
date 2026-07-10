"use client"

import React from "react"
import { StorefrontSection } from "@/lib/storefront-sections/types"

interface LivePreviewCanvasProps {
  sections: StorefrontSection[]
  themeSettings: any
}

export function LivePreviewCanvas({ sections, themeSettings }: LivePreviewCanvasProps) {
  const primaryColor = themeSettings?.colors?.primary || "#000000"
  const secondaryColor = themeSettings?.colors?.secondary || "#4b5563"
  const bgColor = themeSettings?.colors?.background || "#ffffff"
  
  const getBorderRadius = () => {
    switch (themeSettings?.layout?.borderRadius) {
      case "none": return "0px"
      case "sm": return "4px"
      case "md": return "8px"
      case "lg": return "16px"
      case "full": return "9999px"
      default: return "8px"
    }
  }

  const borderRadius = getBorderRadius()

  const renderSectionWireframe = (section: StorefrontSection, index: number) => {
    if (!section.isVisible) return null

    switch (section.sectionKey) {
      case "announcement_bar":
        return (
          <div key={index} className="w-full h-8 flex items-center justify-center text-[10px] font-medium text-white transition-colors duration-300" style={{ backgroundColor: primaryColor }}>
            Announcement Bar
          </div>
        )
      case "hero":
        return (
          <div key={index} className="w-full h-48 bg-muted flex flex-col items-center justify-center gap-2 p-6 transition-all duration-300">
            <div className="w-3/4 h-6 bg-muted/80 rounded" style={{ borderRadius }}></div>
            <div className="w-1/2 h-4 bg-muted/80 rounded" style={{ borderRadius }}></div>
            <div className="w-24 h-8 mt-4 transition-colors duration-300" style={{ backgroundColor: primaryColor, borderRadius }}></div>
          </div>
        )
      case "category_showcase":
        return (
          <div key={index} className="w-full p-6 flex flex-col gap-4">
            <div className="w-32 h-5 bg-muted/80 rounded mx-auto" style={{ borderRadius }}></div>
            <div className="flex gap-4 justify-center">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-16 h-16 bg-muted rounded-full"></div>
              ))}
            </div>
          </div>
        )
      case "product_grid":
      case "product_grid_featured":
      case "product_grid_new_arrivals":
      case "product_grid_exclusive":
        return (
          <div key={index} className="w-full p-6 flex flex-col gap-4">
            <div className="w-40 h-5 bg-muted/80 rounded" style={{ borderRadius }}></div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="w-full h-32 bg-muted transition-all duration-300" style={{ borderRadius }}></div>
                  <div className="w-3/4 h-3 bg-muted/80 rounded" style={{ borderRadius }}></div>
                  <div className="w-1/2 h-3 bg-muted/80 rounded" style={{ borderRadius }}></div>
                </div>
              ))}
            </div>
          </div>
        )
      case "about":
        return (
          <div key={index} className="w-full p-6 flex gap-6 items-center bg-muted/30">
            <div className="flex-1 flex flex-col gap-3">
              <div className="w-3/4 h-5 bg-muted/80 rounded" style={{ borderRadius }}></div>
              <div className="w-full h-3 bg-muted/80 rounded" style={{ borderRadius }}></div>
              <div className="w-full h-3 bg-muted/80 rounded" style={{ borderRadius }}></div>
              <div className="w-2/3 h-3 bg-muted/80 rounded" style={{ borderRadius }}></div>
            </div>
            <div className="w-1/3 h-32 bg-muted/80 transition-all duration-300" style={{ borderRadius }}></div>
          </div>
        )
      default:
        return (
          <div key={index} className="w-full h-24 bg-muted/30 flex items-center justify-center border border-dashed border-border text-xs text-muted-foreground" style={{ borderRadius }}>
            {section.sectionKey}
          </div>
        )
    }
  }

  return (
    <div className="sticky top-6 flex flex-col gap-4 text-foreground">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Live Preview</h2>
        <span className="text-xs font-medium px-2 py-1 bg-muted text-muted-foreground rounded-full">Mini-Canvas</span>
      </div>
      <div className="relative w-full aspect-[9/16] max-h-[800px] bg-card border border-border rounded-[min(var(--radius-4xl),32px)] overflow-hidden flex flex-col ring-8 ring-muted/50">
        {/* Fake Browser Header */}
        <div className="w-full h-12 bg-muted/50 border-b border-border flex items-center px-6 gap-2 shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
          </div>
          <div className="mx-auto w-1/2 h-6 bg-card rounded-md border border-border"></div>
        </div>

        {/* Scrollable Content */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col bg-card transition-colors duration-500 scrollbar-hide"
          style={{ backgroundColor: bgColor }}
        >
          {sections.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
              No visible sections. Add sections to preview.
            </div>
          ) : (
            sections.map((section, index) => renderSectionWireframe(section, index))
          )}
        </div>
      </div>
    </div>
  )
}
