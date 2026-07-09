"use client"

import React, { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { pageSchema, PageFormValues } from "@/lib/validations/pages"
import { createPageAction, updatePageAction } from "@/app/actions/pages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label as FormLabel } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import dynamic from "next/dynamic"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

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
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <span className="text-base font-semibold leading-none">
              {isEditing ? "Edit Page" : "Create Page"}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">
              {mutation.isPending ? "Saving..." : (isEditing ? "Saved" : "Unsaved")}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                type="submit"
                className="rounded-md px-6"
                disabled={isSubmitting || mutation.isPending}
              >
                {isSubmitting || mutation.isPending ? "Publishing..." : "Publish"}
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
              <div className="flex flex-col gap-1.5 mb-6 md:mb-8">
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
                  <span className="text-[10px] text-destructive">{String(field.state.meta.errors[0])}</span>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="content">
            {(field) => (
              <div className="flex flex-col gap-1.5 flex-1 min-h-[500px]">
                <RichTextEditor
                  value={field.state.value || ""}
                  onChange={(val) => field.handleChange(val)}
                  onBlur={field.handleBlur}
                  placeholder="Start writing..."
                />
                {field.state.meta.errors.length > 0 && (
                  <span className="text-[10px] text-destructive">{String(field.state.meta.errors[0])}</span>
                )}
              </div>
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
                <div className="flex flex-col gap-1.5">
                  <FormLabel htmlFor="slug">URL Slug</FormLabel>
                  <Input
                    id="slug"
                    placeholder="about-us"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className="bg-muted/30 border-border rounded-lg"
                  />
                  <p className="text-xs text-muted-foreground leading-snug mt-1">
                    The URL path for this page (e.g. /pages/about-us)
                  </p>
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-[10px] text-destructive">{String(field.state.meta.errors[0])}</span>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="isPublished">
              {(field) => (
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex flex-col">
                    <FormLabel htmlFor="isPublished" className="mb-1 cursor-pointer">Published Status</FormLabel>
                    <span className="text-xs text-muted-foreground">Make this page visible online</span>
                  </div>
                  <Switch
                    id="isPublished"
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                </div>
              )}
            </form.Field>
          </div>
        </div>
      </div>
    </form>
  )
}
