"use client"

import React from "react"
import { PlusIcon, MinusIcon } from "@/lib/icons";

interface QuantityAdjusterProps {
  quantity: number
  maxQuantity: number
  onChange: (quantity: number) => void
  className?: string
  size?: "sm" | "md" | "lg"
  disabled?: boolean
}

export function QuantityAdjuster({
  quantity,
  maxQuantity,
  onChange,
  className,
  size = "md",
  disabled = false
}: QuantityAdjusterProps) {
  const isSm = size === "sm"
  const isLg = size === "lg"
  
  return (
    <div
      className={`flex items-center bg-[var(--color-surface-secondary)] rounded-[var(--radius-pill)] px-2.5 md:px-4 gap-2.5 md:gap-3 select-none ${
        isSm ? "h-8" : isLg ? "h-11" : "h-9 md:h-10"
      } ${disabled ? "opacity-30 pointer-events-none" : ""} ${className || ""}`}
    >
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        disabled={disabled || quantity <= 1}
        className="p-0.5 text-ink disabled:opacity-30 disabled:pointer-events-none hover:opacity-75 transition-opacity"
        aria-label="Decrease quantity"
      >
        <MinusIcon className="h-4 w-4 stroke-[2.5]" />
      </button>
      
      <span className={`w-6 text-center font-bold text-ink ${isSm ? "text-xs" : "text-sm md:text-base"}`}>
        {quantity}
      </span>

      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={disabled || quantity >= maxQuantity}
        className="p-0.5 text-ink disabled:opacity-30 disabled:pointer-events-none hover:opacity-75 transition-opacity"
        aria-label="Increase quantity"
      >
        <PlusIcon className="h-4 w-4 stroke-[2.5]" />
      </button>
    </div>
  )
}
