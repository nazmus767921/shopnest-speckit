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
import { createCategoryAction, updateCategoryAction } from "@/app/actions/categories"
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters."),
  slug: z.string().min(2, "Slug must be at least 2 characters.")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens."),
  parentId: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
})

interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  imageUrl?: string | null
}

interface CategoryModalProps {
  editingCategory: Category | null
  parentCategories: Category[]
  hasChildren: boolean
  onClose: () => void
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function CategoryModal({ editingCategory, parentCategories, hasChildren, onClose }: CategoryModalProps) {
  const isEditing = !!editingCategory
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSlugEdited, setIsSlugEdited] = useState(isEditing)

  const form = useForm({
    defaultValues: {
      name: editingCategory?.name ?? "",
      slug: editingCategory?.slug ?? "",
      parentId: editingCategory?.parentId ?? "none",
      imageUrl: editingCategory?.imageUrl ?? "",
    },
    onSubmit: async ({ value }) => {
      setSuccessMessage(null)
      setErrorMessage(null)

      const validation = categorySchema.safeParse({
        ...value,
        parentId: value.parentId === "none" ? null : value.parentId,
        imageUrl: value.imageUrl || null
      })
      if (!validation.success) {
        setErrorMessage(validation.error.issues[0].message)
        return
      }
      
      const payload = validation.data

      const result = isEditing
        ? await updateCategoryAction(editingCategory.id, payload)
        : await createCategoryAction(payload)

      if (result.success) {
        setSuccessMessage(isEditing ? "Category updated successfully." : "Category created successfully.")
        setTimeout(() => onClose(), 1000)
      } else {
        setErrorMessage(result.error || "Operation failed.")
      }
    },
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Category" : "Create Category"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="flex flex-col gap-5"
        >
          {/* Category Name */}
          <form.Field name="name">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="modal-cat-name">Category Name *</FieldLabel>
                <Input
                  id="modal-cat-name"
                  autoFocus
                  value={field.state.value}
                  onChange={(e) => {
                    const newName = e.target.value
                    field.handleChange(newName)
                    if (!isSlugEdited) {
                      const parentId = form.getFieldValue("parentId")
                      const parentCategory = parentId && parentId !== "none" ? parentCategories.find(c => c.id === parentId) : null
                      const prefix = parentCategory ? `${parentCategory.slug}-` : ""
                      form.setFieldValue("slug", slugify(prefix + newName))
                    }
                  }}
                  onBlur={field.handleBlur}
                  placeholder="e.g. Traditional Salwar"
                />
                {field.state.meta.errors.length > 0 && (
                  <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                )}
              </Field>
            )}
          </form.Field>

          {/* Slug */}
          <form.Field name="slug">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="modal-cat-slug">Category Slug *</FieldLabel>
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
                <FieldDescription>
                  Used for SEO friendly URLs on the storefront (lowercase letters, numbers, and hyphens only).
                </FieldDescription>
                {field.state.meta.errors.length > 0 && (
                  <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                )}
              </Field>
            )}
          </form.Field>

          {/* Parent Category */}
          <form.Field name="parentId">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="modal-cat-parent">Parent Category (Optional)</FieldLabel>
                <select
                  id="modal-cat-parent"
                  value={field.state.value}
                  onChange={(e) => {
                    const newParentId = e.target.value
                    field.handleChange(newParentId)
                    if (!isSlugEdited) {
                      const parentCategory = newParentId !== "none" ? parentCategories.find(c => c.id === newParentId) : null
                      const prefix = parentCategory ? `${parentCategory.slug}-` : ""
                      const currentName = form.getFieldValue("name")
                      if (currentName) {
                        form.setFieldValue("slug", slugify(prefix + currentName))
                      }
                    }
                  }}
                  disabled={hasChildren}
                  className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground outline-none focus:border-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="none">None (Top-level Category)</option>
                  {parentCategories.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {hasChildren && (
                  <FieldDescription className="text-amber-600 dark:text-amber-500">
                    This category has subcategories. It cannot be nested under another category.
                  </FieldDescription>
                )}
                {field.state.meta.errors.length > 0 && (
                  <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                )}
              </Field>
            )}
          </form.Field>
 
          {/* Category Image URL */}
          <form.Field name="imageUrl">
            {(field) => (
              <Field>
                <FieldLabel htmlFor="modal-cat-image">Category Image URL (Optional)</FieldLabel>
                <Input
                  id="modal-cat-image"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="e.g. https://images.unsplash.com/... or /uploads/..."
                />
                <FieldDescription>
                  Provide a square image URL for this category to render it in a circular layout on the storefront.
                </FieldDescription>
                {field.state.meta.errors.length > 0 && (
                  <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                )}
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
                      : "Creating…"
                    : isEditing
                    ? "Save Changes"
                    : "Create Category"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
