"use client"

import React, { useTransition } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { type ColumnDef } from "@tanstack/react-table"
import {
  getProductsAction,
  deleteProductAction,
  toggleProductPublishAction,
  updateProductStockAction,
  toggleProductPromotionAction,
  bulkDeleteProductsAction,
  bulkTogglePublishAction,
  bulkUpdateCategoryAction,
} from "@/app/actions/products"
import { getCategoriesAction } from "@/app/actions/categories"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import {
  Plus,
  ShoppingBag,
  Search,
  Edit2,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  ImageIcon,
  ExternalLink,
  Grid,
  List,
  MoreVertical,
  Filter,
  X,
  Tag,
  FolderOpen
} from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
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
import { cn } from "@/lib/utils"

interface FormattedProduct {
  id: string
  name: string
  price: number
  hasVariants: boolean
  compareAtPrice: number | null
  stockCount: number
  lowStockThreshold: number
  isPublished: boolean
  images: { storagePath: string }[]
  createdAt?: string | Date
  description?: string | null
  slug: string
  category?: { id: string; name: string } | null
  promotions?: { promotionType: string }[]
}

interface ProductsClientProps {
  merchantId: string
  storefrontBaseUrl: string
  initialProducts: FormattedProduct[]
  limitReached?: boolean
}

/* ==========================================
   InlineStockWidget Component
   ========================================== */
interface InlineStockWidgetProps {
  productId: string
  initialStock: number
  lowStockThreshold: number
  onSave: (newStock: number) => Promise<any>
}

export function InlineStockWidget({
  productId,
  initialStock,
  lowStockThreshold,
  onSave,
}: InlineStockWidgetProps) {
  const [stock, setStock] = React.useState(initialStock)
  const [isSaving, setIsSaving] = React.useState(false)
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    setStock(initialStock)
  }, [initialStock])

  const triggerUpdate = async (value: number) => {
    setIsSaving(true)
    try {
      await onSave(value)
    } catch (error) {
      setStock(initialStock)
    } finally {
      setIsSaving(false)
    }
  }

  const handleIncrement = () => {
    const newVal = stock + 1
    setStock(newVal)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      triggerUpdate(newVal)
    }, 600)
  }

  const handleDecrement = () => {
    if (stock <= 0) return
    const newVal = stock - 1
    setStock(newVal)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      triggerUpdate(newVal)
    }, 600)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)
    if (isNaN(val) || val < 0) return
    setStock(val)
  }

  const handleBlur = () => {
    if (stock !== initialStock) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      triggerUpdate(stock)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur()
    }
  }

  const isOutOfStock = stock === 0
  const isLowStock = !isOutOfStock && stock <= lowStockThreshold

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center border border-border rounded-lg bg-muted/10 overflow-hidden min-h-9">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={stock <= 0 || isSaving}
          className="px-2.5 py-1 text-muted-foreground hover:bg-muted/30 active:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none transition-colors border-r border-border cursor-pointer select-none font-semibold text-sm"
        >
          -
        </button>

        <div className="relative flex items-center justify-center w-12 h-full">
          <input
            type="number"
            value={stock}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className="w-full text-center text-sm font-mono font-medium text-foreground bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {isSaving && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={isSaving}
          className="px-2.5 py-1 text-muted-foreground hover:bg-muted/30 active:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none transition-colors border-l border-border cursor-pointer select-none font-semibold text-sm"
        >
          +
        </button>
      </div>

      <span
        title={
          isOutOfStock ? "Out of stock" :
            isLowStock ? `Low stock (Threshold: ${lowStockThreshold})` :
              "In Stock"
        }
        className={cn(
          "h-2.5 w-2.5 rounded-full shrink-0",
          isOutOfStock ? "bg-red-500 animate-pulse" :
            isLowStock ? "bg-amber-500" :
              "bg-emerald-500"
        )}
      />
    </div>
  )
}

/* ==========================================
   ProductsClient Main Component
   ========================================== */
export function ProductsClient({ merchantId, storefrontBaseUrl, initialProducts, limitReached }: ProductsClientProps) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = React.useState(false)
  const [errorAlert, setErrorAlert] = React.useState<{ title: string; message: string } | null>(null)

  // Mobile Bottom Sheet Drawer states
  const [mobileActiveProduct, setMobileActiveProduct] = React.useState<FormattedProduct | null>(null)

  // Layout View Mode
  const [viewMode, setViewMode] = React.useState<"table" | "grid">("table")

  // Selected Products for Bulk Actions (Single Source of Truth)
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})

  // Filter and Sort states
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "published" | "draft">("all")
  const [stockFilter, setStockFilter] = React.useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [sortBy, setSortBy] = React.useState<"newest" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc">("newest")

  // Fetch Categories for filtering & bulk action selection
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", merchantId],
    queryFn: async () => {
      const response = await getCategoriesAction()
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.categories || []
    },
  })

  const { data: products = initialProducts, refetch } = useQuery({
    queryKey: ["products", merchantId],
    queryFn: async () => {
      const response = await getProductsAction()
      if (!response.success) {
        throw new Error(response.error)
      }
      return response.products as FormattedProduct[]
    },
    initialData: initialProducts,
    refetchOnMount: true,
  })

  // Individual mutations
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await deleteProductAction(productId)
      if (!res.success) {
        throw new Error(res.error)
      }
      return productId
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["products", merchantId] })
      setRowSelection((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      refetch()
    },
  })

  const togglePublishMutation = useMutation({
    mutationFn: async ({ productId, isPublished }: { productId: string; isPublished: boolean }) => {
      const res = await toggleProductPublishAction(productId, isPublished)
      if (!res.success) {
        throw new Error(res.error)
      }
      return { productId, isPublished }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", merchantId] })
      refetch()
    },
  })

  const stockMutation = useMutation({
    mutationFn: async ({ productId, stockCount }: { productId: string; stockCount: number }) => {
      const res = await updateProductStockAction(productId, stockCount)
      if (!res.success) {
        throw new Error(res.error)
      }
      return { productId, stockCount }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", merchantId] })
      refetch()
    },
  })

  const togglePromotionMutation = useMutation({
    mutationFn: async ({ productId, promotionType, active }: { productId: string; promotionType: string; active: boolean }) => {
      const res = await toggleProductPromotionAction(productId, promotionType, active)
      if (!res.success) {
        throw new Error(res.error)
      }
      return { productId, promotionType, active }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", merchantId] })
      refetch()
    },
  })

  // Selected IDs array derived from rowSelection
  const selectedIds = React.useMemo(() => {
    return Object.keys(rowSelection).filter((id) => rowSelection[id])
  }, [rowSelection])

  // Bulk mutations
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await bulkDeleteProductsAction(ids)
      if (!res.success) throw new Error(res.error)
      return ids
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", merchantId] })
      setRowSelection({})
      refetch()
    }
  })

  const bulkPublishMutation = useMutation({
    mutationFn: async ({ ids, isPublished }: { ids: string[]; isPublished: boolean }) => {
      const res = await bulkTogglePublishAction(ids, isPublished)
      if (!res.success) throw new Error(res.error)
      return { ids, isPublished }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", merchantId] })
      refetch()
    }
  })

  const bulkCategoryMutation = useMutation({
    mutationFn: async ({ ids, categoryId }: { ids: string[]; categoryId: string | null }) => {
      const res = await bulkUpdateCategoryAction(ids, categoryId)
      if (!res.success) throw new Error(res.error)
      return { ids, categoryId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", merchantId] })
      setRowSelection({})
      refetch()
    }
  })

  const handleDelete = (productId: string, name: string) => {
    setDeleteTarget({ id: productId, name })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err: any) {
      setErrorAlert({
        title: "Delete Failed",
        message: err.message || "Failed to delete product."
      })
    }
  }

  const handleBulkDeleteConfirm = async () => {
    try {
      await bulkDeleteMutation.mutateAsync(selectedIds)
      setBulkDeleteConfirmOpen(false)
    } catch (err: any) {
      setErrorAlert({
        title: "Bulk Delete Failed",
        message: err.message || "Failed to delete selected products."
      })
    }
  }

  const handleTogglePublish = (productId: string, currentStatus: boolean) => {
    startTransition(async () => {
      try {
        await togglePublishMutation.mutateAsync({
          productId,
          isPublished: !currentStatus,
        })
      } catch (err: any) {
        setErrorAlert({
          title: "Status Update Failed",
          message: err.message || "Failed to toggle publish status."
        })
      }
    })
  }

  const handleStockSave = async (productId: string, newStock: number) => {
    try {
      await stockMutation.mutateAsync({ productId, stockCount: newStock })
    } catch (err: any) {
      setErrorAlert({
        title: "Stock Update Failed",
        message: err.message || "Failed to update stock."
      })
      throw err
    }
  }

  const getProductImageUrl = (storagePath: string | undefined) => {
    if (!storagePath) return null
    return supabase.storage.from("product-images").getPublicUrl(storagePath).data.publicUrl
  }

  const getStorefrontProductUrl = (slug: string) => {
    return `${storefrontBaseUrl}/product/${slug}`
  }

  const totalCount = products.length
  const publishedCount = products.filter((p) => p.isPublished).length
  const draftCount = products.filter((p) => !p.isPublished).length

  // Filter logic
  const filteredProducts = React.useMemo(() => {
    return products
      .filter((product) => {
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim()
          const nameMatch = product.name.toLowerCase().includes(query)
          const descMatch = product.description?.toLowerCase().includes(query) || false
          if (!nameMatch && !descMatch) return false
        }

        if (statusFilter !== "all") {
          if (statusFilter === "published" && !product.isPublished) return false
          if (statusFilter === "draft" && product.isPublished) return false
        }

        if (stockFilter !== "all") {
          const isOutOfStock = product.stockCount === 0
          const isLowStock = !isOutOfStock && product.stockCount <= product.lowStockThreshold
          if (stockFilter === "out_of_stock" && !isOutOfStock) return false
          if (stockFilter === "low_stock" && !isLowStock) return false
          if (stockFilter === "in_stock" && (isOutOfStock || isLowStock)) return false
        }

        if (categoryFilter !== "all") {
          if (product.category?.id !== categoryFilter) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price
        if (sortBy === "price_desc") return b.price - a.price
        if (sortBy === "stock_asc") return a.stockCount - b.stockCount
        if (sortBy === "stock_desc") return b.stockCount - a.stockCount

        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })
  }, [products, searchQuery, statusFilter, stockFilter, categoryFilter, sortBy])

  /* ==========================================
     TanStack Table Configuration
     ========================================== */
  const columns = React.useMemo<ColumnDef<FormattedProduct>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "image",
        header: "Item",
        cell: ({ row }) => {
          const imageUrl = getProductImageUrl(row.original.images[0]?.storagePath)
          return (
            <div className="w-12 h-16 bg-muted flex items-center justify-center rounded border border-border overflow-hidden shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={row.original.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          )
        }
      },
      {
        accessorKey: "name",
        header: "Product Details",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 max-w-[200px]">
            <span className="font-semibold text-foreground truncate" title={row.original.name}>
              {row.original.name}
            </span>
            {row.original.description && (
              <span className="text-xs text-muted-foreground truncate" title={row.original.description}>
                {row.original.description}
              </span>
            )}
          </div>
        )
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => {
          const category = row.original.category
          return category ? (
            <Badge
              variant="secondary"
              className="bg-primary/10 hover:bg-primary/15 border-primary/20 text-primary font-semibold flex items-center gap-1.5 py-1 px-3 h-7 rounded-full w-fit whitespace-nowrap"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span>{category.name}</span>
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground italic whitespace-nowrap">Uncategorized</span>
          )
        }
      },
      {
        id: "promotions",
        header: "Promotions",
        cell: ({ row }) => {
          const product = row.original
          return (
            <div className="flex flex-row items-center gap-1.5 whitespace-nowrap">
              {[
                { type: "featured", label: "Featured" },
                { type: "new_arrival", label: "New Arrival" },
                { type: "exclusive", label: "Exclusive" },
              ].map((promo) => {
                const activePromos = product.promotions?.map((p) => p.promotionType) || []
                const isActive = activePromos.includes(promo.type)
                const isLoading = togglePromotionMutation.isPending &&
                  togglePromotionMutation.variables?.productId === product.id &&
                  togglePromotionMutation.variables?.promotionType === promo.type

                return (
                  <button
                    key={promo.type}
                    disabled={isActive ? false : isLoading}
                    onClick={() => togglePromotionMutation.mutate({ productId: product.id, promotionType: promo.type, active: !isActive })}
                    className={cn(
                      "px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded-full border transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none",
                      isActive
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-transparent border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                    )}
                  >
                    {promo.label}
                  </button>
                )
              })}
            </div>
          )
        }
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => (
          <span className="font-mono font-medium text-foreground">
            ৳{row.original.price.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
          </span>
        )
      },
      {
        id: "stock",
        header: "Stock Count",
        cell: ({ row }) => {
          const product = row.original
          return product.hasVariants ? (
            <span
              title={
                product.stockCount === 0 ? "Out of stock" :
                  product.stockCount <= product.lowStockThreshold ? `Low stock (Threshold: ${product.lowStockThreshold})` :
                    "In Stock"
              }
              className="inline-flex items-center gap-1.5 text-xs bg-muted border border-border px-2 py-1.5 rounded-md text-muted-foreground"
            >
              <span className={cn(
                "h-2 w-2 rounded-full shrink-0",
                product.stockCount === 0 ? "bg-red-500 animate-pulse" :
                  product.stockCount <= product.lowStockThreshold ? "bg-amber-500" :
                    "bg-emerald-500"
              )} />
              {product.stockCount} (Variants)
            </span>
          ) : (
            <InlineStockWidget
              productId={product.id}
              initialStock={product.stockCount}
              lowStockThreshold={product.lowStockThreshold}
              onSave={(newStock) => handleStockSave(product.id, newStock)}
            />
          )
        }
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const product = row.original
          return (
            <button
              onClick={() => handleTogglePublish(product.id, product.isPublished)}
              disabled={isPending || deleteMutation.isPending || togglePublishMutation.isPending}
              title={product.isPublished ? "Click to set as Draft" : "Click to Publish"}
              className="cursor-pointer hover:opacity-90 active:scale-95 transition-all duration-200 disabled:pointer-events-none disabled:opacity-75 focus:outline-none"
            >
              {product.isPublished ? (
                <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 rounded-full px-2.5 py-1 font-semibold border border-emerald-500/20">
                  {togglePublishMutation.isPending && togglePublishMutation.variables?.productId === product.id ? (
                    <Loader2 className="h-3 w-3 animate-spin text-foreground" />
                  ) : (
                    <Eye className="h-3 w-3 stroke-2" />
                  )}
                  <span>Published</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs bg-muted text-muted-foreground rounded-full px-2.5 py-1 font-semibold border border-border">
                  {togglePublishMutation.isPending && togglePublishMutation.variables?.productId === product.id ? (
                    <Loader2 className="h-3 w-3 animate-spin text-foreground" />
                  ) : (
                    <EyeOff className="h-3 w-3 stroke-2" />
                  )}
                  <span>Draft</span>
                </span>
              )}
            </button>
          )
        }
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const product = row.original
          return (
            <div className="flex items-center justify-end gap-2.5">
              <a
                href={getStorefrontProductUrl(product.slug)}
                target="_blank"
                rel="noopener noreferrer"
                title="View on storefront"
                className="text-muted-foreground hover:text-foreground cursor-pointer p-1.5 hover:bg-muted rounded-full transition-colors"
              >
                <ExternalLink className="h-4.5 w-4.5" />
              </a>

              <Link href={`/dashboard/products/${product.id}/edit`}>
                <button
                  title="Edit Product"
                  className="text-muted-foreground hover:text-foreground cursor-pointer p-1.5 hover:bg-muted rounded-full transition-colors"
                >
                  <Edit2 className="h-4.5 w-4.5" />
                </button>
              </Link>

              <button
                onClick={() => handleDelete(product.id, product.name)}
                disabled={isPending || deleteMutation.isPending}
                title="Delete Product"
                className="text-red-500 hover:text-red-700 cursor-pointer p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending && deleteMutation.variables === product.id ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin text-red-500" />
                ) : (
                  <Trash2 className="h-4.5 w-4.5" />
                )}
              </button>
            </div>
          )
        }
      }
    ],
    [isPending, deleteMutation.isPending, togglePublishMutation.isPending, togglePromotionMutation.isPending]
  )



  const statusTabs = [
    { label: "All", value: "all", count: totalCount },
    { label: "Published", value: "published", count: publishedCount },
    { label: "Draft", value: "draft", count: draftCount },
  ]

  const activeCategoryObject = categories.find((c) => c.id === categoryFilter)

  // Toggle selection for a single card in Grid View
  const handleToggleSelectGrid = (id: string) => {
    setRowSelection((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <div className="flex flex-col gap-6 text-foreground pb-24 relative font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl tracking-tight text-foreground font-semibold leading-none">
            Product Management
          </h1>
          <p className="text-sm text-muted-foreground font-light mt-1">
            Manage your store items, stock levels, and storefront publishing details
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle Group */}
          <div className="hidden md:flex border border-border bg-muted/30 p-1 rounded-xl items-center select-none gap-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-2 rounded-lg cursor-pointer transition-all",
                viewMode === "table" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-lg cursor-pointer transition-all",
                viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>

          {limitReached ? (
            <Button
              disabled
              className="w-full sm:w-fit flex items-center gap-2 cursor-not-allowed"
              title="Product limit reached for your subscription plan"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Add Product (Limit Reached)</span>
            </Button>
          ) : (
            <Link href="/dashboard/products/new">
              <Button className="w-full sm:w-fit flex items-center gap-2">
                <Plus className="h-4.5 w-4.5" />
                <span>Add Product</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        /* Empty State */
        <Card className="flex flex-col items-center justify-center text-center p-12 border border-border bg-card max-w-xl mx-auto mt-6 w-full rounded-xl">
          <div className="p-4 bg-muted text-muted-foreground rounded-full mb-4">
            <ShoppingBag className="h-10 w-10 stroke-[1.5]" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No products listed
          </h3>
          <p className="text-sm text-muted-foreground font-light max-w-sm mt-2 mb-6">
            Get started by adding your first product. It will show up immediately on your storefront.
          </p>
          {limitReached ? (
            <Button disabled className="cursor-not-allowed">
              Create First Product (Limit Reached)
            </Button>
          ) : (
            <Link href="/dashboard/products/new">
              <Button>
                Create First Product
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Controls: Search, Tabs, Dropdowns */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              {/* Left Side: Status filter segmented control */}
              <div className="flex bg-muted/65 p-1 rounded-full gap-1 items-center select-none w-fit border border-border overflow-x-auto max-w-full">
                {statusTabs.map((tab) => {
                  const isActive = statusFilter === tab.value
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setStatusFilter(tab.value as any)}
                      className={cn(
                        "px-5 py-1.5 rounded-full text-sm font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-2",
                        isActive
                          ? "bg-background text-foreground shadow-sm border border-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <span>{tab.label}</span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                        isActive ? "bg-muted text-foreground" : "bg-muted/60 text-muted-foreground"
                      )}>
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Right Side: Select Dropdowns */}
              <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
                {/* Category Filter */}
                <div className="flex items-center gap-2 grow sm:grow-0">
                  <span className="text-sm text-muted-foreground font-medium">Category:</span>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[150px] rounded-xl border-border bg-card">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stock Level Filter */}
                <div className="flex items-center gap-2 grow sm:grow-0">
                  <span className="text-sm text-muted-foreground font-medium">Stock:</span>
                  <Select value={stockFilter} onValueChange={(val) => setStockFilter(val as any)}>
                    <SelectTrigger className="w-[140px] rounded-xl border-border bg-card">
                      <SelectValue placeholder="Stock Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="low_stock">Low Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order */}
                <div className="flex items-center gap-2 grow sm:grow-0">
                  <span className="text-sm text-muted-foreground font-medium">Sort:</span>
                  <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
                    <SelectTrigger className="w-[160px] rounded-xl border-border bg-card">
                      <SelectValue placeholder="Sort order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="price_asc">Price: Low to High</SelectItem>
                      <SelectItem value="price_desc">Price: High to Low</SelectItem>
                      <SelectItem value="stock_asc">Stock: Low to High</SelectItem>
                      <SelectItem value="stock_desc">Stock: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by product name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm border border-border bg-card text-foreground placeholder-muted-foreground rounded-full pl-10 pr-4 py-2.5 min-h-10 outline-none focus:border-muted-foreground transition-all font-sans"
              />
            </div>

            {/* Active Filter Chips */}
            {(categoryFilter !== "all" || stockFilter !== "all" || searchQuery.trim() !== "") && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Filters:
                </span>

                {searchQuery.trim() !== "" && (
                  <span className="inline-flex items-center gap-1 text-xs bg-muted border border-border rounded-full pl-2.5 pr-1 py-1 font-medium text-foreground">
                    Search: &ldquo;{searchQuery}&rdquo;
                    <button onClick={() => setSearchQuery("")} className="hover:bg-muted/80 rounded-full p-0.5 ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {categoryFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 text-xs bg-muted border border-border rounded-full pl-2.5 pr-1 py-1 font-medium text-foreground">
                    Category: {activeCategoryObject?.name || "Selected"}
                    <button onClick={() => setCategoryFilter("all")} className="hover:bg-muted/80 rounded-full p-0.5 ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {stockFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 text-xs bg-muted border border-border rounded-full pl-2.5 pr-1 py-1 font-medium text-foreground">
                    Stock: {stockFilter.replace("_", " ")}
                    <button onClick={() => setStockFilter("all")} className="hover:bg-muted/80 rounded-full p-0.5 ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={() => {
                    setSearchQuery("")
                    setCategoryFilter("all")
                    setStockFilter("all")
                  }}
                  className="text-xs text-primary hover:underline font-semibold ml-2"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* List Area */}
          {filteredProducts.length === 0 ? (
            <Card className="flex flex-col items-center justify-center text-center p-12 border border-border bg-card max-w-xl mx-auto w-full mt-4 rounded-xl">
              <div className="p-4 bg-muted text-muted-foreground rounded-full mb-4">
                <Search className="h-8 w-8 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                No matching products
              </h3>
              <p className="text-sm text-muted-foreground font-light max-w-sm mt-2">
                Try adjusting your search criteria, stock levels, or status filters.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">

              {viewMode === "table" && (
                <div className="hidden md:block">
                  <DataTable
                    columns={columns}
                    data={filteredProducts}
                    getRowId={(row) => row.id}
                    rowSelection={rowSelection}
                    onRowSelectionChange={setRowSelection}
                  />
                </div>
              )}

              {/* Desktop Grid View (>= md viewports and viewMode === "grid") */}
              {viewMode === "grid" && (
                <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredProducts.map((product) => {
                    const imageUrl = getProductImageUrl(product.images[0]?.storagePath)
                    const isSelected = !!rowSelection[product.id]

                    return (
                      <Card
                        key={product.id}
                        className={cn(
                          "flex flex-col border border-border bg-card overflow-hidden group hover:shadow-sm transition-all duration-300 relative rounded-xl text-xs",
                          isSelected && "ring-2 ring-primary border-primary bg-muted/5"
                        )}
                      >
                        {/* Checkbox Overlay */}
                        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-background/80 p-1 rounded-md border border-border backdrop-blur-sm">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelectGrid(product.id)}
                            aria-label={`Select ${product.name}`}
                          />
                        </div>

                        {/* Image Preview */}
                        <div className="aspect-square bg-muted/40 relative flex items-center justify-center border-b border-border/50 overflow-hidden">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <ImageIcon className="h-8 w-8 text-muted-foreground/45" />
                          )}

                          {/* Quick Publish Status Badge */}
                          <div className="absolute top-2 right-2">
                            <button
                              onClick={() => handleTogglePublish(product.id, product.isPublished)}
                              className="shadow-sm outline-none cursor-pointer"
                            >
                              {product.isPublished ? (
                                <span className="inline-flex items-center text-[9px] bg-emerald-500 text-white font-bold rounded-full px-2 py-0.5 tracking-wider uppercase border border-emerald-600/20">
                                  Published
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[9px] bg-muted/80 backdrop-blur-sm text-muted-foreground font-bold rounded-full px-2 py-0.5 tracking-wider uppercase border border-border">
                                  Draft
                                </span>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Contents */}
                        <div className="flex flex-col flex-1 p-3 gap-2 min-w-0">
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              {product.category ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-primary/10 hover:bg-primary/15 border-primary/20 text-primary font-semibold flex items-center gap-1 py-0.5 px-2.5 h-6 rounded-full w-fit whitespace-nowrap text-[10px]"
                                >
                                  <FolderOpen className="h-3 w-3" />
                                  <span className="truncate max-w-[70px]">{product.category.name}</span>
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic truncate">Uncategorized</span>
                              )}
                              <span className="font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                                ৳{product.price.toLocaleString("en-BD")}
                              </span>
                            </div>
                            <h3 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors mt-0.5" title={product.name}>
                              {product.name}
                            </h3>
                          </div>

                          {/* Stock Count */}
                          <div className="border-t border-border/50 pt-2 flex items-center justify-between mt-auto">
                            <span className="text-[10px] text-muted-foreground font-medium">Stock:</span>
                            {product.hasVariants ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-muted border border-border px-1.5 py-0.5 rounded-md font-semibold text-muted-foreground">
                                <span className={cn(
                                  "h-1.5 w-1.5 rounded-full shrink-0",
                                  product.stockCount === 0 ? "bg-red-500" :
                                    product.stockCount <= product.lowStockThreshold ? "bg-amber-500" :
                                      "bg-emerald-500"
                                )} />
                                {product.stockCount} (Var)
                              </span>
                            ) : (
                              <InlineStockWidget
                                productId={product.id}
                                initialStock={product.stockCount}
                                lowStockThreshold={product.lowStockThreshold}
                                onSave={(newStock) => handleStockSave(product.id, newStock)}
                              />
                            )}
                          </div>
                        </div>

                        {/* Hover Footer Actions */}
                        <div className="border-t border-border/50 p-2 bg-muted/20 flex items-center justify-between gap-2">
                          <a
                            href={getStorefrontProductUrl(product.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Live</span>
                          </a>

                          <div className="flex gap-1.5">
                            <Link href={`/dashboard/products/${product.id}/edit`}>
                              <button
                                title="Edit Product"
                                className="text-muted-foreground hover:text-foreground cursor-pointer p-1 hover:bg-muted rounded-md transition-colors border border-border"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            </Link>

                            <button
                              onClick={() => handleDelete(product.id, product.name)}
                              title="Delete Product"
                              className="text-red-500 hover:text-red-700 cursor-pointer p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors border border-red-200 dark:border-red-950/30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}

              {/* Mobile Card View (< md viewports) */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredProducts.map((product) => {
                  const imageUrl = getProductImageUrl(product.images[0]?.storagePath)
                  const isSelected = !!rowSelection[product.id]

                  return (
                    <Card
                      key={product.id}
                      className={cn(
                        "flex flex-col border border-border bg-card p-4 gap-4 relative",
                        isSelected && "ring-2 ring-primary border-primary bg-muted/5"
                      )}
                    >
                      <div className="flex gap-3.5 items-start">
                        {/* Checkbox Overlay for Mobile */}
                        <div className="absolute top-3 left-3 z-10 bg-background/80 p-1 rounded-lg border border-border backdrop-blur-sm">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelectGrid(product.id)}
                            aria-label={`Select ${product.name}`}
                          />
                        </div>

                        <div className="w-16 h-20 bg-muted flex items-center justify-center rounded border border-border overflow-hidden shrink-0">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex flex-col gap-1 grow min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex flex-col gap-1 min-w-0">
                              <h3 className="text-base font-semibold text-foreground truncate pl-6">
                                {product.name}
                              </h3>
                              {product.category && (
                                <Badge
                                  variant="secondary"
                                  className="bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5 py-0.5 px-2.5 h-6 rounded-full w-fit whitespace-nowrap text-[10px] self-start"
                                >
                                  <FolderOpen className="h-3 w-3" />
                                  <span>{product.category.name}</span>
                                </Badge>
                              )}
                            </div>

                            {/* Mobile Options Trigger (Bottom Sheet) */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-8 w-8 hover:bg-muted"
                              onClick={() => setMobileActiveProduct(product)}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <span className="font-sans text-sm font-semibold text-foreground">
                              ৳{product.price.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                            </span>

                            {product.isPublished ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 rounded-full px-2 py-0.5 font-semibold border border-emerald-500/20">
                                <Eye className="h-2.5 w-2.5 stroke-[2.5]" />
                                <span>Published</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-semibold border border-border">
                                <EyeOff className="h-2.5 w-2.5 stroke-[2.5]" />
                                <span>Draft</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stock management row */}
                      <div className="flex items-center justify-between border-t border-border/50 pt-3">
                        <span className="text-xs text-muted-foreground font-medium">Stock Level:</span>
                        {product.hasVariants ? (
                          <span className="inline-flex items-center gap-1.5 text-xs bg-muted border border-border px-2 py-1 rounded-md font-semibold text-muted-foreground">
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0",
                              product.stockCount === 0 ? "bg-red-500 animate-pulse" :
                                product.stockCount <= product.lowStockThreshold ? "bg-amber-500" :
                                  "bg-emerald-500"
                            )} />
                            {product.stockCount} (Variants)
                          </span>
                        ) : (
                          <InlineStockWidget
                            productId={product.id}
                            initialStock={product.stockCount}
                            lowStockThreshold={product.lowStockThreshold}
                            onSave={(newStock) => handleStockSave(product.id, newStock)}
                          />
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>

            </div>
          )}
        </div>
      )}

      {/* Bulk Actions Floating Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-popover/90 backdrop-blur-md border border-border shadow-2xl rounded-2xl px-5 py-3 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 max-w-[90vw] md:max-w-2xl w-full">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground text-xs font-bold font-mono px-2 py-1 rounded-md">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">selected</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk Publish */}
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs flex items-center gap-1 rounded-xl"
              onClick={() => bulkPublishMutation.mutate({ ids: selectedIds, isPublished: true })}
              disabled={bulkPublishMutation.isPending}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Publish</span>
            </Button>

            {/* Bulk Draft */}
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs flex items-center gap-1 rounded-xl"
              onClick={() => bulkPublishMutation.mutate({ ids: selectedIds, isPublished: false })}
              disabled={bulkPublishMutation.isPending}
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Draft</span>
            </Button>

            {/* Bulk Category Assign */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs flex items-center gap-1 rounded-xl">
                  <Tag className="h-3.5 w-3.5" />
                  <span>Category</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Move to Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => bulkCategoryMutation.mutate({ ids: selectedIds, categoryId: null })}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  <span>Uncategorized</span>
                </DropdownMenuItem>
                {categories.map((c) => (
                  <DropdownMenuItem key={c.id} onClick={() => bulkCategoryMutation.mutate({ ids: selectedIds, categoryId: c.id })}>
                    <Tag className="mr-2 h-4 w-4" />
                    <span>{c.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Bulk Delete */}
            <Button
              variant="destructive"
              size="sm"
              className="h-9 text-xs flex items-center gap-1 rounded-xl"
              onClick={() => setBulkDeleteConfirmOpen(true)}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </Button>
          </div>

          <button
            onClick={() => setRowSelection({})}
            className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-full"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Mobile Drawer (Bottom Sheet) Action Menu */}
      <Drawer open={!!mobileActiveProduct} onOpenChange={(open) => !open && setMobileActiveProduct(null)}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle className="text-left font-semibold text-lg">{mobileActiveProduct?.name}</DrawerTitle>
              <DrawerDescription className="text-left text-xs">
                {mobileActiveProduct?.description || "Choose an action for this product"}
              </DrawerDescription>
            </DrawerHeader>

            <div className="p-4 flex flex-col gap-2">
              {/* Edit Option */}
              <Link href={`/dashboard/products/${mobileActiveProduct?.id}/edit`} onClick={() => setMobileActiveProduct(null)}>
                <Button variant="outline" className="w-full justify-start gap-3 h-11 text-sm rounded-xl">
                  <Edit2 className="h-4 w-4 text-muted-foreground" />
                  <span>Edit Product Details</span>
                </Button>
              </Link>

              {/* Toggle Publish Option */}
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-11 text-sm rounded-xl"
                onClick={() => {
                  if (mobileActiveProduct) {
                    handleTogglePublish(mobileActiveProduct.id, mobileActiveProduct.isPublished)
                    setMobileActiveProduct(null)
                  }
                }}
              >
                {mobileActiveProduct?.isPublished ? (
                  <>
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                    <span>Set as Draft</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>Publish to Storefront</span>
                  </>
                )}
              </Button>

              {/* View Storefront Option */}
              {mobileActiveProduct && (
                <a
                  href={getStorefrontProductUrl(mobileActiveProduct.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileActiveProduct(null)}
                >
                  <Button variant="outline" className="w-full justify-start gap-3 h-11 text-sm rounded-xl">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span>View on Storefront</span>
                  </Button>
                </a>
              )}

              {/* Delete Option */}
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-11 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-100 hover:border-red-200 rounded-xl mt-2"
                onClick={() => {
                  if (mobileActiveProduct) {
                    handleDelete(mobileActiveProduct.id, mobileActiveProduct.name)
                    setMobileActiveProduct(null)
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
                <span>Delete Product</span>
              </Button>
            </div>

            <DrawerFooter className="pt-2">
              <DrawerClose asChild>
                <Button variant="ghost" className="rounded-xl">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Individual Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && !deleteMutation.isPending && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product and all associated images will be permanently deleted.
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
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Alert Dialog */}
      <AlertDialog open={bulkDeleteConfirmOpen} onOpenChange={(open) => !open && !bulkDeleteMutation.isPending && setBulkDeleteConfirmOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} Products?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All {selectedIds.length} selected products and their associated images will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending} onClick={() => setBulkDeleteConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkDeleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault()
                handleBulkDeleteConfirm()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Delete Products
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Alert Dialog */}
      <AlertDialog open={!!errorAlert} onOpenChange={(open) => !open && setErrorAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{errorAlert?.title || "Error"}</AlertDialogTitle>
            <AlertDialogDescription>
              {errorAlert?.message || "An unexpected error occurred."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorAlert(null)}>
              Acknowledge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
