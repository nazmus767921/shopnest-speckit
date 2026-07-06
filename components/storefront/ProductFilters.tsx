"use client"

import React, { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Filter, X } from "lucide-react"
import { FilterSidebar } from "./shared/FilterSidebar"

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

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
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

  return (
    <>
      {/* Mobile Filter Toggle Button */}
      <div className="block md:hidden w-full">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-full flex items-center justify-center gap-2 btn-storefront-outline py-3 text-sm"
        >
          <Filter className="h-4 w-4" />
          <span>Filter Products</span>
        </button>
      </div>

      {/* Desktop Sidebar wrapper */}
      <div className="hidden md:block w-64 shrink-0">
        <FilterSidebar
          categories={categories}
          activeCategory={activeCategory}
          activePrice={activePrice}
          activeColor={activeColor}
          activeSize={activeSize}
          onFilterChange={handleFilterChange}
          onClearAll={clearAllFilters}
        />
      </div>

      {/* Mobile overlay / Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in md:hidden flex justify-end">
          <div className="w-[300px] h-full bg-white flex flex-col relative animate-slide-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 text-ink z-10 cursor-pointer border-none"
              aria-label="Close filters"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="overflow-y-auto h-full p-4 pt-12">
              <FilterSidebar
                categories={categories}
                activeCategory={activeCategory}
                activePrice={activePrice}
                activeColor={activeColor}
                activeSize={activeSize}
                onFilterChange={handleFilterChange}
                onClearAll={clearAllFilters}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
