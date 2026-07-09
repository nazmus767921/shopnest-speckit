"use client"

import React, { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Filter, X } from "lucide-react"
import { FilterSidebar } from "./shared/FilterSidebar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

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

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filter Products</SheetTitle>
          </SheetHeader>
          <div className="px-2 py-4">
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
        </SheetContent>
      </Sheet>
    </>
  )
}
