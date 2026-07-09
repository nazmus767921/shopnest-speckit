"use client"

import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

export type SheetSide = "top" | "bottom" | "left" | "right" | "smart"

interface SheetProps {
  isOpen: boolean
  onClose: () => void
  side?: SheetSide
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function Sheet({
  isOpen,
  onClose,
  side = "smart",
  title,
  description,
  children,
  className = "",
}: SheetProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  // Determine classes based on side
  let containerClasses = ""
  let contentClasses = ""

  switch (side) {
    case "top":
      containerClasses = "items-start justify-center"
      contentClasses = "w-full max-h-[90dvh] rounded-b-2xl animate-slide-down"
      break
    case "bottom":
      containerClasses = "items-end justify-center"
      contentClasses = "w-full max-h-[90dvh] rounded-t-2xl animate-slide-up pb-[calc(env(safe-area-inset-bottom)+1rem)]"
      break
    case "left":
      containerClasses = "items-center justify-start"
      contentClasses = "h-full w-full max-w-sm rounded-r-2xl animate-slide-right pb-[env(safe-area-inset-bottom)]"
      break
    case "right":
      containerClasses = "items-center justify-end"
      contentClasses = "h-full w-full max-w-sm rounded-l-2xl animate-slide-left pb-[env(safe-area-inset-bottom)]"
      break
    case "smart":
    default:
      // Mobile: bottom sheet, Desktop (sm+): right side panel
      containerClasses = "items-end sm:items-center sm:justify-end"
      contentClasses = "w-full max-h-[90dvh] rounded-t-2xl animate-slide-up pb-[calc(env(safe-area-inset-bottom)+1rem)] " +
                       "sm:h-full sm:max-w-sm sm:max-h-full sm:rounded-none sm:rounded-l-2xl sm:animate-slide-left sm:pb-[env(safe-area-inset-bottom)]"
      break
  }

  return createPortal(
    <div 
      className={`fixed inset-0 z-[100] flex bg-black/40 backdrop-blur-xs select-text animate-fade-in ${containerClasses}`}
      onClick={onClose}
    >
      <div
        className={`bg-canvas-light border border-hairline-light flex flex-col relative select-text shadow-xl overflow-hidden ${contentClasses} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header section (fixed at top of sheet) */}
        {(title || description) && (
          <div className="flex flex-col gap-1.5 p-6 pr-12 border-b border-hairline-light shrink-0">
            {title && (
              <h2 className="font-display text-heading-md font-semibold text-ink leading-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-caption text-shade-50 font-light leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-shade-40 hover:text-ink hover:bg-shade-30/10 cursor-pointer transition-colors z-10"
          aria-label="Close sheet"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
