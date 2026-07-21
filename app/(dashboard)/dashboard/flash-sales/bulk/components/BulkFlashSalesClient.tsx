"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeftIcon, Loader2Icon, AlertCircleIcon, CheckCircle2Icon, Trash2Icon, PlusIcon } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProductSelectDialog } from "@/components/dashboard/ProductSelectDialog"
import { bulkCreateFlashSalesAction } from "@/app/actions/flash-sales"

interface Product {
  id: string
  variantId?: string | null
  name: string
  pricePaisa: number
  stockCount: number
}

interface RowData {
  product: Product
  salePrice: number
  limitQuantity: number
  startTime: string
  endTime: string
}

interface BulkFlashSalesClientProps {
  merchantId: string
}

// Helpers for default date formats
function getFutureDateString(hoursAhead: number): string {
  const d = new Date()
  d.setHours(d.getHours() + hoursAhead)
  const offset = d.getTimezoneOffset() * 60000
  const localDate = new Date(d.getTime() - offset)
  return localDate.toISOString().slice(0, 16)
}

export function BulkFlashSalesClient({ merchantId }: BulkFlashSalesClientProps) {
  const router = useRouter()

  // State
  const [rows, setRows] = useState<RowData[]>([])
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Global apply configuration settings
  const [globalStart, setGlobalStart] = useState(getFutureDateString(1))
  const [globalEnd, setGlobalEnd] = useState(getFutureDateString(25)) // 24 hours later
  const [globalLimit, setGlobalLimit] = useState(10)
  const [globalDiscount, setGlobalDiscount] = useState(20) // default 20% off

  // Handlers
  const handleSelectMultiple = (selected: Product[]) => {
    const discountVal = Math.max(0, Math.min(100, globalDiscount))
    
    const newRows = selected.map((prod) => {
      const calculatedPrice = (prod.pricePaisa / 100) * (1 - discountVal / 100)
      const roundedPrice = Math.round(calculatedPrice * 100) / 100
      return {
        product: prod,
        salePrice: roundedPrice,
        limitQuantity: globalLimit,
        startTime: globalStart,
        endTime: globalEnd,
      }
    })

    setRows((prev) => [...prev, ...newRows])
  }

  const handleRemoveRow = (rowKey: string) => {
    setRows((prev) =>
      prev.filter((r) => {
        const currentKey = r.product.variantId ? r.product.variantId : r.product.id
        return currentKey !== rowKey
      })
    )
  }

  const handleUpdateRowValue = (rowKey: string, key: keyof RowData, val: any) => {
    setRows((prev) =>
      prev.map((r) => {
        const currentKey = r.product.variantId ? r.product.variantId : r.product.id
        if (currentKey === rowKey) {
          return { ...r, [key]: val }
        }
        return r
      })
    )
  }

  const handleApplyGlobalSettings = () => {
    const discountVal = Math.max(0, Math.min(100, globalDiscount))
    setRows((prev) =>
      prev.map((r) => {
        const basePrice = r.product.pricePaisa / 100
        const calculatedPrice = basePrice * (1 - discountVal / 100)
        const roundedPrice = Math.round(calculatedPrice * 100) / 100
        return {
          ...r,
          salePrice: roundedPrice,
          limitQuantity: globalLimit,
          startTime: globalStart,
          endTime: globalEnd,
        }
      })
    )
  }

  const handleBulkLaunch = async () => {
    if (rows.length === 0) {
      setErrorMsg("Please select at least one product to launch.")
      return
    }

    // Validate stock limits first
    for (const r of rows) {
      if (r.limitQuantity > r.product.stockCount) {
        setErrorMsg(`Product "${r.product.name}" limit quantity (${r.limitQuantity}) cannot exceed available stock (${r.product.stockCount}).`)
        setIsSubmitting(false)
        return
      }
    }

    setIsSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    // Build batch payload
    const payload = rows.map((r) => ({
      productId: r.product.id,
      variantId: r.product.variantId ?? null,
      salePricePaisa: Math.round(r.salePrice * 100),
      limitQuantity: r.limitQuantity,
      startTime: r.startTime ? new Date(r.startTime).toISOString() : undefined,
      endTime: r.endTime ? new Date(r.endTime).toISOString() : undefined,
    }))

    const result = await bulkCreateFlashSalesAction(payload)
    setIsSubmitting(false)

    if (result.success) {
      setSuccessMsg("All flash sales campaigns launched successfully!")
      setTimeout(() => {
        router.push("/dashboard/flash-sales")
      }, 1000)
    } else {
      setErrorMsg(result.error || "Failed to bulk launch campaigns.")
    }
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Header and Back navigation */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/flash-sales"
          className="p-2 border rounded-md hover:bg-zinc-50 transition-colors"
        >
          <ChevronLeftIcon className="h-4 w-4 text-zinc-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Bulk Launch Flash Sales</h1>
          <p className="text-xs text-zinc-500 font-light mt-0.5">
            Schedules and launches multiple flash sale promotions at once.
          </p>
        </div>
      </div>

      {/* Product Selection Dialog Trigger button */}
      <div className="border border-border/80 rounded-xl p-5 bg-white shadow-xs">
        <div className="flex flex-col gap-2.5 max-w-xl">
          <span className="text-sm font-bold text-zinc-800">Select Products or Variants to Add *</span>
          <Button
            type="button"
            onClick={() => setIsSelectOpen(true)}
            className="flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center rounded-md py-5 border border-dashed border-zinc-300 hover:border-zinc-400 bg-zinc-50/20 hover:bg-zinc-50/50 text-zinc-600 transition-all"
            variant="outline"
          >
            <PlusIcon className="h-4 w-4 text-zinc-500" />
            <span>Select Products or Variants</span>
          </Button>
          <p className="text-xs text-zinc-500 font-light">
            Opens the scrollable search selector. Previously added products will be marked as "Added".
          </p>
        </div>
      </div>

      {/* Global Pre-Calculation Apply Settings block */}
      <div className="border border-border/80 rounded-xl p-5 bg-muted/10 shadow-xs flex flex-col gap-4">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
          Global Configuration Pre-Calculator (Bulk Apply Helper)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <Field>
            <FieldLabel htmlFor="global-discount">Discount (%)</FieldLabel>
            <NumberInput
              id="global-discount"
              placeholder="e.g. 20"
              minValue={0}
              maxValue={100}
              value={globalDiscount}
              onChange={(val) => setGlobalDiscount(val || 0)}
              variant="default"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="global-limit">Stock Limit</FieldLabel>
            <NumberInput
              id="global-limit"
              placeholder="e.g. 10"
              minValue={1}
              value={globalLimit}
              onChange={(val) => setGlobalLimit(val || 1)}
              variant="default"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="global-start">Start Time</FieldLabel>
            <Input
              id="global-start"
              type="datetime-local"
              value={globalStart}
              onChange={(e) => setGlobalStart(e.target.value)}
              className="w-full text-xs"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="global-end">End Time</FieldLabel>
            <Input
              id="global-end"
              type="datetime-local"
              value={globalEnd}
              onChange={(e) => setGlobalEnd(e.target.value)}
              className="w-full text-xs"
            />
          </Field>
          <div>
            <Button
              type="button"
              onClick={handleApplyGlobalSettings}
              variant="outline"
              className="w-full text-xs cursor-pointer"
            >
              Apply to Table
            </Button>
          </div>
        </div>
      </div>

      {/* Editable rows table workspace - Desktop layout */}
      <div className="hidden md:block border border-zinc-100 rounded-xl overflow-hidden bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Product Title</TableHead>
              <TableHead className="w-[15%]">Base Price</TableHead>
              <TableHead className="w-[15%] font-bold">Flash Price (BDT) *</TableHead>
              <TableHead className="w-[12%]">Stock Limit *</TableHead>
              <TableHead className="w-[13%]">Start Date</TableHead>
              <TableHead className="w-[13%]">End Date</TableHead>
              <TableHead className="w-[5%] text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-zinc-400 font-light text-sm select-none">
                  No items added to the bulk launching list. Click "Select Products" to search and add.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const rowKey = row.product.variantId ? row.product.variantId : row.product.id
                return (
                  <TableRow key={rowKey} className="hover:bg-zinc-50/50">
                    <TableCell className="align-middle">
                      <span className="text-xs font-bold text-zinc-800 line-clamp-2 leading-snug">{row.product.name}</span>
                    </TableCell>
                    <TableCell className="align-middle font-mono text-xs">
                      ৳{(row.product.pricePaisa / 100).toLocaleString()}
                    </TableCell>
                    <TableCell className="align-middle">
                      <NumberInput
                        placeholder="0"
                        leftIcon="৳"
                        value={row.salePrice}
                        onChange={(val) => handleUpdateRowValue(rowKey, "salePrice", val)}
                        className="w-full text-xs"
                      />
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="flex flex-col gap-1">
                        <NumberInput
                          placeholder="e.g. 10"
                          value={row.limitQuantity}
                          onChange={(val) => handleUpdateRowValue(rowKey, "limitQuantity", val)}
                          className="w-full text-xs"
                          error={row.limitQuantity > row.product.stockCount}
                        />
                        <span className={`text-[10px] ${row.limitQuantity > row.product.stockCount ? "text-red-500 font-semibold" : "text-zinc-400"}`}>
                          Max: {row.product.stockCount}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="align-middle">
                      <Input
                        type="datetime-local"
                        value={row.startTime}
                        onChange={(e) => handleUpdateRowValue(rowKey, "startTime", e.target.value)}
                        className="w-full text-[11px] px-2 py-1 h-9"
                      />
                    </TableCell>
                    <TableCell className="align-middle">
                      <Input
                        type="datetime-local"
                        value={row.endTime}
                        onChange={(e) => handleUpdateRowValue(rowKey, "endTime", e.target.value)}
                        className="w-full text-[11px] px-2 py-1 h-9"
                      />
                    </TableCell>
                    <TableCell className="align-middle text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRow(rowKey)}
                        className="text-zinc-400 hover:text-red-600 transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card Layout (Visible on mobile/tablet, hidden on desktop) */}
      <div className="block md:hidden space-y-4">
        {rows.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl bg-white text-zinc-400 font-light text-sm select-none">
            No items added. Click "Select Products" to search and add.
          </div>
        ) : (
          rows.map((row) => {
            const rowKey = row.product.variantId ? row.product.variantId : row.product.id
            return (
              <div key={rowKey} className="border border-border/85 rounded-xl p-4 bg-white shadow-xs flex flex-col gap-4">
                {/* Product header info */}
                <div className="flex items-start justify-between gap-3 pb-2 border-b">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-zinc-800 line-clamp-2 leading-snug">
                      {row.product.name}
                    </span>
                    <span className="text-xs text-zinc-500 font-light">
                      Base Price: ৳{(row.product.pricePaisa / 100).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRow(rowKey)}
                    className="text-zinc-400 hover:text-red-600 transition-colors shrink-0 cursor-pointer -mt-1 -mr-1"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>

                {/* 2-column input fields */}
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel className="text-xs font-semibold text-zinc-600 mb-1">Flash Price (BDT) *</FieldLabel>
                    <NumberInput
                      placeholder="0"
                      leftIcon="৳"
                      value={row.salePrice}
                      onChange={(val) => handleUpdateRowValue(rowKey, "salePrice", val)}
                      className="w-full text-xs"
                    />
                  </Field>

                  <Field>
                    <FieldLabel className={`text-xs font-semibold mb-1 ${row.limitQuantity > row.product.stockCount ? "text-red-500" : "text-zinc-600"}`}>
                      Stock Limit *
                    </FieldLabel>
                    <NumberInput
                      placeholder="e.g. 10"
                      value={row.limitQuantity}
                      onChange={(val) => handleUpdateRowValue(rowKey, "limitQuantity", val)}
                      className="w-full text-xs"
                      error={row.limitQuantity > row.product.stockCount}
                    />
                    <span className={`text-[9px] mt-0.5 ${row.limitQuantity > row.product.stockCount ? "text-red-500 font-semibold" : "text-zinc-400"}`}>
                      Max available: {row.product.stockCount}
                    </span>
                  </Field>

                  <Field className="col-span-2 sm:col-span-1">
                    <FieldLabel className="text-xs font-semibold text-zinc-600 mb-1">Start Time *</FieldLabel>
                    <Input
                      type="datetime-local"
                      value={row.startTime}
                      onChange={(e) => handleUpdateRowValue(rowKey, "startTime", e.target.value)}
                      className="w-full text-xs px-2 py-1 h-9"
                    />
                  </Field>

                  <Field className="col-span-2 sm:col-span-1">
                    <FieldLabel className="text-xs font-semibold text-zinc-600 mb-1">End Time *</FieldLabel>
                    <Input
                      type="datetime-local"
                      value={row.endTime}
                      onChange={(e) => handleUpdateRowValue(rowKey, "endTime", e.target.value)}
                      className="w-full text-xs px-2 py-1 h-9"
                    />
                  </Field>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Notifications feedback */}
      {successMsg && (
        <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg px-4 py-3 select-none">
          <CheckCircle2Icon className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-lg px-4 py-3 select-none">
          <AlertCircleIcon className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Final submission triggers */}
      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
        <Button
          asChild
          variant="outline"
          disabled={isSubmitting}
          className="cursor-pointer"
        >
          <Link href="/dashboard/flash-sales">Cancel</Link>
        </Button>
        <Button
          onClick={handleBulkLaunch}
          disabled={isSubmitting || rows.length === 0}
          className="cursor-pointer"
        >
          {isSubmitting && <Loader2Icon className="h-4 w-4 animate-spin mr-1.5" />}
          {isSubmitting ? "Launching Campaigns..." : `Bulk Launch ${rows.length} Campaigns`}
        </Button>
      </div>

      {/* Product Selection Dialog */}
      <ProductSelectDialog
        open={isSelectOpen}
        onClose={() => setIsSelectOpen(false)}
        onSelectMultiple={handleSelectMultiple}
        excludeIds={rows.map((r) => (r.product.variantId ? r.product.variantId : r.product.id))}
        mode="multiple"
      />
    </div>
  )
}
