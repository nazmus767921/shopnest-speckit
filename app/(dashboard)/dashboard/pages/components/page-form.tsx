"use client"

import React, { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { pageSchema, PageFormValues } from "@/lib/validations/pages"
import { createPageAction, updatePageAction } from "@/app/actions/pages"
import { Button } from "@/components/ui/primitives/Button"
import { Input } from "@/components/ui/primitives/Input"
import { Card } from "@/components/ui/layout/Card"
import { FormLabel } from "@/components/ui/primitives/FormLabel"

interface PageFormProps {
  initialData?: PageFormValues & { id?: string }
}

export function PageForm({ initialData }: PageFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEditing = !!initialData?.id
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (values: PageFormValues) => {
      const res = isEditing
        ? await updatePageAction(initialData.id!, values)
        : await createPageAction(values)

      if (!res.success) {
        throw new Error(res.error)
      }
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] })
      router.push("/dashboard/pages")
      router.refresh()
    },
    onError: (err: any) => {
      setError(err.message)
    },
  })

  const form = useForm({
    defaultValues: initialData || {
      title: "",
      slug: "",
      content: "",
      isPublished: false,
    },
    onSubmit: async ({ value }) => {
      setError(null)

      const validation = pageSchema.safeParse(value)
      if (!validation.success) {
        setError(validation.error.issues[0].message)
        return
      }

      mutation.mutate(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="flex flex-col gap-8 max-w-4xl"
    >
      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-caption">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-6">
          <Card className="p-6 flex flex-col gap-6">
            <h2 className="text-body-strong font-semibold text-ink border-b border-hairline-light pb-4">
              Page Content
            </h2>
            
            <form.Field name="title">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <FormLabel htmlFor="title">Title</FormLabel>
                  <Input
                    id="title"
                    placeholder="e.g. About Us"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-[10px] text-red-600">{String(field.state.meta.errors[0])}</span>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="content">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <FormLabel htmlFor="content">Content (HTML)</FormLabel>
                  <textarea
                    id="content"
                    placeholder="<p>Write your page content here...</p>"
                    className="w-full min-h-[300px] border border-hairline-light rounded-lg p-3 text-caption font-mono focus:outline-none focus:border-shade-60 transition-colors bg-canvas-light text-ink"
                    value={field.state.value || ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-[10px] text-red-600">{String(field.state.meta.errors[0])}</span>
                  )}
                </div>
              )}
            </form.Field>
          </Card>
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          <Card className="p-6 flex flex-col gap-6">
            <h2 className="text-body-strong font-semibold text-ink border-b border-hairline-light pb-4">
              Configuration
            </h2>

            <form.Field name="slug">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <FormLabel htmlFor="slug">Slug</FormLabel>
                  <Input
                    id="slug"
                    placeholder="about-us"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  <p className="text-micro text-shade-40 leading-snug mt-1">
                    The URL path for this page (e.g. /pages/about-us)
                  </p>
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-[10px] text-red-600">{String(field.state.meta.errors[0])}</span>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="isPublished">
              {(field) => (
                <div className="flex items-center justify-between pt-4 border-t border-hairline-light">
                  <div className="flex flex-col">
                    <FormLabel htmlFor="isPublished" className="mb-1 cursor-pointer">Published</FormLabel>
                    <span className="text-micro text-shade-40">Make this page visible</span>
                  </div>
                  <input
                    id="isPublished"
                    type="checkbox"
                    className="w-4 h-4 rounded border-hairline-light text-primary focus:ring-primary cursor-pointer"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-hairline-light pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || mutation.isPending}
            >
              {isSubmitting || mutation.isPending ? "Saving..." : (isEditing ? "Save Changes" : "Create Page")}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
