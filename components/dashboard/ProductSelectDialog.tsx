"use client"

import React, { useState, useEffect } from "react"
import { SearchIcon, Loader2Icon, CheckCircle2Icon } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { searchProductsAction } from "@/app/actions/products"

interface Product {
  id: string
  variantId?: string | null
  name: string
  pricePaisa: number
  stockCount: number
}

interface ProductSelectDialogProps {
  open: boolean
  onClose: () => void
  onSelectMultiple?: (selected: Product[]) => void
  onSelectSingle?: (selected: Product) => void
  excludeIds?: string[]
  mode: "single" | "multiple"
}

export function ProductSelectDialog({
  open,
  onClose,
  onSelectMultiple,
  onSelectSingle,
  excludeIds = [],
  mode,
}: ProductSelectDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])

  // Search products debounced
  useEffect(() => {
    if (!open) return

    let active = true
    const fetchProducts = async () => {
      setLoading(true)
      const res = await searchProductsAction(searchQuery)
      if (active && res.success && res.products) {
        setProducts(res.products as Product[])
      }
      if (active) {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      fetchProducts()
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [searchQuery, open])

  // Clear state on open/close
  useEffect(() => {
    if (open) {
      setSearchQuery("")
      setSelectedProducts([])
      setProducts([])
    }
  }, [open])

  // Multi-select toggle helper
  const handleToggleSelect = (product: Product) => {
    const isSelected = selectedProducts.some((p) =>
      p.variantId && product.variantId ? p.variantId === product.variantId : p.id === product.id
    )
    if (isSelected) {
      setSelectedProducts((prev) =>
        prev.filter((p) =>
          p.variantId && product.variantId ? p.variantId !== product.variantId : p.id !== product.id
        )
      )
    } else {
      setSelectedProducts((prev) => [...prev, product])
    }
  }

  const handleConfirmMultiple = () => {
    if (onSelectMultiple) {
      onSelectMultiple(selectedProducts)
    }
    onClose()
  }

  const handleSelectSingle = (product: Product) => {
    if (onSelectSingle) {
      onSelectSingle(product)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-lg w-full flex flex-col max-h-[85vh] overflow-hidden p-6 font-sans">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-base font-bold text-zinc-900">
            {mode === "multiple" ? "Select Products to Add" : "Select Target Product"}
          </DialogTitle>
        </DialogHeader>

        {/* Search Input bar */}
        <div className="relative my-4 shrink-0">
          <span className="absolute inset-y-0 left-3 flex items-center text-zinc-400">
            <SearchIcon className="h-4 w-4" />
          </span>
          <Input
            placeholder="Search products by title or attributes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full text-sm"
          />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[45vh] border rounded-lg bg-zinc-50/20 divide-y divide-zinc-100 scrollbar-hide">
          {loading && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400 select-none">
              <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs font-light">Searching catalog...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 select-none">
              <span className="text-sm font-light">No products found.</span>
            </div>
          ) : (
            products.map((product) => {
              const itemKey = product.variantId ? product.variantId : product.id
              const isExcluded = excludeIds.includes(itemKey)
              const isChecked = selectedProducts.some((p) =>
                p.variantId && product.variantId ? p.variantId === product.variantId : p.id === product.id
              )

              if (mode === "single") {
                return (
                  <button
                    key={itemKey}
                    type="button"
                    disabled={isExcluded}
                    onClick={() => handleSelectSingle(product)}
                    className="w-full text-left p-3.5 hover:bg-zinc-50 transition-colors flex items-center justify-between group disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-zinc-800 group-hover:text-primary transition-colors">
                        {product.name}
                      </span>
                      <span className="text-xs text-zinc-500 font-light">
                        Price: ৳{(product.pricePaisa / 100).toLocaleString()} | Stock: {product.stockCount}
                      </span>
                    </div>
                    {isExcluded && (
                      <span className="text-[10px] bg-zinc-100 text-zinc-400 border border-zinc-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        Added
                      </span>
                    )}
                  </button>
                )
              }

              // Multiple select rows
              return (
                <div
                  key={itemKey}
                  onClick={() => !isExcluded && handleToggleSelect(product)}
                  className={`p-3.5 flex items-center justify-between hover:bg-zinc-50/70 transition-colors cursor-pointer select-none ${
                    isExcluded ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isChecked || isExcluded}
                      disabled={isExcluded}
                      onCheckedChange={() => handleToggleSelect(product)}
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-zinc-800">{product.name}</span>
                      <span className="text-xs text-zinc-500 font-light">
                        Price: ৳{(product.pricePaisa / 100).toLocaleString()} | Stock: {product.stockCount}
                      </span>
                    </div>
                  </div>
                  {isExcluded && (
                    <span className="text-[10px] bg-zinc-100 text-zinc-400 border border-zinc-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Added
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Dialog footer operations */}
        <DialogFooter className="pt-4 border-t mt-4 shrink-0">
          <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>
          {mode === "multiple" && (
            <Button
              type="button"
              onClick={handleConfirmMultiple}
              disabled={selectedProducts.length === 0}
              className="cursor-pointer"
            >
              Add {selectedProducts.length} Product{selectedProducts.length !== 1 && "s"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
