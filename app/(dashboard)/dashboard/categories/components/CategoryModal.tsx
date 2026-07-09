"use client"

import React, { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { X, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label as FormLabel } from "@/components/ui/label"
import { createCategoryAction, updateCategoryAction } from "@/app/actions/categories"
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters."),
  slug: z.string().min(2, "Slug must be at least 2 characters.")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens."),
})

interface Category {
  id: string
  name: string
  slug: string
}

interface CategoryModalProps {
  editingCategory: Category | null
  onClose: () => void
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function CategoryModal({ editingCategory, onClose }: CategoryModalProps) {
  const isEditing = !!editingCategory
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSlugEdited, setIsSlugEdited] = useState(isEditing)

  const form = useForm({
    defaultValues: {
      name: editingCategory?.name ?? "",
      slug: editingCategory?.slug ?? "",
    },
    onSubmit: async ({ value }) => {
      setSuccessMessage(null)
      setErrorMessage(null)

      const validation = categorySchema.safeParse(value)
      if (!validation.success) {
        setErrorMessage(validation.error.issues[0].message)
        return
      }

      const result = isEditing
        ? await updateCategoryAction(editingCategory.id, value)
        : await createCategoryAction(value)

      if (result.success) {
        setSuccessMessage(isEditing ? "Category updated successfully." : "Category created successfully.")
        setTimeout(() => onClose(), 1000)
      } else {
        setErrorMessage(result.error || "Operation failed.")
      }
    },
  })

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Modal Panel */}
      <div className="bg-card border border-border rounded-xl w-full max-w-md flex flex-col overflow-hidden animate-fade-in text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            {isEditing ? "Edit Category" : "Create Category"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
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
          {/* Category Name */}
          <form.Field name="name">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <FormLabel htmlFor="modal-cat-name">Category Name *</FormLabel>
                <Input
                  id="modal-cat-name"
                  autoFocus
                  value={field.state.value}
                  onChange={(e) => {
                    const newName = e.target.value
                    field.handleChange(newName)
                    if (!isSlugEdited) {
                      form.setFieldValue("slug", slugify(newName))
                    }
                  }}
                  onBlur={field.handleBlur}
                  placeholder="e.g. Traditional Salwar"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">{String(field.state.meta.errors[0])}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Slug */}
          <form.Field name="slug">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <FormLabel htmlFor="modal-cat-slug">Category Slug *</FormLabel>
                <Input
                  id="modal-cat-slug"
                  value={field.state.value}
                  onChange={(e) => {
                    setIsSlugEdited(true)
                    field.handleChange(slugify(e.target.value))
                  }}
                  onBlur={field.handleBlur}
                  placeholder="e.g. traditional-salwar"
                />
                <p className="text-xs text-muted-foreground leading-normal">
                  Used for SEO friendly URLs on the storefront (lowercase letters, numbers, and hyphens only).
                </p>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">{String(field.state.meta.errors[0])}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Feedback */}
          {successMessage && (
            <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg px-4 py-3">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-lg px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
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
                  {isSubmitting
                    ? isEditing
                      ? "Saving…"
                      : "Creating…"
                    : isEditing
                    ? "Save Changes"
                    : "Create Category"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>
  )
}
