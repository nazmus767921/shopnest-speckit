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

        <Button
          as={Link}
          href="/dashboard/pages/new"
          id="create-page-btn"
          variant="primary"
          className="flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center rounded-full"
        >
          <Plus className="h-4 w-4" />
          <span>Create Page</span>
        </Button>
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
          <Button
            as={Link}
            href="/dashboard/pages/new"
            id="create-first-page-btn"
            variant="primary"
            className="rounded-full"
          >
            Create First Page
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPages.length === 0 ? (
            <div className="text-center p-8 text-caption text-shade-40 italic bg-canvas-light border border-hairline-light rounded-2xl">
              No matching pages found.
            </div>
          ) : (
            filteredPages.map((page) => (
              <div 
                key={page.id} 
                className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-5 border border-transparent bg-canvas-light hover:border-hairline-light hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] rounded-2xl transition-all"
              >
                <Link href={`/dashboard/pages/${page.id}`} className="absolute inset-0 z-0 rounded-2xl" />
                
                <div className="flex flex-col gap-1 min-w-0 flex-1 z-10 pointer-events-none">
                  <div className="flex items-center gap-3">
                    <h3 className="text-body-strong font-semibold text-ink truncate">
                      {page.title}
                    </h3>
                    <Badge variant={page.isPublished ? "mint" : "shade"} className="shrink-0 font-medium h-5 text-[10px] uppercase tracking-wider">
                      {page.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <span className="text-caption text-shade-50 font-mono truncate">
                    /{page.slug}
                  </span>
                </div>

                <div className="flex md:opacity-0 md:-translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0 transition-all duration-200 ease-out gap-2 mt-2 md:mt-0 z-10">
                  <Button
                    as={Link}
                    href={`/dashboard/pages/${page.id}`}
                    variant="outline"
                    size="sm"
                    className="flex-1 md:flex-none justify-center items-center gap-1.5 rounded-full py-1.5 h-8 bg-canvas-cream hover:bg-canvas-light cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="md:hidden">Edit</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(page.id, page.title)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 md:flex-none justify-center items-center gap-1.5 rounded-full py-1.5 h-8 bg-canvas-cream hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="md:hidden">Delete</span>
                  </Button>
                </div>
              </div>
            ))
          )}
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
