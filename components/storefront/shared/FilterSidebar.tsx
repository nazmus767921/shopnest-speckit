"use client"

import React, { useState } from "react"
import { ChevronDownIcon, ChevronUpIcon, FilterIcon } from "@/lib/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface Category {
  id: string
  name: string
  parentId?: string | null
}

interface FilterSidebarProps {
  categories: Category[]
  activeCategory: string | null
  activePrice: string | null
  activeColor: string | null
  activeSize: string | null
  onFilterChange: (key: string, value: string) => void
  onClearAll: () => void
  className?: string
  isMobile?: boolean
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

export function FilterSidebar({
  categories,
  activeCategory,
  activePrice,
  activeColor,
  activeSize,
  onFilterChange,
  onClearAll,
  className = "",
  isMobile = false
}: FilterSidebarProps) {
  const parentCategories = categories.filter((c) => !c.parentId)
  const childrenByParentId = categories.reduce((acc, cat) => {
    if (cat.parentId) {
      if (!acc[cat.parentId]) acc[cat.parentId] = []
      acc[cat.parentId].push(cat)
    }
    return acc
  }, {} as Record<string, Category[]>)

  const [sections, setSections] = useState({
    categories: true,
    price: true,
    colors: true,
    sizes: true,
  })

  const [activeMobileView, setActiveMobileView] = useState<string | null>(null)

  const getCategoryFullName = React.useCallback((categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return "";
    if (cat.parentId) {
      const parent = categories.find(c => c.id === cat.parentId);
      if (parent) return `${parent.name} • ${cat.name}`;
    }
    return cat.name;
  }, [categories]);

  const toggleSection = (section: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className={`flex flex-col gap-6 bg-[var(--color-canvas-light)] p-6 rounded-[var(--radius-lg)] border border-[var(--color-hairline-light)] w-full h-full overflow-y-auto ${className}`}>
      {isMobile && activeMobileView ? (
        <>
          {/* Drill-down Header */}
          <div className="flex items-center gap-2 border-b border-[var(--color-hairline-light)] pb-4">
            <button onClick={() => setActiveMobileView(null)} className="text-storefront-body-md text-[var(--color-shade-40)] hover:text-[var(--color-ink)] cursor-pointer border-none bg-transparent">
              {"< Back"}
            </button>
            <h3 className="text-storefront-heading-sm font-bold uppercase tracking-wider mx-auto pr-10">
              {categories.find(c => c.id === activeMobileView)?.name || "Subcategories"}
            </h3>
          </div>
          {/* Drill-down Content */}
          <div className="flex flex-col gap-2 pl-2">
            <button
              onClick={() => onFilterChange("category", activeMobileView)}
              className={`text-left text-storefront-body-md py-3 transition-all cursor-pointer border-b border-[var(--color-hairline-light)] bg-transparent flex items-center justify-between ${
                activeCategory === activeMobileView ? "text-[var(--color-ink)] font-bold" : "text-[var(--color-shade-40)] hover:text-[var(--color-ink)]"
              }`}
            >
              <span>All {categories.find(c => c.id === activeMobileView)?.name}</span>
              {activeCategory === activeMobileView && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink)]"></span>}
            </button>
            {(childrenByParentId[activeMobileView] || []).map((child) => (
              <button
                key={child.id}
                onClick={() => onFilterChange("category", child.id)}
                className={`text-left text-storefront-body-md py-3 transition-all cursor-pointer border-b border-[var(--color-hairline-light)] bg-transparent flex items-center justify-between ${
                  activeCategory === child.id ? "text-[var(--color-ink)] font-bold" : "text-[var(--color-shade-40)] hover:text-[var(--color-ink)]"
                }`}
              >
                <span>{child.name}</span>
                {activeCategory === child.id && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ink)]"></span>}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--color-hairline-light)] pb-4">
            <div className="flex items-center gap-2 text-[var(--color-ink)]">
              <FilterIcon className="h-5 w-5 stroke-[2]" />
              <h3 className="text-storefront-heading-sm font-bold uppercase tracking-wider">Filters</h3>
            </div>
            <button
              onClick={onClearAll}
              className="text-storefront-caption text-[var(--color-shade-40)] hover:text-[var(--color-ink)] underline cursor-pointer border-none bg-transparent"
            >
              Clear All
            </button>
          </div>

      {/* 1. Categories Accordion */}
      <div className="flex flex-col border-b border-[var(--color-hairline-light)] pb-4">
        <button
          type="button"
          onClick={() => toggleSection("categories")}
          className="flex items-center justify-between w-full text-storefront-body-strong font-bold text-[var(--color-ink)] uppercase tracking-wider mb-3 cursor-pointer border-none bg-transparent"
        >
          <span>Categories</span>
          {sections.categories ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
        </button>
        {sections.categories && (
          <div className="flex flex-col gap-2 pl-1">
            <button
              onClick={() => onFilterChange("category", "")}
              className={`text-left text-storefront-body-md py-1 transition-all cursor-pointer border-none bg-transparent ${
                !activeCategory ? "text-[var(--color-ink)] font-bold" : "text-[var(--color-shade-40)] hover:text-[var(--color-ink)]"
              }`}
            >
              All Categories
            </button>
            {isMobile ? (
              <>
                {parentCategories.map((parent) => {
                  const children = childrenByParentId[parent.id] || []
                  if (children.length > 0) {
                    return (
                      <button
                        key={parent.id}
                        onClick={() => setActiveMobileView(parent.id)}
                        className={`flex items-center justify-between text-left text-storefront-body-md py-2 transition-all cursor-pointer border-none bg-transparent w-full ${
                          activeCategory === parent.id || children.some(c => c.id === activeCategory)
                            ? "text-[var(--color-ink)] font-bold" : "text-[var(--color-shade-40)] hover:text-[var(--color-ink)]"
                        }`}
                      >
                        <span>{parent.name}</span>
                        <ChevronDownIcon className="h-4 w-4 -rotate-90" />
                      </button>
                    )
                  }
                  return (
                    <button
                      key={parent.id}
                      onClick={() => onFilterChange("category", parent.id)}
                      className={`text-left text-storefront-body-md py-2 transition-all cursor-pointer border-none bg-transparent block w-full ${
                        activeCategory === parent.id ? "text-[var(--color-ink)] font-bold" : "text-[var(--color-shade-40)] hover:text-[var(--color-ink)]"
                      }`}
                    >
                      {parent.name}
                    </button>
                  )
                })}
              </>
            ) : (
              <Accordion type="multiple" className="w-full">
                {parentCategories.map((parent) => {
                  const children = childrenByParentId[parent.id] || []
                  if (children.length > 0) {
                    return (
                      <AccordionItem value={parent.id} key={parent.id} className="border-none">
                        <AccordionTrigger className={`text-left text-storefront-body-md py-1 transition-all cursor-pointer border-none bg-transparent hover:no-underline ${
                            activeCategory === parent.id || children.some(c => c.id === activeCategory)
                              ? "text-[var(--color-ink)] font-bold" : "text-[var(--color-shade-40)] hover:text-[var(--color-ink)]"
                          }`}>
                          {parent.name}
                        </AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-2 pl-4 pt-1">
                          <button
                            onClick={() => onFilterChange("category", parent.id)}
                            className={`text-left text-storefront-body-md py-1 transition-all cursor-pointer border-none bg-transparent ${
                              activeCategory === parent.id ? "text-[var(--color-ink)] font-bold" : "text-[var(--color-shade-40)] hover:text-[var(--color-ink)]"
                            }`}
                          >
                            All {parent.name}
                          </button>
                          {children.map((child) => (
                            <button
                              key={child.id}
                              onClick={() => onFilterChange("category", child.id)}
                              className={`text-left text-storefront-body-md py-1 transition-all cursor-pointer border-none bg-transparent ${
                                activeCategory === child.id ? "text-[var(--color-ink)] font-bold" : "text-[var(--color-shade-40)] hover:text-[var(--color-ink)]"
                              }`}
                            >
                              {child.name}
                            </button>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    )
                  }
                  return (
                    <button
                      key={parent.id}
                      onClick={() => onFilterChange("category", parent.id)}
                      className={`text-left text-storefront-body-md py-1 transition-all cursor-pointer border-none bg-transparent block w-full ${
                        activeCategory === parent.id ? "text-[var(--color-ink)] font-bold" : "text-[var(--color-shade-40)] hover:text-[var(--color-ink)]"
                      }`}
                    >
                      {parent.name}
                    </button>
                  )
                })}
              </Accordion>
            )}
          </div>
        )}
      </div>

      {/* 2. Price Accordion */}
      <div className="flex flex-col border-b border-[var(--color-hairline-light)] pb-4">
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full text-storefront-body-strong font-bold text-[var(--color-ink)] uppercase tracking-wider mb-3 cursor-pointer border-none bg-transparent"
        >
          <span>Price Range</span>
          {sections.price ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
        </button>
        {sections.price && (
          <div className="flex flex-col gap-2 pl-1">
            {priceOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onFilterChange("price", opt.value)}
                className={`text-left text-storefront-body-md py-1 transition-all cursor-pointer border-none bg-transparent ${
                  (activePrice || "") === opt.value ? "text-[var(--color-ink)] font-bold" : "text-[var(--color-shade-40)] hover:text-[var(--color-ink)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Colors Accordion */}
      <div className="flex flex-col border-b border-[var(--color-hairline-light)] pb-4">
        <button
          type="button"
          onClick={() => toggleSection("colors")}
          className="flex items-center justify-between w-full text-storefront-body-strong font-bold text-[var(--color-ink)] uppercase tracking-wider mb-3 cursor-pointer border-none bg-transparent"
        >
          <span>Colors</span>
          {sections.colors ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
        </button>
        {sections.colors && (
          <div className="flex flex-wrap gap-2.5 pt-1 pl-1">
            {colorOptions.map((color) => {
              const isActive = activeColor === color.value
              return (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => onFilterChange("color", isActive ? "" : color.value)}
                  className={`h-7 w-7 rounded-[var(--radius-pill)] border relative transition-transform cursor-pointer ${
                    isActive ? "scale-110 border-[var(--color-primary)]" : "border-[var(--color-hairline-light)] hover:scale-105"
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
          type="button"
          onClick={() => toggleSection("sizes")}
          className="flex items-center justify-between w-full text-storefront-body-strong font-bold text-[var(--color-ink)] uppercase tracking-wider mb-3 cursor-pointer border-none bg-transparent"
        >
          <span>Sizes</span>
          {sections.sizes ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
        </button>
        {sections.sizes && (
          <div className="grid grid-cols-3 gap-2 pt-1 pl-1">
            {sizeOptions.map((size) => {
              const isActive = activeSize === size
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onFilterChange("size", isActive ? "" : size)}
                  className={`rounded-[var(--radius-md)] py-2 text-center text-xs font-semibold border transition-all cursor-pointer ${
                    isActive
                      ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)]"
                      : "border-[var(--color-hairline-light)] bg-[var(--color-canvas-cream)] text-[var(--color-ink)] hover:border-[var(--color-shade-40)]"
                  }`}
                >
                  {size}
                </button>
              )
            })}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  )
}
