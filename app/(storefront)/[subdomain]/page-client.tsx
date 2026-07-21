"use client"

import React, { useState, useEffect } from "react"
import SectionRenderer from "@/components/storefront/sections/SectionRenderer"

type Props = {
  initialLayout: any[]
  store: any
  isPreview: boolean
}

export default function StorefrontPageClient({ initialLayout, store, isPreview }: Props) {
  const [layout, setLayout] = useState(initialLayout || [])

  useEffect(() => {
    if (!isPreview) return

    const handleMessage = (event: MessageEvent) => {
      // In production, you'd want to check event.origin
      if (event.data?.type === 'UPDATE_LAYOUT' && event.data.layout) {
        setLayout(event.data.layout)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [isPreview])

  return (
    <div className="w-full flex flex-col">
      {layout.map((section: any) => (
        <SectionRenderer key={section.id} section={section} store={store} />
      ))}
      {layout.length === 0 && (
        <div className="py-24 text-center text-muted-foreground bg-muted/20">
          No sections added yet. Go to the visual editor to build your page.
        </div>
      )}
    </div>
  )
}
