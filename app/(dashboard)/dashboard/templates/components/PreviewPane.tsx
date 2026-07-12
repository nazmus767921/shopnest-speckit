"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { StorefrontSection } from "@/lib/storefront-sections/types"
import { ThemeSettings } from "@/templates/types"
import { SmartphoneIcon, TabletIcon, MonitorIcon, RotateCwIcon, ExternalLinkIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import debounce from "lodash/debounce"

interface PreviewPaneProps {
  sections: StorefrontSection[]
  themeSettings: ThemeSettings | null
  merchantSubdomain: string
  expandedSectionKey?: string | null
  isPanelExpanded?: boolean
  onTogglePanel?: () => void
}

type Viewport = "mobile" | "tablet" | "desktop"

const VIEWPORT_WIDTHS = {
  mobile: "375px",
  tablet: "768px",
  desktop: "100%",
}

export function PreviewPane({ sections, themeSettings, merchantSubdomain, expandedSectionKey, isPanelExpanded = true, onTogglePanel }: PreviewPaneProps) {
  const [viewport, setViewport] = useState<Viewport>("desktop")
  const [isReady, setIsReady] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  const DESKTOP_WIDTH = 1440
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width)
      }
    })
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    return () => observer.disconnect()
  }, [])

  // Get current protocol and host for iframe src
  const [origin, setOrigin] = useState("")
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      const port = window.location.port ? `:${window.location.port}` : ""
      // Note: In production you might have a different domain structure, this assumes subdomain.domain.com
      if (isLocal) {
        setOrigin(`${window.location.protocol}//${merchantSubdomain}.localhost${port}`)
      } else {
        const rootDomain = window.location.hostname.replace("app.", "") // assuming app.shopnest.com
        setOrigin(`${window.location.protocol}//${merchantSubdomain}.${rootDomain}${port}`)
      }
    }
  }, [merchantSubdomain])

  // Debounced message sender
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sendUpdateMessage = useCallback(
    debounce((sectionsData, themeData) => {
      if (iframeRef.current && iframeRef.current.contentWindow && isReady) {
        iframeRef.current.contentWindow.postMessage({
          type: "preview-update",
          sections: sectionsData,
          themeSettings: themeData
        }, "*")
      }
    }, 300),
    [isReady]
  )

  useEffect(() => {
    if (isReady) {
      sendUpdateMessage(sections, themeSettings)
    }
  }, [sections, themeSettings, isReady, sendUpdateMessage])

  useEffect(() => {
    if (isReady && expandedSectionKey && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: "focus-section",
        sectionKey: expandedSectionKey
      }, "*")
    }
  }, [expandedSectionKey, isReady])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "preview-ready") {
        setIsReady(true)
        // Send initial data immediately upon ready
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: "preview-update",
            sections,
            themeSettings
          }, "*")
        }
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [sections, themeSettings])

  const handleReload = () => {
    setIsReady(false)
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  const iframeSrc = origin ? `${origin}/preview` : ""
  const liveSrc = origin ? `${origin}/` : ""

  const desktopScale = containerWidth > 0 ? Math.min(containerWidth / DESKTOP_WIDTH, 1) : 1
  const isScaled = viewport === "desktop" && desktopScale < 1

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 border rounded-xl overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-white border-b shrink-0">
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
          <Button
            variant={viewport === "mobile" ? "default" : "ghost"}
            size="icon"
            className="w-8 h-8 rounded-md"
            onClick={() => setViewport("mobile")}
            title="Mobile (375px)"
          >
            <SmartphoneIcon className="w-4 h-4" />
          </Button>
          <Button
            variant={viewport === "tablet" ? "default" : "ghost"}
            size="icon"
            className="w-8 h-8 rounded-md"
            onClick={() => setViewport("tablet")}
            title="Tablet (768px)"
          >
            <TabletIcon className="w-4 h-4" />
          </Button>
          <Button
            variant={viewport === "desktop" ? "default" : "ghost"}
            size="icon"
            className="w-8 h-8 rounded-md"
            onClick={() => setViewport("desktop")}
            title="Desktop (1440px)"
          >
            <MonitorIcon className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {onTogglePanel && (
            <Button variant="outline" size="sm" onClick={onTogglePanel} title={isPanelExpanded ? "Hide Settings" : "Show Settings"} className="h-8">
              {isPanelExpanded ? <PanelLeftCloseIcon className="w-4 h-4 mr-2" /> : <PanelLeftOpenIcon className="w-4 h-4 mr-2" />}
              {isPanelExpanded ? "Hide Panel" : "Show Panel"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleReload} title="Reload Preview" className="h-8">
            <RotateCwIcon className="w-4 h-4 mr-2" />
            Reload
          </Button>
          <Button variant="default" size="sm" asChild className="h-8">
            <a href={liveSrc} target="_blank" rel="noreferrer">
              Visit Store
              <ExternalLinkIcon className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 bg-zinc-100/50 flex items-center justify-center p-4 lg:p-8 overflow-hidden relative"
      >
        {!isReady && iframeSrc && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/80 z-10 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-zinc-200 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-zinc-500 font-medium">Loading preview...</p>
            </div>
          </div>
        )}
        
        <div 
          className="bg-white shadow-xl transition-all duration-300 ease-in-out border border-zinc-200 relative overflow-hidden"
          style={{ 
            width: viewport === "desktop" ? "100%" : VIEWPORT_WIDTHS[viewport],
            height: "100%",
            borderRadius: viewport === "desktop" ? "8px" : "32px",
          }}
        >
          <div
            style={{
              width: isScaled ? `${DESKTOP_WIDTH}px` : "100%",
              height: isScaled ? `${100 / desktopScale}%` : "100%",
              transform: isScaled ? `scale(${desktopScale})` : "none",
              transformOrigin: "top left",
            }}
          >
            {iframeSrc && (
              <iframe
                ref={iframeRef}
                src={iframeSrc}
                className="w-full h-full border-0"
                title="Storefront Preview"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
