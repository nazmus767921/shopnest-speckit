"use client"

import { forwardRef, useEffect } from "react"
import { SectionType } from "./VisualEditor"

interface LivePreviewIframeProps {
  previewUrl: string
  initialLayout: SectionType[]
}

const LivePreviewIframe = forwardRef<HTMLIFrameElement, LivePreviewIframeProps>(
  ({ previewUrl, initialLayout }, ref) => {
    
    // When the iframe loads, send the initial layout to it.
    const handleLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
      const iframe = e.currentTarget
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'UPDATE_LAYOUT', layout: initialLayout }, '*')
      }
    }

    if (!previewUrl) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-white rounded-lg border shadow-sm text-muted-foreground">
          Preview URL not available. Ensure merchant subdomain is set.
        </div>
      )
    }

    return (
      <div className="w-full h-full bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col">
        <div className="bg-slate-100 border-b p-2 flex items-center gap-2">
          <div className="flex gap-1.5 ml-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="bg-white rounded-md px-3 py-1 text-xs text-slate-500 mx-auto flex-1 max-w-md text-center truncate shadow-sm">
            {previewUrl}
          </div>
        </div>
        <iframe
          ref={ref}
          src={previewUrl}
          className="w-full flex-1"
          onLoad={handleLoad}
          title="Live Preview"
        />
      </div>
    )
  }
)

LivePreviewIframe.displayName = "LivePreviewIframe"
export default LivePreviewIframe
