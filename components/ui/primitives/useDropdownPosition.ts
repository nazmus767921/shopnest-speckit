"use client"

import { useState, useLayoutEffect } from "react"

export interface DropdownPosition {
  /** Whether the dropdown should flip upward (true = above trigger, false = below trigger) */
  flip: boolean
}

const ESTIMATED_DROPDOWN_HEIGHT = 260 // max-h-56 (224px) + borders + padding

/**
 * Shared hook for collision-aware dropdown flip detection.
 *
 * When opened, checks if there is enough space below the trigger.
 * If not, sets `flip = true` so the calling component can render
 * the dropdown upward instead.
 *
 * Positioning itself is handled via CSS (`absolute top-full / bottom-full`)
 * so the dropdown scrolls naturally with the page.
 */
export function useDropdownPosition(
  triggerRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
): DropdownPosition {
  const [flip, setFlip] = useState(false)

  useLayoutEffect(() => {
    if (!isOpen) {
      setFlip(false)
      return
    }

    const triggerEl = triggerRef.current
    if (!triggerEl) return

    const rect = triggerEl.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    setFlip(spaceBelow < ESTIMATED_DROPDOWN_HEIGHT)
  }, [isOpen, triggerRef])

  return { flip }
}
