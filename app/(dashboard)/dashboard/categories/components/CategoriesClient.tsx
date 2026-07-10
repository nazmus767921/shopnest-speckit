"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Plus, FolderTree, Pencil, Trash2, Search, Info, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { CategoryModal } from "./CategoryModal"
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
import { getCategoriesAction, deleteCategoryAction } from "@/app/actions/categories"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  merchantId: string
  name: string
  slug: string
  createdAt: Date
  updatedAt: Date
  productCount: number
}

interface CategoriesClientProps {
  initialCategories: Category[]
  merchantId: string
  plan: string
}

export function CategoriesClient({ initialCategories, merchantId, plan }: CategoriesClientProps) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const { data: categories = initialCategories } = useQuery({
    queryKey: ["categories", merchantId],
    queryFn: async () => {
      const res = await getCategoriesAction()
      if (!res.success) throw new Error(res.error)
      return (res.categories ?? []) as Category[]
    },
    initialData: initialCategories,
    staleTime: 30_000,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteCategoryAction(id)
      if (!res.success) throw new Error(res.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", merchantId] })
      queryClient.invalidateQueries({ queryKey: ["products", merchantId] })
    },
  })

  const limit = plan === "starter" ? 5 : plan === "growth" ? 15 : Infinity
  const isLimitReached = categories.length >= limit

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenCreate = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name })
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null)
      },
    })
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    queryClient.invalidateQueries({ queryKey: ["categories", merchantId] })
  }

  const columns = React.useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Category Name",
        cell: ({ row }) => (
          <span className="text-base font-semibold text-foreground">
            {row.original.name}
          </span>
        )
      },
      {
        accessorKey: "slug",
        header: "Slug",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground font-mono">
            {row.original.slug}
          </span>
        )
      },
      {
        accessorKey: "productCount",
        header: "Product Count",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.productCount} product{row.original.productCount !== 1 ? "s" : ""}
          </span>
        )
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const cat = row.original
          return (
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(cat)}
                className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                title="Edit Category"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                disabled={deleteMutation.isPending}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors text-muted-foreground hover:text-red-650 cursor-pointer disabled:opacity-50"
                title="Delete Category"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        }
      }
    ],
    [deleteMutation.isPending]
  )

  return (
    <div className="flex flex-col gap-6 text-foreground">
      {/* Plan limit indicator banner */}
      <div className="bg-muted/10 border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-emerald-800 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-base font-semibold text-foreground">
              Plan Categories Usage
            </span>
            <span className="text-sm text-muted-foreground font-light">
              Your boutique is on the <strong className="font-semibold text-foreground capitalize">{plan}</strong> plan.
              {limit !== Infinity ? (
                <span> You can create up to {limit} categories.</span>
              ) : (
                <span> You have unlimited categories.</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-bold text-foreground bg-background border border-border px-3 py-1 rounded-full">
            {categories.length} {limit !== Infinity ? `/ ${limit}` : ""} Used
          </span>
          {limit !== Infinity && (
            <Badge variant={isLimitReached ? "secondary" : "default"} className={isLimitReached ? "bg-red-50 text-red-700 dark:bg-red-950/20" : ""}>
              {isLimitReached ? "Limit Reached" : `${limit - categories.length} Remaining`}
            </Badge>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-muted-foreground">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm border border-border rounded-full pl-10 pr-4 py-2.5 min-h-10 bg-card text-foreground placeholder-muted-foreground outline-none focus:border-muted-foreground transition-all font-sans"
          />
        </div>

        <Button
          id="create-category-btn"
          variant={isLimitReached ? "outline" : "default"}
          onClick={handleOpenCreate}
          disabled={isLimitReached}
          className="flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center rounded-md"
        >
          <Plus className="h-4 w-4" />
          <span>{isLimitReached ? "Plan Limit Reached" : "Create Category"}</span>
        </Button>
      </div>

      {categories.length === 0 ? (
        /* Empty State */
        <Card
          className="flex flex-col items-center justify-center text-center p-12 border border-border bg-card rounded-xl"
        >
          <div className="p-3 bg-muted rounded-full mb-4">
            <FolderTree className="h-8 w-8 text-foreground stroke-1.5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No categories yet
          </h3>
          <p className="text-sm text-muted-foreground font-light max-w-sm mt-2 mb-6">
            Create categories to group similar clothing items and help shoppers navigate your collections.
          </p>
          <Button
            id="create-first-category-btn"
            onClick={handleOpenCreate}
            className="rounded-md"
          >
            Create First Category
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Desktop Table View (>= md viewports) */}
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={filteredCategories}
              getRowId={(row) => row.id}
            />
          </div>

          {/* Mobile Cards View (< md viewports) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredCategories.length === 0 ? (
              <div className="text-center p-8 text-sm text-muted-foreground italic bg-card border border-border rounded-xl">
                No matching categories found.
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <Card
                  key={cat.id}
                  className="flex flex-col border border-border bg-card p-4 gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground truncate">
                        {cat.name}
                      </h3>
                      <span className="text-sm text-muted-foreground font-mono truncate">
                        {cat.slug}
                      </span>
                    </div>

                    <Badge variant="default" className="shrink-0 font-medium">
                      {cat.productCount} product{cat.productCount !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <div className="flex gap-3 border-t border-border/50 pt-3 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(cat)}
                      className="flex-1 justify-center items-center gap-1.5 py-2 min-h-10 cursor-pointer"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(cat.id, cat.name)}
                      disabled={deleteMutation.isPending}
                      className="flex-1 justify-center items-center gap-1.5 py-2 min-h-10 border-red-200 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 hover:text-red-700 cursor-pointer disabled:opacity-50"
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <CategoryModal
          editingCategory={editingCategory}
          onClose={handleModalClose}
        />
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && !deleteMutation.isPending && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Associated products will not be deleted but will have their category reference cleared in the database. This action cannot be undone.
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
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
