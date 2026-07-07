"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, ChevronUp, Filter, X, Search } from "lucide-react"

interface Category {
  id: string
  name: string
}

interface FashionProductFiltersProps {
  categories: Category[]
  activeCategory: string | null
  activePrice: string | null
  activeColor: string | null
  activeSize: string | null
}

const colorOptions = [
  { name: "Green", value: "green", hex: "#00FF00" },
  { name: "Blue", value: "blue", hex: "#0000FF" },
  { name: "Red", value: "red", hex: "#FF0000" },
  { name: "Yellow", value: "yellow", hex: "#FFFF00" },
  { name: "Orange", value: "orange", hex: "#FFA500" },
  { name: "Black", value: "black", hex: "#000000" },
  { name: "White", value: "white", hex: "#FFFFFF" },
]

const sizeOptions = ["S", "M", "L", "XL", "XXL"]

const priceOptions = [
  { label: "All Prices", value: "" },
  { label: "Under ৳1,000", value: "under-1000" },
  { label: "৳1,000 - ৳2,000", value: "1000-2000" },
  { label: "৳2,000 - ৳5,000", value: "2000-5000" },
  { label: "Over ৳5,000", value: "over-5000" },
]

export function FashionProductFilters({
  categories,
  activeCategory,
  activePrice,
  activeColor,
  activeSize,
}: FashionProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")
  const [mobileSections, setMobileSections] = useState({
    categories: true,
    price: false,
    colors: false,
    sizes: false,
  })

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveDropdown(null)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set("page", "1")
    router.push(`?${params.toString()}`)
    setActiveDropdown(null)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams()
    const search = searchParams.get("search")
    if (search) params.set("search", search)
    router.push(`?${params.toString()}`)
    setDrawerOpen(false)
    setActiveDropdown(null)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchValue.trim()) {
      params.set("search", searchValue.trim())
    } else {
      params.delete("search")
    }
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  const getCategoryLabel = () => {
    if (!activeCategory) return "Category"
    const cat = categories.find(c => c.id === activeCategory)
    return cat ? `Category: ${cat.name}` : "Category"
  }

  const getPriceLabel = () => {
    if (!activePrice) return "Price"
    const opt = priceOptions.find(p => p.value === activePrice)
    return opt ? `Price: ${opt.label}` : "Price"
  }

  const getColorLabel = () => {
    if (!activeColor) return "Color"
    const opt = colorOptions.find(c => c.value === activeColor)
    return opt ? `Color: ${opt.name}` : "Color"
  }

  const getSizeLabel = () => {
    if (!activeSize) return "Size"
    return `Size: ${activeSize}`
  }

  const hasActiveFilters = !!(activeCategory || activePrice || activeColor || activeSize)

  const toggleMobileSection = (sec: keyof typeof mobileSections) => {
    setMobileSections(prev => ({ ...prev, [sec]: !prev[sec] }))
  }

  return (
    <div className="w-full flex flex-col gap-6" ref={containerRef}>
      {/* Search and Horizontal Filters Row */}
      <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-y border-[var(--color-hairline-warm)] py-4 select-none relative z-40">
        
        {/* Left Side: Filter Dropdowns (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Category Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "category" ? null : "category")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-sans uppercase tracking-[0.1em] transition-colors cursor-pointer bg-white ${
                activeCategory 
                  ? "border-black text-black bg-zinc-50 font-medium" 
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
              }`}
              aria-expanded={activeDropdown === "category"}
              aria-haspopup="true"
            >
              <span>{getCategoryLabel()}</span>
              {activeDropdown === "category" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {activeDropdown === "category" && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-zinc-200 rounded-xl p-3 min-w-[200px] max-h-[300px] overflow-y-auto flex flex-col gap-1.5 z-50">
                <button
                  onClick={() => handleFilterChange("category", "")}
                  className={`text-left text-xs font-sans py-1.5 px-2.5 rounded hover:bg-zinc-50 transition-colors border-none bg-transparent cursor-pointer ${
                    !activeCategory ? "font-bold text-black" : "text-zinc-500"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleFilterChange("category", cat.id)}
                    className={`text-left text-xs font-sans py-1.5 px-2.5 rounded hover:bg-zinc-50 transition-colors border-none bg-transparent cursor-pointer ${
                      activeCategory === cat.id ? "font-bold text-black" : "text-zinc-500"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "price" ? null : "price")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-sans uppercase tracking-[0.1em] transition-colors cursor-pointer bg-white ${
                activePrice 
                  ? "border-black text-black bg-zinc-50 font-medium" 
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
              }`}
              aria-expanded={activeDropdown === "price"}
              aria-haspopup="true"
            >
              <span>{getPriceLabel()}</span>
              {activeDropdown === "price" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {activeDropdown === "price" && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-zinc-200 rounded-xl p-3 min-w-[200px] max-h-[300px] overflow-y-auto flex flex-col gap-1.5 z-50">
                {priceOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleFilterChange("price", opt.value)}
                    className={`text-left text-xs font-sans py-1.5 px-2.5 rounded hover:bg-zinc-50 transition-colors border-none bg-transparent cursor-pointer ${
                      (activePrice || "") === opt.value ? "font-bold text-black" : "text-zinc-500"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Color Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "color" ? null : "color")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-sans uppercase tracking-[0.1em] transition-colors cursor-pointer bg-white ${
                activeColor 
                  ? "border-black text-black bg-zinc-50 font-medium" 
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
              }`}
              aria-expanded={activeDropdown === "color"}
              aria-haspopup="true"
            >
              <span>{getColorLabel()}</span>
              {activeDropdown === "color" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {activeDropdown === "color" && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-zinc-200 rounded-xl p-4 min-w-[240px] z-50 flex flex-wrap gap-2.5">
                {colorOptions.map((color) => {
                  const isActive = activeColor === color.value
                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleFilterChange("color", isActive ? "" : color.value)}
                      className={`h-7 w-7 rounded-full border relative transition-transform cursor-pointer shrink-0 ${
                        isActive ? "scale-110 border-black ring-1 ring-black" : "border-zinc-200 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                      aria-label={`Color ${color.name}`}
                      aria-selected={isActive}
                    >
                      {isActive && (
                        <span className="absolute inset-0 flex items-center justify-center text-white mix-blend-difference font-bold text-[9px]">
                          ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Size Dropdown */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === "size" ? null : "size")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-sans uppercase tracking-[0.1em] transition-colors cursor-pointer bg-white ${
                activeSize 
                  ? "border-black text-black bg-zinc-50 font-medium" 
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
              }`}
              aria-expanded={activeDropdown === "size"}
              aria-haspopup="true"
            >
              <span>{getSizeLabel()}</span>
              {activeDropdown === "size" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {activeDropdown === "size" && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-zinc-200 rounded-xl p-3 min-w-[200px] z-50 grid grid-cols-3 gap-2">
                {sizeOptions.map((size) => {
                  const isActive = activeSize === size
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleFilterChange("size", isActive ? "" : size)}
                      className={`rounded-lg py-2.5 text-center text-xs font-semibold border transition-all cursor-pointer ${
                        isActive
                          ? "bg-black text-white border-black"
                          : "border-zinc-200 bg-zinc-50 text-black hover:border-zinc-400"
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Clear All Link */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-zinc-400 hover:text-black font-sans uppercase tracking-[0.1em] underline cursor-pointer border-none bg-transparent ml-2"
              aria-label="Clear all active filters"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Mobile Filter Trigger Button */}
        <div className="block md:hidden w-full">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full flex items-center justify-center gap-2 border border-zinc-200 py-3.5 text-xs uppercase tracking-[0.2em] font-sans font-medium rounded-full bg-white text-black hover:border-black transition-colors"
            aria-label="Open Filter Panel"
          >
            <Filter className="h-4 w-4 stroke-[1.5]" />
            <span>Filter By</span>
            {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-black ml-1" />}
          </button>
        </div>

        {/* Right Side: Search Input Bar (Minimal Form) */}
        <form onSubmit={handleSearchSubmit} className="w-full md:max-w-xs relative" role="search">
          <input
            type="text"
            placeholder="Search products..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-transparent text-ink border-b border-zinc-200 focus:border-black py-2.5 pl-2 pr-8 text-xs font-sans outline-none transition-colors"
            aria-label="Search catalog products"
          />
          <button
            type="submit"
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:text-black text-zinc-400 cursor-pointer border-none bg-transparent"
            aria-label="Submit search query"
          >
            <Search className="h-4 w-4 stroke-[1.5]" />
          </button>
        </form>
      </div>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/45 z-100 animate-fade-in md:hidden flex justify-end">
          <div className="w-[320px] h-full bg-[var(--color-canvas-warm)] flex flex-col justify-between relative shadow-2xl animate-slide-up duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-zinc-200/60 p-5 shrink-0 bg-white">
              <span className="font-sans text-xs uppercase tracking-[0.2em] font-bold text-ink">Filters</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded hover:bg-zinc-100 text-ink cursor-pointer border-none bg-transparent"
                aria-label="Close Filter Panel"
              >
                <X className="h-5 w-5 stroke-[1.2]" />
              </button>
            </div>

            {/* Drawer Body (Vertical Accordions) */}
            <div className="overflow-y-auto grow p-5 flex flex-col gap-6 select-none">
              
              {/* Category Section */}
              <div className="border-b border-zinc-200/60 pb-4">
                <button
                  onClick={() => toggleMobileSection("categories")}
                  className="flex items-center justify-between w-full text-xs font-bold font-sans uppercase tracking-[0.1em] text-ink cursor-pointer border-none bg-transparent py-2"
                >
                  <span>Category</span>
                  {mobileSections.categories ? <ChevronUp className="h-4 w-4 stroke-[1.5]" /> : <ChevronDown className="h-4 w-4 stroke-[1.5]" />}
                </button>
                {mobileSections.categories && (
                  <div className="flex flex-col gap-2.5 pt-2 pl-1.5">
                    <button
                      onClick={() => handleFilterChange("category", "")}
                      className={`text-left text-xs font-sans py-1.5 transition-colors border-none bg-transparent cursor-pointer ${
                        !activeCategory ? "text-black font-bold" : "text-zinc-500"
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleFilterChange("category", cat.id)}
                        className={`text-left text-xs font-sans py-1.5 transition-colors border-none bg-transparent cursor-pointer ${
                          activeCategory === cat.id ? "text-black font-bold" : "text-zinc-500"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Section */}
              <div className="border-b border-zinc-200/60 pb-4">
                <button
                  onClick={() => toggleMobileSection("price")}
                  className="flex items-center justify-between w-full text-xs font-bold font-sans uppercase tracking-[0.1em] text-ink cursor-pointer border-none bg-transparent py-2"
                >
                  <span>Price Range</span>
                  {mobileSections.price ? <ChevronUp className="h-4 w-4 stroke-[1.5]" /> : <ChevronDown className="h-4 w-4 stroke-[1.5]" />}
                </button>
                {mobileSections.price && (
                  <div className="flex flex-col gap-2.5 pt-2 pl-1.5">
                    {priceOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleFilterChange("price", opt.value)}
                        className={`text-left text-xs font-sans py-1.5 transition-colors border-none bg-transparent cursor-pointer ${
                          (activePrice || "") === opt.value ? "text-black font-bold" : "text-zinc-500"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Color Section */}
              <div className="border-b border-zinc-200/60 pb-4">
                <button
                  onClick={() => toggleMobileSection("colors")}
                  className="flex items-center justify-between w-full text-xs font-bold font-sans uppercase tracking-[0.1em] text-ink cursor-pointer border-none bg-transparent py-2"
                >
                  <span>Color</span>
                  {mobileSections.colors ? <ChevronUp className="h-4 w-4 stroke-[1.5]" /> : <ChevronDown className="h-4 w-4 stroke-[1.5]" />}
                </button>
                {mobileSections.colors && (
                  <div className="flex flex-wrap gap-3 pt-3 pl-1">
                    {colorOptions.map((color) => {
                      const isActive = activeColor === color.value
                      return (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => handleFilterChange("color", isActive ? "" : color.value)}
                          className={`h-8 w-8 rounded-full border relative transition-transform cursor-pointer shrink-0 ${
                            isActive ? "scale-110 border-black ring-1 ring-black" : "border-zinc-200"
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                          aria-label={`Color ${color.name}`}
                          aria-selected={isActive}
                        >
                          {isActive && (
                            <span className="absolute inset-0 flex items-center justify-center text-white mix-blend-difference font-bold text-xs">
                              ✓
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Size Section */}
              <div className="border-b border-zinc-200/60 pb-4">
                <button
                  onClick={() => toggleMobileSection("sizes")}
                  className="flex items-center justify-between w-full text-xs font-bold font-sans uppercase tracking-[0.1em] text-ink cursor-pointer border-none bg-transparent py-2"
                >
                  <span>Size</span>
                  {mobileSections.sizes ? <ChevronUp className="h-4 w-4 stroke-[1.5]" /> : <ChevronDown className="h-4 w-4 stroke-[1.5]" />}
                </button>
                {mobileSections.sizes && (
                  <div className="grid grid-cols-4 gap-2 pt-3 pl-1">
                    {sizeOptions.map((size) => {
                      const isActive = activeSize === size
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleFilterChange("size", isActive ? "" : size)}
                          className={`rounded-lg py-2.5 text-center text-xs font-semibold border transition-all cursor-pointer ${
                            isActive
                              ? "bg-black text-white border-black"
                              : "border-zinc-200 bg-white text-black"
                          }`}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-zinc-200/60 flex flex-col gap-3 bg-white shrink-0">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full py-4 text-xs font-semibold font-sans uppercase tracking-[0.2em] bg-black text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer border-none"
              >
                Apply Filters
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="w-full py-2.5 text-xs font-semibold font-sans uppercase tracking-[0.1em] text-zinc-500 hover:text-black transition-colors cursor-pointer border-none bg-transparent"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
