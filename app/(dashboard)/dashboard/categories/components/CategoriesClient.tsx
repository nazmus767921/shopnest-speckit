"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, FolderTree, Pencil, Trash2, Search, Info } from "lucide-react"
import { Button } from "@/components/ui/primitives/Button"
import { Badge } from "@/components/ui/primitives/Badge"
import { Card } from "@/components/ui/layout/Card"
import { CategoryModal } from "./CategoryModal"
import { AlertDialog } from "@/components/ui/feedback/AlertDialog"
import { getCategoriesAction, deleteCategoryAction } from "@/app/actions/categories"

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

  // Enforce Category Limit
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

  return (
    <div className="flex flex-col gap-6">
      {/* Plan limit indicator banner */}
      <div className="bg-canvas-cream/55 border border-hairline-light rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-emerald-800 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-body-strong font-semibold text-ink">
              Plan Categories Usage
            </span>
            <span className="text-caption text-shade-50 font-light">
              Your boutique is on the <strong className="font-semibold text-ink capitalize">{plan}</strong> plan.
              {limit !== Infinity ? (
                <span> You can create up to {limit} categories.</span>
              ) : (
                <span> You have unlimited categories.</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-body-strong font-bold text-ink bg-white border border-hairline-light px-3 py-1 rounded-full">
            {categories.length} {limit !== Infinity ? `/ ${limit}` : ""} Used
          </span>
          {limit !== Infinity && (
            <Badge variant={isLimitReached ? "shade" : "mint"} className={isLimitReached ? "bg-red-50 text-red-700" : ""}>
              {isLimitReached ? "Limit Reached" : `${limit - categories.length} Remaining`}
            </Badge>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-shade-40">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-caption border border-hairline-light rounded-full pl-10 pr-4 py-2.5 min-h-10 bg-canvas-light text-ink placeholder-shade-40 outline-none focus:border-shade-60 transition-all font-sans"
          />
        </div>

        <Button
          id="create-category-btn"
          variant={isLimitReached ? "outline" : "primary"}
          onClick={handleOpenCreate}
          disabled={isLimitReached}
          className="flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center rounded-full"
        >
          <Plus className="h-4 w-4" />
          <span>{isLimitReached ? "Plan Limit Reached" : "Create Category"}</span>
        </Button>
      </div>

      {categories.length === 0 ? (
        /* Empty State */
        <Card
          variant="default"
          className="flex flex-col items-center justify-center text-center p-12 border border-hairline-light bg-canvas-light rounded-2xl"
        >
          <div className="p-3 bg-pistachio-10 rounded-full mb-4">
            <FolderTree className="h-8 w-8 text-ink stroke-1.5" />
          </div>
          <h3 className="font-display text-heading-md font-semibold text-ink">
            No categories yet
          </h3>
          <p className="text-caption text-shade-50 font-light max-w-sm mt-2 mb-6">
            Create categories to group similar clothing items and help shoppers navigate your collections.
          </p>
          <Button
            id="create-first-category-btn"
            variant="primary"
            onClick={handleOpenCreate}
            className="rounded-full"
          >
            Create First Category
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Desktop Table View (>= md viewports) */}
          <div className="hidden md:block border border-hairline-light rounded-2xl bg-canvas-light overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-hairline-light bg-canvas-cream/30">
                <tr>
                  <th className="px-5 py-3 text-micro font-bold text-shade-40 uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="px-5 py-3 text-micro font-bold text-shade-40 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-5 py-3 text-micro font-bold text-shade-40 uppercase tracking-wider">
                    Product Count
                  </th>
                  <th className="px-5 py-3 text-micro font-bold text-shade-40 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-light">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-caption text-shade-40 italic">
                      No matching categories found.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-canvas-cream/10 transition-colors">
                      {/* Name */}
                      <td className="px-5 py-3.5 text-body-strong font-semibold text-ink">
                        {cat.name}
                      </td>

                      {/* Slug */}
                      <td className="px-5 py-3.5 text-caption text-shade-60 font-mono">
                        {cat.slug}
                      </td>

                      {/* Product count */}
                      <td className="px-5 py-3.5 text-caption text-shade-60">
                        {cat.productCount} product{cat.productCount !== 1 ? "s" : ""}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 hover:bg-canvas-cream rounded-md transition-colors text-shade-50 hover:text-ink cursor-pointer"
                            title="Edit Category"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 hover:bg-red-50 rounded-md transition-colors text-shade-50 hover:text-red-600 cursor-pointer disabled:opacity-50"
                            title="Delete Category"
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
            {filteredCategories.length === 0 ? (
              <div className="text-center p-8 text-caption text-shade-40 italic bg-canvas-light border border-hairline-light rounded-2xl">
                No matching categories found.
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <Card
                  key={cat.id}
                  className="flex flex-col border border-hairline-light bg-canvas-light p-4 gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1 min-w-0">
                      <h3 className="text-body-strong font-bold text-ink truncate">
                        {cat.name}
                      </h3>
                      <span className="text-caption text-shade-50 font-mono truncate">
                        {cat.slug}
                      </span>
                    </div>

                    <Badge variant="mint" className="shrink-0 font-medium">
                      {cat.productCount} product{cat.productCount !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {/* Actions Row at bottom: Side-by-side outline buttons */}
                  <div className="flex gap-3 border-t border-hairline-light/50 pt-3 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(cat)}
                      className="flex-1 justify-center items-center gap-1.5 py-2 min-h-10 cursor-pointer"
                    >
                      <Pencil className="h-4 w-4 text-shade-50" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(cat.id, cat.name)}
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <CategoryModal
          editingCategory={editingCategory}
          onClose={handleModalClose}
        />
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Category "${deleteTarget?.name}"?`}
        description="Associated products will not be deleted but will have their category reference cleared in the database. This action cannot be undone."
        confirmText="Delete Category"
        variant="danger"
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
