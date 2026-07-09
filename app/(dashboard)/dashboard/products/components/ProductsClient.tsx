"use client"

import React, { useTransition } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getProductsAction,
  deleteProductAction,
  toggleProductPublishAction,
  updateProductStockAction,
  toggleProductPromotionAction
} from "@/app/actions/products"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  ExternalLink
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
  const [errorAlert, setErrorAlert] = React.useState<{ title: string; message: string } | null>(null)

  // Filter and Sort states
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "published" | "draft">("all")
  const [stockFilter, setStockFilter] = React.useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all")
  const [sortBy, setSortBy] = React.useState<"newest" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc">("newest")

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

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await deleteProductAction(productId)
      if (!res.success) {
        throw new Error(res.error)
      }
      return productId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", merchantId] })
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
  }, [products, searchQuery, statusFilter, stockFilter, sortBy])

  const statusTabs = [
    { label: "All", value: "all", count: totalCount },
    { label: "Published", value: "published", count: publishedCount },
    { label: "Draft", value: "draft", count: draftCount },
  ]

  return (
    <div className="flex flex-col gap-6 text-foreground">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl tracking-tight text-foreground font-semibold leading-none">
            Product Management
          </h1>
          <p className="text-sm text-muted-foreground font-light mt-1">
            Manage your store items, stock levels, and storefront publishing details
          </p>
        </div>
        {limitReached ? (
          <Button
            disabled
            className="w-full md:w-fit flex items-center gap-2 cursor-not-allowed"
            title="Product limit reached for your subscription plan"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Product (Limit Reached)</span>
          </Button>
        ) : (
          <Link href="/dashboard/products/new">
            <Button className="w-full md:w-fit flex items-center gap-2">
              <Plus className="h-4.5 w-4.5" />
              <span>Add Product</span>
            </Button>
          </Link>
        )}
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Side: Status filter segmented control */}
              <div className="flex bg-muted/65 p-1 rounded-full gap-1 items-center select-none w-fit border border-border">
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
              <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
                <div className="flex items-center gap-2 grow sm:grow-0">
                  <span className="text-sm text-muted-foreground font-medium">Stock:</span>
                  <Select value={stockFilter} onValueChange={(val) => setStockFilter(val as any)}>
                    <SelectTrigger className="w-[140px]">
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

                <div className="flex items-center gap-2 grow sm:grow-0">
                  <span className="text-sm text-muted-foreground font-medium">Sort:</span>
                  <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
                    <SelectTrigger className="w-[160px]">
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
                placeholder="Search by product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm border border-border bg-card text-foreground placeholder-muted-foreground rounded-full pl-10 pr-4 py-2.5 min-h-10 outline-none focus:border-muted-foreground transition-all font-sans"
              />
            </div>
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

              {/* Desktop Table View (>= md viewports) */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full border-collapse text-left text-sm text-foreground">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                      <th className="p-4 w-20">Item</th>
                      <th className="p-4">Product Details</th>
                      <th className="p-4 w-32">Category</th>
                      <th className="p-4 w-52">Promotions</th>
                      <th className="p-4 w-30">Price</th>
                      <th className="p-4 w-55">Stock Count</th>
                      <th className="p-4 w-32">Status</th>
                      <th className="p-4 text-right w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProducts.map((product) => {
                      const imageUrl = getProductImageUrl(product.images[0]?.storagePath)

                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-muted/10 transition-colors duration-150"
                        >
                          <td className="p-4 align-middle">
                            <div className="w-12 h-16 bg-muted flex items-center justify-center rounded border border-border overflow-hidden shrink-0">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </td>
                          <td className="p-4 align-middle font-sans">
                            <div className="flex flex-col gap-0.5 max-w-50">
                              <span className="font-semibold text-foreground truncate" title={product.name}>
                                {product.name}
                              </span>
                              {product.description && (
                                <span className="text-xs text-muted-foreground truncate" title={product.description}>
                                  {product.description}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            {product.category ? (
                              <span className="text-sm text-foreground font-medium bg-muted border border-border px-2.5 py-1 rounded-full">
                                {product.category.name}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">Uncategorized</span>
                            )}
                          </td>
                          <td className="p-4 align-middle">
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
                                    disabled={isLoading}
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
                          </td>
                          <td className="p-4 align-middle font-mono font-medium text-foreground">
                            ৳{product.price.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4 align-middle">
                            {product.hasVariants ? (
                              <span
                                title={
                                  product.stockCount === 0 ? "Out of stock" :
                                    product.stockCount <= product.lowStockThreshold ? `Low stock (Threshold: ${product.lowStockThreshold})` :
                                      "In Stock"
                                }
                                className="inline-flex items-center gap-1.5 text-sm bg-muted border border-border px-2 py-1.5 rounded-md font-semibold text-muted-foreground"
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
                            )}
                          </td>
                          <td className="p-4 align-middle">
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
                          </td>
                          <td className="p-4 align-middle text-right">
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
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (< md viewports) */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredProducts.map((product) => {
                  const imageUrl = getProductImageUrl(product.images[0]?.storagePath)

                  return (
                    <Card
                      key={product.id}
                      className="flex flex-col border border-border bg-card p-4 gap-4"
                    >
                      <div className="flex gap-3.5 items-start">
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
                              <h3 className="text-base font-semibold text-foreground truncate">
                                {product.name}
                              </h3>
                              {product.category && (
                                <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 self-start">
                                  {product.category.name}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleTogglePublish(product.id, product.isPublished)}
                              disabled={isPending || deleteMutation.isPending || togglePublishMutation.isPending}
                              className="cursor-pointer hover:opacity-90 active:scale-95 transition-all duration-200 focus:outline-none"
                            >
                              {product.isPublished ? (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 rounded-full px-2 py-0.5 font-semibold border border-emerald-500/20">
                                  {togglePublishMutation.isPending && togglePublishMutation.variables?.productId === product.id ? (
                                    <Loader2 className="h-2.5 w-2.5 animate-spin text-foreground" />
                                  ) : (
                                    <Eye className="h-2.5 w-2.5 stroke-[2.5]" />
                                  )}
                                  <span>Published</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-semibold border border-border">
                                  {togglePublishMutation.isPending && togglePublishMutation.variables?.productId === product.id ? (
                                    <Loader2 className="h-2.5 w-2.5 animate-spin text-foreground" />
                                  ) : (
                                    <EyeOff className="h-2.5 w-2.5 stroke-[2.5]" />
                                  )}
                                  <span>Draft</span>
                                </span>
                              )}
                            </button>
                          </div>

                          <span className="font-sans text-sm font-semibold text-foreground">
                            ৳{product.price.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Mobile promotions toggle row */}
                      <div className="flex flex-col gap-1.5 border-t border-border/50 pt-2.5">
                        <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Promotions</span>
                        <div className="flex flex-row items-center gap-1.5">
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
                                disabled={isLoading}
                                onClick={() => togglePromotionMutation.mutate({ productId: product.id, promotionType: promo.type, active: !isActive })}
                                className={cn(
                                  "px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full border transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none",
                                  isActive
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : "bg-transparent border-border text-muted-foreground"
                                )}
                              >
                                {promo.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Stock management row */}
                      <div className="flex items-center justify-between border-t border-b border-border/50 py-3">
                        <span className="text-sm text-muted-foreground font-medium">Stock Level:</span>
                        {product.hasVariants ? (
                          <span
                            title={
                              product.stockCount === 0 ? "Out of stock" :
                                product.stockCount <= product.lowStockThreshold ? `Low stock (Threshold: ${product.lowStockThreshold})` :
                                  "In Stock"
                            }
                            className="inline-flex items-center gap-1.5 text-sm bg-muted border border-border px-2 py-1.5 rounded-md font-semibold text-muted-foreground"
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
                        )}
                      </div>

                      {/* Actions row */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <a
                          href={getStorefrontProductUrl(product.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Storefront</span>
                        </a>

                        <div className="flex gap-2">
                          <Link href={`/dashboard/products/${product.id}/edit`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1.5 py-1.5 px-3 min-h-9"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </Button>
                          </Link>

                          <Button
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={isPending || deleteMutation.isPending}
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 hover:text-red-700 py-1.5 px-3 min-h-9 flex items-center justify-center shrink-0"
                          >
                            {deleteMutation.isPending && deleteMutation.variables === product.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

            </div>
          )}
        </div>
      )}
      {/* Delete Confirmation Alert Dialog */}
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
