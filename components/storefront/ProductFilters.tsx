"use client"

import React, { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FilterIcon, XIcon } from "@/lib/icons";

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
      {/* Mobile FilterIcon Toggle Button */}
      <div className="block md:hidden w-full">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-full flex items-center justify-center gap-2 btn-storefront-outline py-3 text-sm"
        >
          <FilterIcon className="h-4 w-4" />
          <span>FilterIcon Products</span>
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
          isMobile={false}
        />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-xl px-0 py-0 flex flex-col">
          <SheetHeader className="px-6 py-4 border-b border-zinc-200">
            <SheetTitle className="text-center">Filter Products</SheetTitle>
          </SheetHeader>
          <div className="flex-grow overflow-y-auto bg-[var(--color-canvas-warm)]">
            <FilterSidebar
              categories={categories}
              activeCategory={activeCategory}
              activePrice={activePrice}
              activeColor={activeColor}
              activeSize={activeSize}
              onFilterChange={handleFilterChange}
              onClearAll={clearAllFilters}
              isMobile={true}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
