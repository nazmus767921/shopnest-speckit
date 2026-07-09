"use client"

import React from "react"
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select"

export interface SelectProps<T> {
  options: T[]
  value?: T | null
  onChange: (value: T | null) => void
  getOptionLabel?: (option: T) => string
  getOptionValue?: (option: T) => string | number
  renderOption?: (option: T, state: { selected: boolean; active: boolean }) => React.ReactNode
  isLoading?: boolean
  placeholder?: string
  noOptionsMessage?: string
  disabled?: boolean
  className?: string
  error?: string
}

export function Select<T>({
  options,
  value = null,
  onChange,
  getOptionLabel = (opt: any) => String(opt?.label || opt?.name || opt),
  getOptionValue = (opt: any) => opt?.value ?? opt?.id ?? opt,
  renderOption,
  isLoading = false,
  placeholder = "Select option...",
  noOptionsMessage = "No options found.",
  disabled = false,
  className = "",
  error,
}: SelectProps<T>) {
  const selectedVal = value ? String(getOptionValue(value)) : undefined

  return (
    <div className={`relative w-full ${className}`}>
      <ShadcnSelect
        disabled={disabled}
        value={selectedVal}
        onValueChange={(valStr) => {
          const opt = options.find((o) => String(getOptionValue(o)) === valStr)
          onChange(opt || null)
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {value ? getOptionLabel(value) : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              {noOptionsMessage}
            </div>
          ) : (
            options.map((option, idx) => {
              const valStr = String(getOptionValue(option))
              const label = getOptionLabel(option)
              return (
                <SelectItem key={idx} value={valStr}>
                  {renderOption ? renderOption(option, { selected: value === option, active: false }) : label}
                </SelectItem>
              )
            })
          )}
        </SelectContent>
      </ShadcnSelect>
      {error && (
        <span className="text-xs text-destructive mt-1 block font-medium">
          {error}
        </span>
      )}
    </div>
  )
}
