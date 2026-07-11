"use client"

import React, { useState, useTransition } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "next/navigation"
import { pageSchema, PageFormValues } from "@/lib/validations/pages"
import { createPageAction, updatePageAction } from "@/app/actions/pages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError, FieldDescription, FieldGroup, FieldSet } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import dynamic from "next/dynamic"
import Link from "next/link"
import { ChevronLeftIcon } from "@/lib/icons";

const RichTextEditor = dynamic(
  () => import("@/components/ui/RichTextEditor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[350px] border border-border rounded-md bg-muted animate-pulse" />
    )
  }
)

interface PageFormProps {
  initialData?: PageFormValues & { id?: string }
}

export function PageForm({ initialData }: PageFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEditing = !!initialData?.id
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: PageFormValues) => {
    setError(null)
    startTransition(async () => {
      const res = isEditing
        ? await updatePageAction(initialData.id!, values)
        : await createPageAction(values)

      if (res.success) {
        router.push("/dashboard/pages")
        router.refresh()
      } else {
        setError(res.error || "An error occurred.")
      }
    })
  }

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

      handleSubmit(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="flex flex-col relative w-full text-foreground"
    >
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm mx-4 sm:mx-6 lg:mx-8 mb-4">
          {error}
        </div>
      )}

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-muted/80 backdrop-blur-md border-b border-border -mx-4 sm:-mx-6 lg:-mx-8 mb-8 lg:mb-12">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/pages"
            className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <span className="text-base font-semibold leading-none">
              {isEditing ? "Edit Page" : "Create Page"}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">
              {isPending ? "Saving..." : (isEditing ? "Saved" : "Unsaved")}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <form.Subscribe selector={(state) => {
            const fields = ['title', 'slug', 'content', 'isPublished'] as const
            const allAtDefault = fields.every((f) => state.fieldMeta[f]?.isDefaultValue)
            return { isSubmitting: state.isSubmitting, allAtDefault }
          }}>
            {({ isSubmitting, allAtDefault }) => (
              <Button
                type="submit"
                className="rounded-md px-6"
                disabled={isSubmitting || isPending || (isEditing && allAtDefault)}
              >
                {isSubmitting || isPending ? "Saving..." : "Publish"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-24">
        {/* Left column: 70% Distraction Free Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <form.Field name="title">
            {(field) => (
              <Field className="mb-6 md:mb-8">
                <input
                  id="title"
                  type="text"
                  placeholder="Page Title"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="w-full text-3xl md:text-4xl font-bold text-foreground placeholder-muted-foreground/30 bg-transparent border-none outline-none focus:ring-0 p-0"
                />
                {field.state.meta.errors.length > 0 && (
                  <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                )}
              </Field>
            )}
          </form.Field>

          <form.Field name="content">
            {(field) => (
              <Field className="flex-1 min-h-[500px]">
                <RichTextEditor
                  value={field.state.value || ""}
                  onChange={(val) => field.handleChange(val)}
                  onBlur={field.handleBlur}
                  placeholder="Start writing..."
                />
                {field.state.meta.errors.length > 0 && (
                  <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                )}
              </Field>
            )}
          </form.Field>
        </div>

        {/* Right column: 30% Settings Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 lg:sticky lg:top-32 h-fit">
          <div className="flex flex-col gap-6 p-6 rounded-xl bg-card border border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Page Settings
            </h3>
            
            <form.Field name="slug">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="slug">URL Slug</FieldLabel>
                  <Input
                    id="slug"
                    placeholder="about-us"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="bg-muted/30 border-border rounded-lg"
                  />
                  <FieldDescription>
                    The URL path for this page (e.g. /pages/about-us)
                  </FieldDescription>
                  {field.state.meta.errors.length > 0 && (
                    <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field name="isPublished">
              {(field) => (
                <Field className="flex-row items-center justify-between pt-4 border-t border-border space-y-0">
                  <div className="flex flex-col">
                    <FieldLabel htmlFor="isPublished" className="mb-1 cursor-pointer">Published Status</FieldLabel>
                    <FieldDescription>Make this page visible online</FieldDescription>
                  </div>
                  <Switch
                    id="isPublished"
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                </Field>
              )}
            </form.Field>
          </div>
        </div>
      </div>
    </form>
  )
}
