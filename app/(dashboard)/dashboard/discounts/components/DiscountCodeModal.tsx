"use client"

import React, { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { CheckCircle2Icon, AlertCircleIcon, Loader2Icon } from "@/lib/icons";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { discountCodeSchema, type DiscountCodeValues } from "@/lib/validations/discounts"
import {
  createDiscountCodeAction,
  updateDiscountCodeAction,
} from "@/app/actions/discounts"
import { cn } from "@/lib/utils"

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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Discount Code" : "Create Discount Code"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="flex flex-col gap-5"
        >
          {/* Code */}
          <form.Field name="code">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="modal-code">
                  Coupon Code *
                </FieldLabel>
                <Input
                  id="modal-code"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                  onBlur={field.handleBlur}
                  placeholder="e.g. SUMMER20"
                  className="font-mono uppercase bg-background border-border rounded-lg"
                />
                <FieldDescription>
                  Letters, numbers, hyphens and underscores only.
                </FieldDescription>
                {field.state.meta.errors.length > 0 && (
                  <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                )}
              </Field>
            )}
          </form.Field>

          {/* Discount Type */}
          <form.Field name="discountType">
            {(field) => (
              <Field>
                <FieldLabel>Discount Type *</FieldLabel>
                <div className="flex gap-3">
                  {(["fixed", "percent"] as const).map((type) => (
                    <label
                      key={type}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer transition-colors flex-1",
                        field.state.value === type
                          ? "border-primary bg-muted text-foreground"
                          : "border-border bg-transparent hover:bg-muted/50"
                      )}
                    >
                      <input
                        type="radio"
                        name="discountType"
                        value={type}
                        checked={field.state.value === type}
                        onChange={() => field.handleChange(type)}
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold capitalize">
                        {type === "fixed" ? "Fixed (৳)" : "Percentage (%)"}
                      </span>
                    </label>
                  ))}
                </div>
              </Field>
            )}
          </form.Field>

          {/* Value */}
          <form.Field name="value">
            {(field) => (
              <form.Subscribe selector={(state) => state.values.discountType}>
                {(discountType) => (
                  <Field>
                    <FieldLabel htmlFor="modal-value">
                      {discountType === "percent"
                        ? "Percentage (%) *"
                        : "Amount (৳) *"}
                    </FieldLabel>
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
                      className="bg-background border-border rounded-lg"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                    )}
                  </Field>
                )}
              </form.Subscribe>
            )}
          </form.Field>

          {/* Usage Limit */}
          <form.Field name="usageLimit">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="modal-usage-limit">Usage Limit (optional)</FieldLabel>
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
                  className="bg-background border-border rounded-lg"
                />
              </Field>
            )}
          </form.Field>

          {/* Expiry */}
          <form.Field name="expiresAt">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="modal-expires-at">Expiry Date (optional)</FieldLabel>
                <Input
                  id="modal-expires-at"
                  type="datetime-local"
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value || null)}
                  onBlur={field.handleBlur}
                  className="bg-background border-border rounded-lg"
                />
              </Field>
            )}
          </form.Field>

          {/* Feedback */}
          {successMessage && (
            <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg px-4 py-3">
              <CheckCircle2Icon className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-lg px-4 py-3">
              <AlertCircleIcon className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2Icon className="h-4 w-4 animate-spin mr-1" />}
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
