"use client"

import React, { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { X, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/primitives/Button"
import { Input } from "@/components/ui/primitives/Input"
import { FormLabel } from "@/components/ui/primitives/FormLabel"
import { discountCodeSchema, type DiscountCodeValues } from "@/lib/validations/discounts"
import {
  createDiscountCodeAction,
  updateDiscountCodeAction,
} from "@/app/actions/discounts"

interface DiscountCode {
  id: string
  code: string
  discountType: string
  value: string
  usageLimit: number | null
  usageCount: number
  expiresAt: Date | null
}

interface DiscountCodeModalProps {
  editingCode: DiscountCode | null
  onClose: () => void
}

function toDatetimeLocalString(date: Date | null): string {
  if (!date) return ""
  const d = new Date(date)
  // Pad to YYYY-MM-DDTHH:MM format
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function DiscountCodeModal({ editingCode, onClose }: DiscountCodeModalProps) {
  const isEditing = !!editingCode
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      code: editingCode?.code ?? "",
      discountType: (editingCode?.discountType as "fixed" | "percent") ?? "fixed",
      value: editingCode ? parseFloat(editingCode.value) : 0,
      usageLimit: editingCode?.usageLimit ?? null,
      expiresAt: editingCode ? toDatetimeLocalString(editingCode.expiresAt) : null,
    },
    onSubmit: async ({ value }) => {
      setSuccessMessage(null)
      setErrorMessage(null)

      const validation = discountCodeSchema.safeParse(value)
      if (!validation.success) {
        setErrorMessage(validation.error.issues[0].message)
        return
      }

      const result = isEditing
        ? await updateDiscountCodeAction(editingCode.id, value)
        : await createDiscountCodeAction(value)

      if (result.success) {
        setSuccessMessage(isEditing ? "Code updated successfully." : "Code created successfully.")
        setTimeout(() => onClose(), 1000)
      } else {
        setErrorMessage(result.error || "Operation failed.")
      }
    },
  })

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas-night/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Modal Panel */}
      <div className="bg-canvas-light border border-hairline-light rounded-xl w-full max-w-md flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline-light">
          <h2 className="font-display text-heading-md font-semibold text-ink">
            {isEditing ? "Edit Discount Code" : "Create Discount Code"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-canvas-cream rounded-md transition-colors text-shade-50 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="flex flex-col gap-5 p-6"
        >
          {/* Code */}
          <form.Field name="code">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <FormLabel htmlFor="modal-code">
                  Coupon Code *
                </FormLabel>
                <Input
                  id="modal-code"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                  onBlur={field.handleBlur}
                  placeholder="e.g. SUMMER20"
                  className="font-mono uppercase"
                />
                <p className="text-micro text-shade-40">
                  Letters, numbers, hyphens and underscores only.
                </p>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-micro text-red-500">{String(field.state.meta.errors[0])}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Discount Type */}
          <form.Field name="discountType">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <FormLabel>Discount Type *</FormLabel>
                <div className="flex gap-3">
                  {(["fixed", "percent"] as const).map((type) => (
                    <label
                      key={type}
                      className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer transition-colors flex-1 ${
                        field.state.value === type
                          ? "border-ink bg-canvas-cream"
                          : "border-hairline-light bg-transparent hover:bg-canvas-cream/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="discountType"
                        value={type}
                        checked={field.state.value === type}
                        onChange={() => field.handleChange(type)}
                        className="sr-only"
                      />
                      <span className="text-caption font-semibold text-ink capitalize">
                        {type === "fixed" ? "Fixed (৳)" : "Percentage (%)"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </form.Field>

          {/* Value */}
          <form.Field name="value">
            {(field) => (
              <form.Subscribe selector={(state) => state.values.discountType}>
                {(discountType) => (
                  <div className="flex flex-col gap-1.5">
                    <FormLabel htmlFor="modal-value">
                      {discountType === "percent"
                        ? "Percentage (%) *"
                        : "Amount (৳) *"}
                    </FormLabel>
                    <Input
                      id="modal-value"
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={field.state.value || ""}
                      onChange={(e) => field.handleChange(parseFloat(e.target.value))}
                      onBlur={field.handleBlur}
                      placeholder={
                        discountType === "percent" ? "e.g. 15" : "e.g. 200"
                      }
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-micro text-red-500">{String(field.state.meta.errors[0])}</p>
                    )}
                  </div>
                )}
              </form.Subscribe>
            )}
          </form.Field>

          {/* Usage Limit */}
          <form.Field name="usageLimit">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <FormLabel htmlFor="modal-usage-limit">Usage Limit (optional)</FormLabel>
                <Input
                  id="modal-usage-limit"
                  type="number"
                  min={1}
                  value={field.state.value ?? ""}
                  onChange={(e) =>
                    field.handleChange(e.target.value ? parseInt(e.target.value) : null)
                  }
                  onBlur={field.handleBlur}
                  placeholder="Leave blank for unlimited"
                />
              </div>
            )}
          </form.Field>

          {/* Expiry */}
          <form.Field name="expiresAt">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <FormLabel htmlFor="modal-expires-at">Expiry Date (optional)</FormLabel>
                <Input
                  id="modal-expires-at"
                  type="datetime-local"
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value || null)}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          </form.Field>

          {/* Feedback */}
          {successMessage && (
            <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="text-caption font-medium">{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-caption font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-hairline-light">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? isEditing
                      ? "Saving…"
                      : "Creating…"
                    : isEditing
                    ? "Save Changes"
                    : "Create Code"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>
  )
}
