"use client"

import React, { useEffect } from "react"
import { Button, Card } from "@/components/ui"
import { X, Loader2 } from "lucide-react"

interface AlertDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "primary" | "danger" | "emerald"
  isPending?: boolean
}

export function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  isPending = false,
}: AlertDialogProps) {
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
      if (e.key === "Escape" && isOpen && !isPending) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose, isPending])

  if (!isOpen) return null

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case "danger":
        return "bg-rose-800 hover:bg-rose-700 active:bg-rose-900 border-none text-white cursor-pointer"
      case "emerald":
        return "bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 border-none text-white cursor-pointer"
      case "primary":
      default:
        return "bg-primary text-on-primary hover:bg-shade-70 cursor-pointer"
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-text"
      onClick={(e) => {
        if (!isPending) onClose()
      }}
    >
      <Card
        className="w-full max-w-md bg-canvas-light border border-hairline-light p-6 flex flex-col gap-6 relative select-text animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {!isPending && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-shade-40 hover:text-ink hover:bg-shade-30/10 cursor-pointer transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        )}

        {/* Content */}
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-heading-md font-semibold text-ink leading-tight">
            {title}
          </h2>
          <p className="text-caption text-shade-50 font-light leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-2">
          <Button
            variant="outline-light"
            size="sm"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 min-h-10 text-caption cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onConfirm}
            disabled={isPending}
            className={`px-4 py-2 min-h-10 text-caption flex items-center gap-1.5 ${getConfirmButtonClasses()}`}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            <span>{confirmText}</span>
          </Button>
        </div>
      </Card>
    </div>
  )
}
