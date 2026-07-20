"use client"

import React, { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useQueryClient } from "@tanstack/react-query"
import { CheckCircle2Icon, AlertCircleIcon, Loader2Icon } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ProductSelectDialog } from "@/components/dashboard/ProductSelectDialog"
import { createFlashSaleAction, updateFlashSaleAction } from "@/app/actions/flash-sales"

// Helper to convert Date to YYYY-MM-DDThh:mm for datetime-local default value
function formatDatetimeLocal(dateStr?: string | Date): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  // Shift to local time coordinates and output YYYY-MM-DDTHH:MM
  const offset = d.getTimezoneOffset() * 60000
  const localDate = new Date(d.getTime() - offset)
  return localDate.toISOString().slice(0, 16)
}

interface Product {
  id: string
  variantId?: string | null
  name: string
  pricePaisa: number
  stockCount?: number
}

interface FlashSale {
  id: string
  productId: string
  variantId?: string | null
  productName: string
  salePricePaisa: number
  limitQuantity: number
  soldQuantity: number
  startTime: Date | string
  endTime: Date | string
  isActive: boolean
}

interface FlashSaleModalProps {
  editingSale: FlashSale | null
  products: Product[] // fallback initial list
  onClose: () => void
  merchantId: string
}

export function FlashSaleModal({ editingSale, products, onClose, merchantId }: FlashSaleModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!editingSale
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Selection states
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    if (editingSale) {
      const match = products.find((p) => p.id === editingSale.productId)
      return match ?? {
        id: editingSale.productId,
        variantId: editingSale.variantId,
        name: editingSale.productName,
        pricePaisa: editingSale.salePricePaisa,
        stockCount: editingSale.limitQuantity + 999999,
      }
    }
    return null
  })
  const [discountPercent, setDiscountPercent] = useState("")

  const form = useForm({
    defaultValues: {
      productId: editingSale?.productId ?? "",
      variantId: editingSale?.variantId ?? "",
      salePrice: editingSale ? (editingSale.salePricePaisa / 100) : 0,
      limitQuantity: editingSale?.limitQuantity ?? 10,
      startTime: editingSale ? formatDatetimeLocal(editingSale.startTime) : "",
      endTime: editingSale ? formatDatetimeLocal(editingSale.endTime) : "",
      isActive: editingSale?.isActive ?? true,
    },
    onSubmit: async ({ value }) => {
      if (!value.productId) {
        setErrorMessage("Please select a target product first.")
        return
      }

      setSuccessMessage(null)
      setErrorMessage(null)

      const payload = {
        productId: value.productId,
        variantId: value.variantId || null,
        salePricePaisa: Math.round(value.salePrice * 100),
        limitQuantity: value.limitQuantity,
        startTime: value.startTime ? new Date(value.startTime).toISOString() : undefined,
        endTime: value.endTime ? new Date(value.endTime).toISOString() : undefined,
        isActive: value.isActive,
      }

      const result = isEditing
        ? await updateFlashSaleAction(editingSale.id, payload)
        : await createFlashSaleAction(payload)

      if (result.success) {
        setSuccessMessage(isEditing ? "Campaign updated successfully." : "Campaign created successfully.")
        queryClient.invalidateQueries({ queryKey: ["flash-sales", merchantId] })
        setTimeout(() => onClose(), 1000)
      } else {
        setErrorMessage(result.error || "Operation failed.")
      }
    },
  })

  // Pre-Calculation Logic
  const handleApplyDiscount = () => {
    if (!selectedProduct) return
    const pct = parseFloat(discountPercent)
    if (isNaN(pct) || pct < 0 || pct > 100) {
      alert("Please enter a valid discount percentage between 0 and 100.")
      return
    }
    const basePrice = selectedProduct.pricePaisa / 100
    const calculatedPrice = basePrice * (1 - pct / 100)
    // Round to 2 decimal places
    const roundedPrice = Math.round(calculatedPrice * 100) / 100
    form.setFieldValue("salePrice", roundedPrice)
  }

  const handleSelectSingle = (product: Product) => {
    setSelectedProduct(product)
    form.setFieldValue("productId", product.id)
    form.setFieldValue("variantId", product.variantId || "")
    setDiscountPercent("")
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Flash Sale" : "Launch Flash Sale"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
            className="flex flex-col gap-4 py-2"
          >
            {/* Targeted Product Section */}
            <form.Field name="productId">
              {() => (
                <Field>
                  <FieldLabel htmlFor="modal-sale-product">Target Product *</FieldLabel>
                  {isEditing ? (
                    <Input
                      id="modal-sale-product"
                      value={editingSale?.productName || ""}
                      disabled
                      className="w-full cursor-not-allowed opacity-60"
                    />
                  ) : (
                    <div className="flex flex-col gap-2">
                      {selectedProduct ? (
                        <div className="flex items-center justify-between border border-border rounded-lg p-3 bg-zinc-50/30">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-zinc-800">{selectedProduct.name}</span>
                            <span className="text-xs text-zinc-500 font-light">
                              Base Price: ৳{(selectedProduct.pricePaisa / 100).toLocaleString()}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsSelectOpen(true)}
                            className="text-xs cursor-pointer"
                          >
                            Change
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsSelectOpen(true)}
                          className="w-full justify-start text-zinc-400 font-light border-dashed py-5 cursor-pointer"
                        >
                          Click to select target product...
                        </Button>
                      )}
                    </div>
                  )}
                  {isEditing && (
                    <FieldDescription>
                      The target product cannot be changed once a campaign is created.
                    </FieldDescription>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Pre-Calculation Helper */}
            {!isEditing && selectedProduct && (
              <div className="border border-border/60 bg-muted/20 rounded-lg p-3 flex flex-col gap-2 select-none">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Discount Pre-Calculation Helper
                </span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Enter discount % (e.g. 20)"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-full text-xs pr-8"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      %
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={handleApplyDiscount}
                    className="text-xs shrink-0 cursor-pointer h-10"
                  >
                    Apply
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Base Product Price: ৳{(selectedProduct.pricePaisa / 100).toLocaleString()}
                </p>
              </div>
            )}

            {/* Sale Price */}
            <form.Field name="salePrice">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Flash Sale Price (BDT) *</FieldLabel>
                  <NumberInput
                    id={field.name}
                    placeholder="0"
                    leftIcon="৳"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(val) => field.handleChange(val)}
                    error={field.state.meta.errors.length > 0}
                  />
                  <FieldDescription>
                    Enter the promotional price. Must be lower than the standard price.
                  </FieldDescription>
                </Field>
              )}
            </form.Field>

            {/* Limit Count */}
            <form.Field
              name="limitQuantity"
              validators={{
                onChange: ({ value }) => {
                  if (selectedProduct && selectedProduct.stockCount !== undefined && value > selectedProduct.stockCount) {
                    return `Cannot exceed available stock (${selectedProduct.stockCount}).`
                  }
                  return undefined
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Flash Sale Stock Limit *</FieldLabel>
                  <NumberInput
                    id={field.name}
                    placeholder="e.g. 100"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(val) => field.handleChange(val)}
                    error={field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <FieldError>{field.state.meta.errors[0]}</FieldError>
                  ) : (
                    <FieldDescription>
                      Maximum quantity that can be sold at this discounted price. (Available: {selectedProduct?.stockCount ?? 0})
                    </FieldDescription>
                  )}
                </Field>
              )}
            </form.Field>

            {/* Date Boundaries */}
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="startTime">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="modal-sale-start">Start Time *</FieldLabel>
                    <Input
                      id="modal-sale-start"
                      type="datetime-local"
                      required
                      disabled={isEditing}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="endTime">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="modal-sale-end">End Time *</FieldLabel>
                    <Input
                      id="modal-sale-end"
                      type="datetime-local"
                      required
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </Field>
                )}
              </form.Field>
            </div>

            {/* Feedback */}
            {successMessage && (
              <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg px-4 py-3 select-none">
                <CheckCircle2Icon className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-lg px-4 py-3 select-none">
                <AlertCircleIcon className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={onClose} className="cursor-pointer">
                Cancel
              </Button>
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="cursor-pointer"
                  >
                    {isSubmitting && <Loader2Icon className="h-4 w-4 animate-spin mr-1" />}
                    {isSubmitting
                      ? isEditing
                        ? "Saving…"
                        : "Launching…"
                      : isEditing
                      ? "Save Changes"
                      : "Launch Sale"}
                  </Button>
                )}
              </form.Subscribe>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Embedded single product selection dialog */}
      <ProductSelectDialog
        open={isSelectOpen}
        onClose={() => setIsSelectOpen(false)}
        onSelectSingle={handleSelectSingle}
        mode="single"
      />
    </>
  )
}
