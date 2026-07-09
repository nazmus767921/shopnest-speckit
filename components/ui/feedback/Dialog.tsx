"use client"

import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Card } from "@/components/ui"
import { X } from "lucide-react"

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
}: DialogProps) {
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

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs select-text animate-fade-in pb-[calc(env(safe-area-inset-bottom)+1rem)]"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md bg-canvas-light border border-hairline-light p-6 flex flex-col gap-5 relative select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-shade-40 hover:text-ink hover:bg-shade-30/10 cursor-pointer transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Header */}
        <div className="flex flex-col gap-1.5 pr-6">
          <h2 className="font-display text-heading-md font-semibold text-ink leading-tight">
            {title}
          </h2>
          {description && (
            <p className="text-caption text-shade-50 font-light leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4">
          {children}
        </div>
      </Card>
    </div>,
    document.body
  )
}
