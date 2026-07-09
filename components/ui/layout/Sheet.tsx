"use client"

import React from "react"
import {
  Sheet as ShadcnSheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "../sheet"

export type SheetSide = "top" | "bottom" | "left" | "right" | "smart"

interface SheetProps {
  isOpen: boolean
  onClose: () => void
  side?: SheetSide
  title?: string
  description?: string
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Sheet({
  isOpen,
  onClose,
  side = "smart",
  title,
  description,
  footer,
  children,
  className = "",
}: SheetProps) {
  let shadcnSide: "top" | "bottom" | "left" | "right" = "right"
  if (side === "top") shadcnSide = "top"
  else if (side === "bottom") shadcnSide = "bottom"
  else if (side === "left") shadcnSide = "left"
  else if (side === "right") shadcnSide = "right"
  else if (side === "smart") shadcnSide = "right"

  return (
    <ShadcnSheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side={shadcnSide} className={className}>
        {(title || description) && (
          <SheetHeader>
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}
        <div className="py-6 flex-1 overflow-y-auto">
          {children}
        </div>
        {footer && <SheetFooter>{footer}</SheetFooter>}
      </SheetContent>
    </ShadcnSheet>
  )
}
