"use client"

import React from "react"
import {
  VariantPicker,
  type VariantOption as SharedVariantOption,
  type AttributeInfo as SharedAttributeInfo
} from "../shared/VariantPicker"

// Re-export type definitions to maintain backward compatibility with imports and test suites
export type VariantOption = SharedVariantOption
export type AttributeInfo = SharedAttributeInfo

interface VariantSelectorProps {
  attributes: AttributeInfo[]
  variants: VariantOption[]
  basePricePaisa: number
  onVariantSelect: (variant: VariantOption | null) => void
  disabled?: boolean
}

export function VariantSelector({
  attributes,
  variants,
  basePricePaisa,
  onVariantSelect,
  disabled = false
}: VariantSelectorProps) {
  return (
    <VariantPicker
      attributes={attributes}
      variants={variants}
      basePricePaisa={basePricePaisa}
      onVariantSelect={onVariantSelect}
      disabled={disabled}
      swatchShape="circle"
      swatchSizeClassName="h-10 w-10"
      pillRadiusClassName="rounded-full"
    />
  )
}
