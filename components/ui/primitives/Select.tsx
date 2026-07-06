"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { ChevronDown, Check, Loader2 } from "lucide-react"
import { useDropdownPosition } from "./useDropdownPosition"

export interface SelectProps<T> {
  options: T[]
  value?: T | null
  onChange: (value: T | null) => void
  getOptionLabel?: (option: T) => string
  getOptionValue?: (option: T) => string | number
  renderOption?: (option: T, state: { selected: boolean; active: boolean }) => React.ReactNode
  onSearch?: (query: string) => void
  isLoading?: boolean
  placeholder?: string
  noOptionsMessage?: string
  disabled?: boolean
  className?: string
  error?: string
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  debounceMs?: number
}

export function Select<T>({
  options,
  value = null,
  onChange,
  getOptionLabel = (opt: any) => String(opt?.label || opt?.name || opt),
  getOptionValue = (opt: any) => opt?.value ?? opt?.id ?? opt,
  renderOption,
  onSearch,
  isLoading = false,
  placeholder = "Select option...",
  noOptionsMessage = "No options found.",
  disabled = false,
  className = "",
  error,
  iconLeft,
  iconRight,
  debounceMs = 300,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { flip: dropdownFlip } = useDropdownPosition(triggerRef, isOpen)

  // Schedule debounced onSearch call on open, cancel on close/unmount
  const scheduleSearch = useCallback(() => {
    if (!onSearch) return

    if (debounceMs === 0) {
      onSearch("")
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      onSearch("")
      debounceRef.current = null
    }, debounceMs)
  }, [onSearch, debounceMs])

  const cancelSearch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
  }, [])

  // Reset active index when options change
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(options.length > 0 ? 0 : -1)
    }
  }, [options, isOpen])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Auto-scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement
      if (activeEl && typeof activeEl.scrollIntoView === "function") {
        activeEl.scrollIntoView({ block: "nearest" })
      }
    }
  }, [activeIndex])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => cancelSearch()
  }, [cancelSearch])

  const handleOpen = () => {
    if (disabled) return
    setIsOpen(true)
    setActiveIndex(options.length > 0 ? 0 : -1)
    scheduleSearch()
  }

  const handleClose = () => {
    setIsOpen(false)
    cancelSearch()
    setActiveIndex(-1)
  }

  const handleSelect = (option: T) => {
    onChange(option)
    setIsOpen(false)
    cancelSearch()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        handleOpen()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case "Enter":
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < options.length) {
          handleSelect(options[activeIndex])
        }
        break
      case "Escape":
        e.preventDefault()
        handleClose()
        break
      case "Tab":
        handleClose()
        break
      default:
        break
    }
  }

  const isSelected = (option: T) => {
    if (!value) return false
    return getOptionValue(value) === getOptionValue(option)
  }

  const selectedLabel = value ? getOptionLabel(value) : placeholder

  return (
    <div ref={containerRef} className={`relative w-full text-body-md ${className}`}>
      {/* Select Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? handleClose() : handleOpen())}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between border rounded-md px-3.5 py-2.5 text-left bg-canvas-light transition-all ${
          disabled ? "opacity-50 cursor-not-allowed bg-canvas-cream/30" : "cursor-pointer"
        } ${
          error ? "border-red-500 focus:ring-red-500" : "border-hairline-light focus:outline-none focus:ring-1 focus:ring-emerald-700"
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          {iconLeft && (
            <span className="shrink-0 text-shade-40">{iconLeft}</span>
          )}
          <span className={`truncate ${value ? "text-ink font-medium" : "text-shade-40"}`}>
            {selectedLabel}
          </span>
        </span>
        <div className="flex items-center gap-1 shrink-0 text-shade-40">
          {iconRight && (
            <span className="shrink-0">{iconRight}</span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div
          data-testid="select-dropdown"
          data-flip={dropdownFlip || undefined}
          className={`${dropdownFlip ? "bottom-full mb-1" : "top-full mt-1"} absolute left-0 min-w-full w-max max-w-[calc(100vw-2rem)] border border-hairline-light rounded-lg bg-canvas-light z-50 overflow-hidden flex flex-col max-h-75 animate-fade-in`}
        >
          <div
            ref={listRef}
            className="overflow-y-auto grow py-1 divide-y divide-hairline-light/30 max-h-56"
          >
            {isLoading ? (
              <div className="px-4 py-6 text-caption text-shade-40 text-center flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-800" />
                <span>Loading options...</span>
              </div>
            ) : options.length === 0 ? (
              <div className="px-4 py-3 text-caption text-shade-40 text-center italic">
                {noOptionsMessage}
              </div>
            ) : (
              options.map((option, index) => {
                const selected = isSelected(option)
                const active = index === activeIndex

                return (
                  <div
                    key={index}
                    data-index={index}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`px-4 py-2.5 cursor-pointer text-body-md transition-colors flex items-center justify-between ${
                      active ? "bg-canvas-cream/50 text-ink" : "text-shade-75"
                    } ${selected ? "font-semibold text-emerald-800" : ""}`}
                  >
                    {renderOption ? (
                      renderOption(option, { selected, active })
                    ) : (
                      <span className="truncate">{getOptionLabel(option)}</span>
                    )}

                    {selected && (
                      <Check className="h-4 w-4 text-emerald-800 shrink-0 ml-2" data-testid="select-check-icon" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {error && (
        <span className="text-micro text-red-500 mt-1 block font-medium">
          {error}
        </span>
      )}
    </div>
  )
}
