"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, FileText, Pencil, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
    queryFn: async () => initialPages,
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
    <div className="flex flex-col gap-6 text-foreground">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-muted-foreground">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm border border-border rounded-full pl-10 pr-4 py-2.5 min-h-10 bg-card text-foreground placeholder-muted-foreground outline-none focus:border-muted-foreground transition-all font-sans"
          />
        </div>

        <Button
          render={<Link href="/dashboard/pages/new" className="flex items-center gap-2 justify-center" />}
          id="create-page-btn"
          className="w-full sm:w-auto rounded-md"
        >
          <Plus className="h-4 w-4" />
          <span>Create Page</span>
        </Button>
      </div>

      {pages.length === 0 ? (
        /* Empty State */
        <Card
          className="flex flex-col items-center justify-center text-center p-12 border border-border bg-card rounded-xl"
        >
          <div className="p-3 bg-muted rounded-full mb-4">
            <FileText className="h-8 w-8 text-foreground stroke-1.5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No pages yet
          </h3>
          <p className="text-sm text-muted-foreground font-light max-w-sm mt-2 mb-6">
            Create standard pages like "About Us" or "Shipping Policy" to provide more information to your customers.
          </p>
          <Button
            render={<Link href="/dashboard/pages/new" className="flex items-center gap-2 justify-center" />}
            id="create-first-page-btn"
            className="rounded-md"
          >
            Create First Page
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPages.length === 0 ? (
            <div className="text-center p-8 text-sm text-muted-foreground italic bg-card border border-border rounded-xl">
              No matching pages found.
            </div>
          ) : (
            filteredPages.map((page) => (
              <div 
                key={page.id} 
                className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-5 border border-border bg-card hover:shadow-sm rounded-xl transition-all"
              >
                <Link href={`/dashboard/pages/${page.id}`} className="absolute inset-0 z-0 rounded-xl" />
                
                <div className="flex flex-col gap-1 min-w-0 flex-1 z-10 pointer-events-none">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-foreground truncate">
                      {page.title}
                    </h3>
                    <Badge variant={page.isPublished ? "default" : "secondary"} className="shrink-0 font-medium h-5 text-[10px] uppercase tracking-wider">
                      {page.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground font-mono truncate">
                    /{page.slug}
                  </span>
                </div>

                <div className="flex md:opacity-0 md:-translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0 transition-all duration-200 ease-out gap-2 mt-2 md:mt-0 z-10">
                  <Button
                    render={<Link href={`/dashboard/pages/${page.id}`} />}
                    variant="outline"
                    size="sm"
                    className="flex-1 md:flex-none justify-center items-center gap-1.5 rounded-md py-1.5 h-8 bg-muted hover:bg-card cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="md:hidden">Edit</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(page.id, page.title)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 md:flex-none justify-center items-center gap-1.5 rounded-md py-1.5 h-8 bg-muted hover:bg-destructive/15 hover:text-destructive hover:border-destructive/20 cursor-pointer disabled:opacity-50 transition-colors"
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
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && !deleteMutation.isPending && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page &ldquo;{deleteTarget?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone and will remove the page from your storefront.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending} onClick={() => setDeleteTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault()
                handleDeleteConfirm()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Delete Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
