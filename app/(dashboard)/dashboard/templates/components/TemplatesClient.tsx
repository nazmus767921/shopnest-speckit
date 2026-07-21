"use client"

import React, { useState } from "react"
import { applyTheme } from "@/app/actions/theme"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircleIcon, PaletteIcon, Loader2 } from "lucide-react"

interface TemplatesClientProps {
  themes: any[]
  activeThemeId: string
}

export function TemplatesClient({ themes, activeThemeId: initialActiveTheme }: TemplatesClientProps) {
  const [activeThemeId, setActiveThemeId] = useState(initialActiveTheme)
  const [applying, setApplying] = useState<string | null>(null)

  const handleApply = async (themeId: string) => {
    setApplying(themeId)
    const result = await applyTheme(themeId)
    setApplying(null)
    
    if (result.success) {
      setActiveThemeId(themeId)
      toast.success("Theme applied successfully! Your storefront has been updated.")
    } else {
      toast.error(result.error || "Failed to apply theme")
    }
  }

  // Pre-defined preview images or colors if we don't have images in the DB
  const getThemePreview = (id: string) => {
    switch (id) {
      case "elegance":
        return "bg-zinc-100 border-zinc-200"
      case "sunset":
        return "bg-orange-50 border-orange-200"
      case "midnight":
        return "bg-slate-900 border-slate-700"
      default:
        return "bg-muted"
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {themes.map((theme) => {
        const isActive = activeThemeId === theme.id
        const isApplying = applying === theme.id

        return (
          <Card key={theme.id} className={`overflow-hidden transition-all duration-200 ${isActive ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}>
            <div className={`h-40 w-full flex items-center justify-center ${getThemePreview(theme.id)}`}>
              <PaletteIcon className={`w-12 h-12 opacity-20 ${theme.id === 'midnight' ? 'text-white' : 'text-black'}`} />
            </div>
            
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl capitalize">{theme.name}</CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {theme.description || "A beautiful storefront template."}
                  </CardDescription>
                </div>
                {isActive && (
                  <span className="flex items-center text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full whitespace-nowrap">
                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                    Active
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {/* Could show CSS variables preview here if we wanted */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground">JSON Engine</span>
                <span className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground">Responsive</span>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button 
                variant={isActive ? "secondary" : "default"} 
                className="w-full" 
                disabled={isActive || isApplying}
                onClick={() => handleApply(theme.id)}
              >
                {isApplying ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Applying...</>
                ) : isActive ? (
                  "Currently Active"
                ) : (
                  "Apply Theme"
                )}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
