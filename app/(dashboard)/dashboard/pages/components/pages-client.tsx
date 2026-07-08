"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, FileText, Pencil, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/primitives/Button"
import { Badge } from "@/components/ui/primitives/Badge"
import { Card } from "@/components/ui/layout/Card"
import { AlertDialog } from "@/components/ui/feedback/AlertDialog"
import { deletePageAction } from "@/app/actions/pages"
import Link from "next/link"
import { getPages } from "@/db/queries/pages"

type Page = Awaited<ReturnType<typeof getPages>>[0]

interface PagesClientProps {
  initialPages: Page[]
  merchantId: string
}

export function PagesClient({ initialPages, merchantId }: PagesClientProps) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

  const { data: pages = initialPages } = useQuery({
    queryKey: ["pages", merchantId],
    queryFn: async () => initialPages, // Simplified, since we'll rely on initial data and revalidation
    initialData: initialPages,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deletePageAction(id)
      if (!res.success) throw new Error(res.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", merchantId] })
      window.location.reload()
    },
  })

  const filteredPages = pages.filter((page) =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title })
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null)
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-shade-40">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-caption border border-hairline-light rounded-full pl-10 pr-4 py-2.5 min-h-10 bg-canvas-light text-ink placeholder-shade-40 outline-none focus:border-shade-60 transition-all font-sans"
          />
        </div>

        <Link href="/dashboard/pages/new" passHref legacyBehavior>
          <Button
            id="create-page-btn"
            variant="primary"
            className="flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center rounded-full"
          >
            <Plus className="h-4 w-4" />
            <span>Create Page</span>
          </Button>
        </Link>
      </div>

      {pages.length === 0 ? (
        /* Empty State */
        <Card
          variant="default"
          className="flex flex-col items-center justify-center text-center p-12 border border-hairline-light bg-canvas-light rounded-2xl"
        >
          <div className="p-3 bg-pistachio-10 rounded-full mb-4">
            <FileText className="h-8 w-8 text-ink stroke-1.5" />
          </div>
          <h3 className="font-display text-heading-md font-semibold text-ink">
            No pages yet
          </h3>
          <p className="text-caption text-shade-50 font-light max-w-sm mt-2 mb-6">
            Create standard pages like "About Us" or "Shipping Policy" to provide more information to your customers.
          </p>
          <Link href="/dashboard/pages/new" passHref legacyBehavior>
            <Button
              id="create-first-page-btn"
              variant="primary"
              className="rounded-full"
            >
              Create First Page
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Desktop Table View (>= md viewports) */}
          <div className="hidden md:block border border-hairline-light rounded-2xl bg-canvas-light overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-hairline-light bg-canvas-cream/30">
                <tr>
                  <th className="px-5 py-3 text-micro font-bold text-shade-40 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-5 py-3 text-micro font-bold text-shade-40 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-5 py-3 text-micro font-bold text-shade-40 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-micro font-bold text-shade-40 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-light">
                {filteredPages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-caption text-shade-40 italic">
                      No matching pages found.
                    </td>
                  </tr>
                ) : (
                  filteredPages.map((page) => (
                    <tr key={page.id} className="hover:bg-canvas-cream/10 transition-colors">
                      {/* Title */}
                      <td className="px-5 py-3.5 text-body-strong font-semibold text-ink">
                        {page.title}
                      </td>

                      {/* Slug */}
                      <td className="px-5 py-3.5 text-caption text-shade-60 font-mono">
                        {page.slug}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <Badge variant={page.isPublished ? "mint" : "shade"}>
                          {page.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/pages/${page.id}`} passHref legacyBehavior>
                            <button
                              className="p-1.5 hover:bg-canvas-cream rounded-md transition-colors text-shade-50 hover:text-ink cursor-pointer"
                              title="Edit Page"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(page.id, page.title)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 hover:bg-red-50 rounded-md transition-colors text-shade-50 hover:text-red-600 cursor-pointer disabled:opacity-50"
                            title="Delete Page"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (< md viewports) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredPages.length === 0 ? (
              <div className="text-center p-8 text-caption text-shade-40 italic bg-canvas-light border border-hairline-light rounded-2xl">
                No matching pages found.
              </div>
            ) : (
              filteredPages.map((page) => (
                <Card
                  key={page.id}
                  className="flex flex-col border border-hairline-light bg-canvas-light p-4 gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1 min-w-0">
                      <h3 className="text-body-strong font-bold text-ink truncate">
                        {page.title}
                      </h3>
                      <span className="text-caption text-shade-50 font-mono truncate">
                        {page.slug}
                      </span>
                    </div>

                    <Badge variant={page.isPublished ? "mint" : "shade"} className="shrink-0 font-medium">
                      {page.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>

                  <div className="flex gap-3 border-t border-hairline-light/50 pt-3 mt-1">
                    <Link href={`/dashboard/pages/${page.id}`} passHref legacyBehavior>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 justify-center items-center gap-1.5 py-2 min-h-10 cursor-pointer"
                      >
                        <Pencil className="h-4 w-4 text-shade-50" />
                        <span>Edit</span>
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(page.id, page.title)}
                      disabled={deleteMutation.isPending}
                      className="flex-1 justify-center items-center gap-1.5 py-2 min-h-10 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Page "${deleteTarget?.title}"?`}
        description="This action cannot be undone and will remove the page from your storefront."
        confirmText="Delete Page"
        variant="danger"
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
