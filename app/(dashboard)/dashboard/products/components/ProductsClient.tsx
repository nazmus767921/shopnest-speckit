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
import { Button, Card } from "@/components/ui"
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
import { AlertDialog } from "@/components/ui/feedback/AlertDialog"

interface FormattedProduct {
  id: string
  name: string
  price: number
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

  // Sync with prop when server data updates
  React.useEffect(() => {
    setStock(initialStock)
  }, [initialStock])

  const triggerUpdate = async (value: number) => {
    setIsSaving(true)
    try {
      await onSave(value)
    } catch (error) {
      // Revert on error
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
      <div className="flex items-center border border-hairline-light rounded-lg bg-canvas-cream/20 overflow-hidden min-h-9.5">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={stock <= 0 || isSaving}
          className="px-2.5 py-1 text-shade-60 hover:bg-shade-30/30 active:bg-shade-30/50 disabled:opacity-30 disabled:pointer-events-none transition-colors border-r border-hairline-light cursor-pointer select-none font-semibold text-caption"
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
            className="w-full text-center text-caption font-mono font-medium text-ink bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {isSaving && (
            <div className="absolute inset-0 bg-canvas-light/70 flex items-center justify-center">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={isSaving}
          className="px-2.5 py-1 text-shade-60 hover:bg-shade-30/30 active:bg-shade-30/50 disabled:opacity-30 disabled:pointer-events-none transition-colors border-l border-hairline-light cursor-pointer select-none font-semibold text-caption"
        >
          +
        </button>
      </div>

      {/* Stock warning/status dot */}
      <span
        title={
          isOutOfStock ? "Out of stock" :
            isLowStock ? `Low stock (Threshold: ${lowStockThreshold})` :
              "In Stock"
        }
        className={`h-2.5 w-2.5 rounded-full shrink-0 ${isOutOfStock ? "bg-red-500 animate-pulse" :
          isLowStock ? "bg-amber-500" :
            "bg-emerald-500"
          }`}
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

  // TanStack Query for products list
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

  // Delete product mutation
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

  // Toggle publish mutation
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

  // Inline Stock update mutation
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

  // Toggle promotion mutation
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

  // Resolve image URLs from Supabase Storage
  const getProductImageUrl = (storagePath: string | undefined) => {
    if (!storagePath) return null
    return supabase.storage.from("product-images").getPublicUrl(storagePath).data.publicUrl
  }

  // Resolve Storefront product URLs dynamically using base URL computed on the server
  const getStorefrontProductUrl = (slug: string) => {
    return `${storefrontBaseUrl}/product/${slug}`
  }

  // Calculate status counts for tab badges
  const totalCount = products.length
  const publishedCount = products.filter((p) => p.isPublished).length
  const draftCount = products.filter((p) => !p.isPublished).length

  // Filter and sort products client-side for immediate feedback
  const filteredProducts = React.useMemo(() => {
    return products
      .filter((product) => {
        // Search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim()
          const nameMatch = product.name.toLowerCase().includes(query)
          const descMatch = product.description?.toLowerCase().includes(query) || false
          if (!nameMatch && !descMatch) return false
        }

        // Publish status filter
        if (statusFilter !== "all") {
          if (statusFilter === "published" && !product.isPublished) return false
          if (statusFilter === "draft" && product.isPublished) return false
        }

        // Stock filter
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

        // Default: Newest first
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
    <div className="flex flex-col gap-6 text-ink">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-hairline-light">
        <div>
          <h1 className="font-display text-heading-xl tracking-tight text-ink font-semibold leading-none">
            Product Management
          </h1>
          <p className="text-caption text-shade-50 font-light mt-1">
            Manage your store items, stock levels, and storefront publishing details
          </p>
        </div>
        {limitReached ? (
          <Button
            disabled
            className="bg-primary/50 w-full md:w-fit text-on-primary flex items-center gap-2 cursor-not-allowed"
            title="Product limit reached for your subscription plan"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Product (Limit Reached)</span>
          </Button>
        ) : (
          <Link href="/dashboard/products/new">
            <Button className="bg-primary w-full md:w-fit text-on-primary hover:bg-shade-70 flex items-center gap-2">
              <Plus className="h-4.5 w-4.5" />
              <span>Add Product</span>
            </Button>
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        /* Empty State */
        <Card className="flex flex-col items-center justify-center text-center p-12 border border-hairline-light bg-canvas-light max-w-xl mx-auto mt-6 w-full">
          <div className="p-4 bg-pistachio-10 text-emerald-900 rounded-full mb-4">
            <ShoppingBag className="h-10 w-10 stroke-[1.5]" />
          </div>
          <h3 className="font-display text-heading-md font-semibold text-ink">
            No products listed
          </h3>
          <p className="text-caption text-shade-50 font-light max-w-sm mt-2 mb-6">
            Get started by adding your first product. It will show up immediately on your storefront.
          </p>
          {limitReached ? (
            <Button disabled className="bg-primary/50 text-on-primary cursor-not-allowed">
              Create First Product (Limit Reached)
            </Button>
          ) : (
            <Link href="/dashboard/products/new">
              <Button className="bg-primary text-on-primary hover:bg-shade-70">
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
              <div className="flex bg-zinc-100/85 p-1 rounded-full gap-1 items-center select-none w-fit border border-hairline-light">
                {statusTabs.map((tab) => {
                  const isActive = statusFilter === tab.value
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setStatusFilter(tab.value as any)}
                      className={`px-5 py-1.5 rounded-full text-caption font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${isActive
                        ? "bg-white text-ink border border-hairline-light"
                        : "text-shade-60 hover:text-ink hover:bg-zinc-200/50"
                        }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${isActive ? "bg-zinc-100 text-ink" : "bg-zinc-200/60 text-shade-60"
                        }`}>
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Right Side: Select Dropdowns */}
              <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
                <div className="flex items-center gap-2 grow sm:grow-0">
                  <span className="text-caption text-shade-50 font-medium">Stock:</span>
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value as any)}
                    className="text-caption border border-hairline-light bg-canvas-light text-ink rounded-full px-4 py-2 min-h-10 outline-none focus:border-shade-60 transition-all grow sm:grow-0 cursor-pointer font-semibold"
                  >
                    <option value="all">All Levels</option>
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 grow sm:grow-0">
                  <span className="text-caption text-shade-50 font-medium">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-caption border border-hairline-light bg-canvas-light text-ink rounded-full px-4 py-2 min-h-10 outline-none focus:border-shade-60 transition-all grow sm:grow-0 cursor-pointer font-semibold"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="stock_asc">Stock: Low to High</option>
                    <option value="stock_desc">Stock: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-shade-40" />
              <input
                type="text"
                placeholder="Search by product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-caption border border-hairline-light bg-canvas-light text-ink placeholder-shade-40 rounded-full pl-10 pr-4 py-2.5 min-h-10 outline-none focus:border-shade-60 transition-all font-sans"
              />
            </div>
          </div>

          {/* List Area */}
          {filteredProducts.length === 0 ? (
            <Card className="flex flex-col items-center justify-center text-center p-12 border border-hairline-light bg-canvas-light max-w-xl mx-auto w-full mt-4 rounded-2xl">
              <div className="p-4 bg-pistachio-10 text-emerald-900 rounded-full mb-4">
                <Search className="h-8 w-8 stroke-[1.5]" />
              </div>
              <h3 className="font-display text-heading-md font-semibold text-ink">
                No matching products
              </h3>
              <p className="text-caption text-shade-50 font-light max-w-sm mt-2">
                Try adjusting your search criteria, stock levels, or status filters.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">

              {/* Desktop Table View (>= md viewports) */}
              <div className="hidden md:block overflow-hidden rounded-2xl border border-hairline-light bg-canvas-light">
                <table className="w-full border-collapse text-left text-caption text-ink">
                  <thead>
                    <tr className="border-b border-hairline-light bg-canvas-cream/35 text-shade-55 font-semibold">
                      <th className="p-4 w-20">Item</th>
                      <th className="p-4">Product Details</th>
                      <th className="p-4 w-32.5">Category</th>
                      <th className="p-4 w-52">Promotions</th>
                      <th className="p-4 w-30">Price</th>
                      <th className="p-4 w-55">Stock Count</th>
                      <th className="p-4 w-32.5">Status</th>
                      <th className="p-4 text-right w-37.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-light">
                    {filteredProducts.map((product) => {
                      const imageUrl = getProductImageUrl(product.images[0]?.storagePath)

                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-canvas-cream/10 transition-colors duration-150"
                        >
                          <td className="p-4 align-middle">
                            <div className="w-12 h-16 bg-canvas-cream flex items-center justify-center rounded border border-hairline-light overflow-hidden shrink-0">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-shade-40" />
                              )}
                            </div>
                          </td>
                          <td className="p-4 align-middle font-sans">
                            <div className="flex flex-col gap-0.5 max-w-50">
                              <span className="font-semibold text-ink truncate" title={product.name}>
                                {product.name}
                              </span>
                              {product.description && (
                                <span className="text-[12px] text-shade-55 truncate" title={product.description}>
                                  {product.description}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            {product.category ? (
                              <span className="text-caption text-ink font-medium bg-canvas-cream border border-hairline-light px-2.5 py-1 rounded-full">
                                {product.category.name}
                              </span>
                            ) : (
                              <span className="text-caption text-shade-40 italic">Uncategorized</span>
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
                                    className={`px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded-full border transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none ${isActive
                                      ? "bg-emerald-800 border-emerald-800 text-white"
                                      : "bg-transparent border-hairline-light text-shade-50 hover:border-shade-40 hover:text-ink"
                                      }`}
                                  >
                                    {promo.label}
                                  </button>
                                )
                              })}
                            </div>
                          </td>
                          <td className="p-4 align-middle font-mono font-medium text-ink">
                            ৳{product.price.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4 align-middle">
                            <InlineStockWidget
                              productId={product.id}
                              initialStock={product.stockCount}
                              lowStockThreshold={product.lowStockThreshold}
                              onSave={(newStock) => handleStockSave(product.id, newStock)}
                            />
                          </td>
                          <td className="p-4 align-middle">
                            <button
                              onClick={() => handleTogglePublish(product.id, product.isPublished)}
                              disabled={isPending || deleteMutation.isPending || togglePublishMutation.isPending}
                              title={product.isPublished ? "Click to set as Draft" : "Click to Publish"}
                              className="cursor-pointer hover:opacity-90 active:scale-95 transition-all duration-200 disabled:pointer-events-none disabled:opacity-75 focus:outline-none"
                            >
                              {product.isPublished ? (
                                <span className="inline-flex items-center gap-1.5 text-eyebrow-cap bg-aloe-10 text-ink rounded-full px-2.5 py-1 font-semibold border border-emerald-300/30">
                                  {togglePublishMutation.isPending && togglePublishMutation.variables?.productId === product.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-ink" />
                                  ) : (
                                    <Eye className="h-3 w-3 stroke-2" />
                                  )}
                                  <span>Published</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-eyebrow-cap bg-shade-30 text-ink rounded-full px-2.5 py-1 font-semibold border border-shade-40/30">
                                  {togglePublishMutation.isPending && togglePublishMutation.variables?.productId === product.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-ink" />
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
                              {/* Direct link to storefront */}
                              <a
                                href={getStorefrontProductUrl(product.slug)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View on storefront"
                                className="text-shade-50 hover:text-ink cursor-pointer p-1.5 hover:bg-shade-30/20 rounded-full transition-colors"
                              >
                                <ExternalLink className="h-4.5 w-4.5" />
                              </a>

                              <Link href={`/dashboard/products/${product.id}/edit`}>
                                <button
                                  title="Edit Product"
                                  className="text-shade-50 hover:text-ink cursor-pointer p-1.5 hover:bg-shade-30/20 rounded-full transition-colors"
                                >
                                  <Edit2 className="h-4.5 w-4.5" />
                                </button>
                              </Link>

                              <button
                                onClick={() => handleDelete(product.id, product.name)}
                                disabled={isPending || deleteMutation.isPending}
                                title="Delete Product"
                                className="text-red-500 hover:text-red-700 cursor-pointer p-1.5 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
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
                      className="flex flex-col border border-hairline-light bg-canvas-light p-4 gap-4"
                    >
                      {/* Top details */}
                      <div className="flex gap-3.5 items-start">
                        <div className="w-16 h-20 bg-canvas-cream flex items-center justify-center rounded border border-hairline-light overflow-hidden shrink-0">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-shade-40" />
                          )}
                        </div>
                        <div className="flex flex-col gap-1 grow min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex flex-col gap-1 min-w-0">
                              <h3 className="text-body-strong font-medium text-ink truncate">
                                {product.name}
                              </h3>
                              {product.category && (
                                <span className="text-[11px] text-emerald-850 font-medium bg-aloe-10/40 px-2 py-0.5 rounded-full self-start">
                                  {product.category.name}
                                </span>
                              )}
                            </div>
                            {/* Interactive Publish Badge on mobile */}
                            <button
                              onClick={() => handleTogglePublish(product.id, product.isPublished)}
                              disabled={isPending || deleteMutation.isPending || togglePublishMutation.isPending}
                              className="cursor-pointer hover:opacity-90 active:scale-95 transition-all duration-200 focus:outline-none"
                            >
                              {product.isPublished ? (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-aloe-10 text-ink rounded-full px-2 py-0.5 font-semibold border border-emerald-300/30">
                                  {togglePublishMutation.isPending && togglePublishMutation.variables?.productId === product.id ? (
                                    <Loader2 className="h-2.5 w-2.5 animate-spin text-ink" />
                                  ) : (
                                    <Eye className="h-2.5 w-2.5 stroke-[2.5]" />
                                  )}
                                  <span>Published</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-shade-30 text-ink rounded-full px-2 py-0.5 font-semibold border border-shade-40/30">
                                  {togglePublishMutation.isPending && togglePublishMutation.variables?.productId === product.id ? (
                                    <Loader2 className="h-2.5 w-2.5 animate-spin text-ink" />
                                  ) : (
                                    <EyeOff className="h-2.5 w-2.5 stroke-[2.5]" />
                                  )}
                                  <span>Draft</span>
                                </span>
                              )}
                            </button>
                          </div>

                          <span className="font-sans text-heading-sm font-semibold text-ink">
                            ৳{product.price.toLocaleString("en-BD", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Mobile promotions toggle row */}
                      <div className="flex flex-col gap-1.5 border-t border-hairline-light/50 pt-2.5">
                        <span className="text-[11px] text-shade-50 font-bold uppercase tracking-wider">Promotions</span>
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
                                className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full border transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none ${isActive
                                  ? "bg-emerald-800 border-emerald-800 text-white"
                                  : "bg-transparent border-hairline-light text-shade-55"
                                  }`}
                              >
                                {promo.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Stock management row */}
                      <div className="flex items-center justify-between border-t border-b border-hairline-light/50 py-3">
                        <span className="text-caption text-shade-50 font-medium">Stock Level:</span>
                        <InlineStockWidget
                          productId={product.id}
                          initialStock={product.stockCount}
                          lowStockThreshold={product.lowStockThreshold}
                          onSave={(newStock) => handleStockSave(product.id, newStock)}
                        />
                      </div>

                      {/* Actions row */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        {/* View storefront link */}
                        <a
                          href={getStorefrontProductUrl(product.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-caption font-semibold text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Storefront</span>
                        </a>

                        {/* Edit / Delete buttons */}
                        <div className="flex gap-2">
                          <Link href={`/dashboard/products/${product.id}/edit`}>
                            <Button
                              variant="outline-light"
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
                            variant="outline-light"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 py-1.5 px-3 min-h-9 flex items-center justify-center shrink-0"
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
      <AlertDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Product "${deleteTarget?.name}"?`}
        description="This action cannot be undone. The product and all associated images will be permanently deleted."
        confirmText="Delete Product"
        variant="danger"
        isPending={deleteMutation.isPending}
      />

      {/* Error Alert Dialog */}
      <AlertDialog
        isOpen={!!errorAlert}
        onClose={() => setErrorAlert(null)}
        onConfirm={() => setErrorAlert(null)}
        title={errorAlert?.title || "Error"}
        description={errorAlert?.message || "An unexpected error occurred."}
        confirmText="Acknowledge"
        variant="primary"
      />
    </div>
  )
}
