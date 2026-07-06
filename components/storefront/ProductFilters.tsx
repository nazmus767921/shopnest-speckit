"use client"

import React, { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react"

interface Category {
  id: string
  name: string
}

interface ProductFiltersProps {
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

export function ProductFilters({
  categories,
  activeCategory,
  activePrice,
  activeColor,
  activeSize,
}: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sections, setSections] = useState({
    categories: true,
    price: true,
    colors: true,
    sizes: true,
  })

  const toggleSection = (section: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset page to 1 on filter change
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams()
    const search = searchParams.get("search")
    if (search) params.set("search", search)
    router.push(`?${params.toString()}`)
    setMobileOpen(false)
  }

  const renderFiltersContent = () => (
    <div className="flex flex-col gap-6 bg-white p-6 rounded-md border border-hairline-light w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline-light pb-4">
        <div className="flex items-center gap-2 text-ink">
          <Filter className="h-5 w-5 stroke-[2]" />
          <h3 className="text-storefront-heading-sm font-bold uppercase tracking-wider">Filters</h3>
        </div>
        <button
          onClick={clearAllFilters}
          className="text-storefront-caption text-shade-40 hover:text-ink underline cursor-pointer"
        >
          Clear All
        </button>
      </div>

      {/* 1. Categories Accordion */}
      <div className="flex flex-col border-b border-hairline-light pb-4">
        <button
          onClick={() => toggleSection("categories")}
          className="flex items-center justify-between w-full text-storefront-body-strong font-bold text-ink uppercase tracking-wider mb-3 cursor-pointer"
        >
          <span>Categories</span>
          {sections.categories ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {sections.categories && (
          <div className="flex flex-col gap-2 pl-1">
            <button
              onClick={() => handleFilterChange("category", "")}
              className={`text-left text-storefront-body-md py-1 transition-all cursor-pointer ${
                !activeCategory ? "text-ink font-bold" : "text-shade-40 hover:text-ink"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleFilterChange("category", cat.id)}
                className={`text-left text-storefront-body-md py-1 transition-all cursor-pointer ${
                  activeCategory === cat.id ? "text-ink font-bold" : "text-shade-40 hover:text-ink"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Price Accordion */}
      <div className="flex flex-col border-b border-hairline-light pb-4">
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full text-storefront-body-strong font-bold text-ink uppercase tracking-wider mb-3 cursor-pointer"
        >
          <span>Price Range</span>
          {sections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {sections.price && (
          <div className="flex flex-col gap-2 pl-1">
            {priceOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleFilterChange("price", opt.value)}
                className={`text-left text-storefront-body-md py-1 transition-all cursor-pointer ${
                  (activePrice || "") === opt.value ? "text-ink font-bold" : "text-shade-40 hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Colors Accordion */}
      <div className="flex flex-col border-b border-hairline-light pb-4">
        <button
          onClick={() => toggleSection("colors")}
          className="flex items-center justify-between w-full text-storefront-body-strong font-bold text-ink uppercase tracking-wider mb-3 cursor-pointer"
        >
          <span>Colors</span>
          {sections.colors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {sections.colors && (
          <div className="flex flex-wrap gap-2.5 pt-1 pl-1">
            {colorOptions.map((color) => {
              const isActive = activeColor === color.value
              return (
                <button
                  key={color.value}
                  onClick={() => handleFilterChange("color", isActive ? "" : color.value)}
                  className={`h-7 w-7 rounded-full border relative transition-transform cursor-pointer ${
                    isActive ? "scale-110 border-black" : "border-hairline-light hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {isActive && (
                    <span className="absolute inset-0 flex items-center justify-center text-white mix-blend-difference font-bold text-[10px]">
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. Sizes Accordion */}
      <div className="flex flex-col pb-2">
        <button
          onClick={() => toggleSection("sizes")}
          className="flex items-center justify-between w-full text-storefront-body-strong font-bold text-ink uppercase tracking-wider mb-3 cursor-pointer"
        >
          <span>Sizes</span>
          {sections.sizes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {sections.sizes && (
          <div className="grid grid-cols-3 gap-2 pt-1 pl-1">
            {sizeOptions.map((size) => {
              const isActive = activeSize === size
              return (
                <button
                  key={size}
                  onClick={() => handleFilterChange("size", isActive ? "" : size)}
                  className={`rounded-md py-2 text-center text-xs font-semibold border transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-on-primary border-primary"
                      : "border-hairline-light bg-zinc-50 text-ink hover:border-shade-40"
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
  )

  return (
    <>
      {/* Mobile Filter Toggle Button */}
      <div className="block md:hidden w-full">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-full flex items-center justify-center gap-2 btn-storefront-outline py-3 text-sm rounded-md"
        >
          <Filter className="h-4 w-4" />
          <span>Filter Products</span>
        </button>
      </div>

      {/* Desktop Sidebar wrapper */}
      <div className="hidden md:block w-64 shrink-0">
        {renderFiltersContent()}
      </div>

      {/* Mobile overlay / Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in md:hidden flex justify-end">
          <div className="w-[300px] h-full bg-white flex flex-col relative animate-slide-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 text-ink z-10 cursor-pointer"
              aria-label="Close filters"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="overflow-y-auto h-full p-4 pt-12">
              {renderFiltersContent()}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
