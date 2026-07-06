"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import { ChevronDown, Check, Search, X, Loader2 } from "lucide-react"
import { useDropdownPosition } from "./useDropdownPosition"

export interface ComboboxProps<T> {
  options: T[]
  value?: T | null
  onChange: (value: T | null) => void
  getOptionLabel?: (option: T) => string
  getOptionValue?: (option: T) => string | number
  searchKeys?: (keyof T)[]
  renderOption?: (option: T, state: { selected: boolean; active: boolean }) => React.ReactNode
  onSearch?: (query: string) => void
  isLoading?: boolean
  placeholder?: string
  searchPlaceholder?: string
  noOptionsMessage?: string
  disabled?: boolean
  className?: string
  error?: string
}

export function Combobox<T>({
  options,
  value = null,
  onChange,
  getOptionLabel = (opt: any) => String(opt?.label || opt?.name || opt),
  getOptionValue = (opt: any) => opt?.value ?? opt?.id ?? opt,
  searchKeys,
  renderOption,
  onSearch,
  isLoading = false,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  noOptionsMessage = "No options found.",
  disabled = false,
  className = "",
  error,
}: ComboboxProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(-1)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { flip: dropdownFlip } = useDropdownPosition(triggerRef, isOpen)

  // Filter options based on query and searchKeys (bypassed if server-side search is enabled)
  const filteredOptions = useMemo(() => {
    if (onSearch) {
      return options
    }

    const query = searchQuery.toLowerCase().trim()
    if (!query) return options

    return options.filter((option) => {
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some((key) => {
          const val = option[key]
          return val ? String(val).toLowerCase().includes(query) : false
        })
      }
      // Fallback to option label
      const label = getOptionLabel(option)
      return label.toLowerCase().includes(query)
    })
  }, [options, searchQuery, searchKeys, getOptionLabel, onSearch])

  // Trigger search callback when search query changes (if async searching is enabled)
  useEffect(() => {
    if (onSearch && isOpen) {
      onSearch(searchQuery)
    }
  }, [searchQuery, onSearch, isOpen])

  // Reset activeIndex when query or open state changes
  useEffect(() => {
    setActiveIndex(filteredOptions.length > 0 ? 0 : -1)
  }, [filteredOptions])

  // Focus input when combobox opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setSearchQuery("")
    }
  }, [isOpen, onSearch])

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
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" })
      }
    }
  }, [activeIndex])

  const handleSelect = (option: T) => {
    onChange(option)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case "Enter":
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          handleSelect(filteredOptions[activeIndex])
        }
        break
      case "Escape":
        e.preventDefault()
        setIsOpen(false)
        break
      case "Tab":
        setIsOpen(false)
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
      {/* Combobox Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between border rounded-md px-3.5 py-2.5 text-left bg-canvas-light transition-all ${
          disabled ? "opacity-50 cursor-not-allowed bg-canvas-cream/30" : "cursor-pointer"
        } ${
          error ? "border-red-500 focus:ring-red-500" : "border-hairline-light focus:outline-none focus:ring-1 focus:ring-emerald-700"
        }`}
      >
        <span className={`truncate ${value ? "text-ink font-medium" : "text-shade-40"}`}>
          {selectedLabel}
        </span>
        <div className="flex items-center gap-1 shrink-0 text-shade-40">
          {value && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
              className="p-0.5 hover:bg-canvas-cream rounded hover:text-ink transition"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Dropdown Options Portal */}
      {isOpen && (
        <div
          data-flip={dropdownFlip || undefined}
          data-testid="combobox-dropdown"
          className={`${dropdownFlip ? "bottom-full mb-1" : "top-full mt-1"} absolute left-0 min-w-full w-max max-w-[calc(100vw-2rem)] border border-hairline-light rounded-lg bg-canvas-light z-50 overflow-hidden flex flex-col max-h-75 animate-fade-in`}
        >
          {/* Search bar inside dropdown */}
          <div className="relative border-b border-hairline-light/60 p-2 shrink-0 bg-canvas-cream/10">
            <span className="absolute inset-y-0 left-4 flex items-center text-shade-40">
              <Search className="h-4 w-4" />
            </span>
            <input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-caption border border-hairline-light rounded px-8 py-2 bg-canvas-light text-ink focus:outline-none focus:ring-1 focus:ring-emerald-700 font-normal"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-4 flex items-center text-shade-40 hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            className="overflow-y-auto grow py-1 divide-y divide-hairline-light/30 max-h-56"
          >
            {isLoading ? (
              <div className="px-4 py-6 text-caption text-shade-40 text-center flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-800" />
                <span>Loading options...</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-caption text-shade-40 text-center italic">
                {noOptionsMessage}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const selected = isSelected(option)
                const active = index === activeIndex

                return (
                  <div
                    key={index}
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
                      <Check className="h-4 w-4 text-emerald-800 shrink-0 ml-2" />
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
