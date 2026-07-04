"use client"

import React, { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { supabase } from "@/lib/supabase/client"
import { productFormSchema } from "@/lib/validations/products"
import { createProductAction, updateProductAction } from "@/app/actions/products"
import { getCategoriesAction } from "@/app/actions/categories"
import { useQuery } from "@tanstack/react-query"
import {
  Button,
  Input,
  FormLabel,
  Textarea,
  Card,
  Badge,
  Combobox,
} from "@/components/ui"
import { UploadCloud, X, Loader2, ArrowLeft, Image as ImageIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { AlertDialog } from "@/components/ui/feedback/AlertDialog"
import Link from "next/link"

function getErrorMessage(error: any): string | null {
  if (!error) return null
  if (typeof error === "string") return error
  if (typeof error === "object" && "message" in error) return error.message
  return String(error)
}

interface ImageItem {
  id: string
  storagePath?: string
  previewUrl: string
  file?: File
}

interface ProductFormProps {
  merchantId: string
  productId?: string
  maxImages: number
  imageSizeLimitMb: number
  hideHeader?: boolean
  hasVariants?: boolean
  totalVariantStock?: number
  initialData?: {
    id: string
    name: string
    description: string | null
    pricePaisa: number
    stockCount: number
    lowStockThreshold: number
    isPublished: boolean
    images: { storagePath: string }[]
    categoryId?: string | null
    promotionTypes?: string[]
  }
}

export function ProductForm({ merchantId, productId: initialProductId, initialData, maxImages, imageSizeLimitMb, hideHeader = false, hasVariants = false, totalVariantStock = 0 }: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [productId] = useState(() => initialData?.id || initialProductId || crypto.randomUUID())
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [errorAlert, setErrorAlert] = useState<{ title: string; message: string } | null>(null)

  // Initialize images list (either from DB or empty)
  const [images, setImages] = useState<ImageItem[]>(() => {
    if (!initialData?.images) return []
    return initialData.images.map((img) => ({
      id: crypto.randomUUID(),
      storagePath: img.storagePath,
      previewUrl: supabase.storage.from("product-images").getPublicUrl(img.storagePath).data.publicUrl,
    }))
  })

  // Fetch categories using TanStack Query
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", merchantId],
    queryFn: async () => {
      const res = await getCategoriesAction()
      if (!res.success) throw new Error(res.error)
      return res.categories || []
    },
    staleTime: 60_000,
  })

  const moveImage = (index: number, direction: "left" | "right") => {
    const newIndex = direction === "left" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= images.length) return
    setImages((prev) => {
      const list = [...prev]
      const temp = list[index]
      list[index] = list[newIndex]
      list[newIndex] = temp
      return list
    })
  }

  // Set up form via @tanstack/react-form
  const form = useForm({
    defaultValues: {
      id: productId,
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData ? initialData.pricePaisa / 100 : 0,
      stockCount: initialData?.stockCount ?? 0,
      lowStockThreshold: initialData?.lowStockThreshold ?? 5,
      isPublished: initialData?.isPublished ?? false,
      images: initialData?.images.map((img) => img.storagePath) || [],
      categoryId: initialData?.categoryId || null,
      promotionTypes: initialData?.promotionTypes || [],
    },
    validators: {
      onChange: productFormSchema,
    },
    onSubmit: async ({ value }) => {
      setErrorMsg(null)

      startTransition(async () => {
        try {
          const finalImagePaths: string[] = []

          // Upload new files to Supabase Storage
          for (const img of images) {
            if (img.file) {
              const fileExt = img.file.name.split(".").pop()
              const fileUuid = crypto.randomUUID()
              const filePath = `product-images/${merchantId}/${productId}/${fileUuid}.${fileExt}`

              const { error: uploadError } = await supabase.storage
                .from("product-images")
                .upload(filePath, img.file, {
                  cacheControl: "3600",
                  upsert: false,
                })

              if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`)
              }
              finalImagePaths.push(filePath)
            } else if (img.storagePath) {
              finalImagePaths.push(img.storagePath)
            }
          }

          // Build request payload
          const payload = {
            ...value,
            images: finalImagePaths,
          }

          let response
          if (initialData) {
            response = await updateProductAction(initialData.id, payload)
          } else {
            response = await createProductAction(payload)
          }

          if (response.success) {
            if (initialData) {
              router.push("/dashboard/products")
            } else {
              router.push(`/dashboard/products/${productId}/edit`)
            }
            router.refresh()
          } else {
            setErrorMsg(response.error || "An error occurred while saving the product.")
          }
        } catch (err: any) {
          setErrorMsg(err.message || "An unexpected error occurred.")
        }
      })
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const selectedFiles = Array.from(e.target.files).filter(file => file.type.startsWith("image/"))

    const sizeLimitBytes = imageSizeLimitMb * 1024 * 1024
    const oversizedFiles = selectedFiles.filter(file => file.size > sizeLimitBytes)
    if (oversizedFiles.length > 0) {
      setErrorAlert({
        title: "File Size Limit Exceeded",
        message: `Some images exceed the ${imageSizeLimitMb}MB limit and were not added.`
      })
    }

    const validFiles = selectedFiles.filter(file => file.size <= sizeLimitBytes)
    const availableSlots = maxImages - images.length
    if (validFiles.length > availableSlots) {
      setErrorAlert({
        title: "Upload Limit Exceeded",
        message: `You can only upload up to ${maxImages} images. Only the first ${availableSlots} were added.`
      })
    }

    const filesToAdd = validFiles.slice(0, availableSlots)
    if (filesToAdd.length === 0) return

    const newItems = filesToAdd.map((file) => ({
      id: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
      file,
    }))

    setImages((prev) => [...prev, ...newItems])
    if (e.target) e.target.value = ""
  }

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (images.length < maxImages) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (images.length >= maxImages) return

    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
        file.type.startsWith("image/")
      )

      const sizeLimitBytes = imageSizeLimitMb * 1024 * 1024
      const oversizedFiles = droppedFiles.filter(file => file.size > sizeLimitBytes)
      if (oversizedFiles.length > 0) {
        setErrorAlert({
          title: "File Size Limit Exceeded",
          message: `Some images exceed the ${imageSizeLimitMb}MB limit and were not added.`
        })
      }

      const validFiles = droppedFiles.filter(file => file.size <= sizeLimitBytes)
      const availableSlots = maxImages - images.length
      const filesToAdd = validFiles.slice(0, availableSlots)

      if (validFiles.length > availableSlots) {
        setErrorAlert({
          title: "Upload Limit Exceeded",
          message: `You can only upload up to ${maxImages} images. Only the first ${availableSlots} were added.`
        })
      }

      if (filesToAdd.length === 0) return

      const newItems = filesToAdd.map((file) => ({
        id: crypto.randomUUID(),
        previewUrl: URL.createObjectURL(file),
        file,
      }))

      setImages((prev) => [...prev, ...newItems])
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {!hideHeader && (
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/products"
            className="p-2 border border-hairline-light rounded-full bg-canvas-light text-ink hover:bg-canvas-cream transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-heading-xl tracking-tight text-ink font-semibold leading-none">
              {initialData ? "Edit Product" : "Add Product"}
            </h1>
            <p className="text-caption text-shade-50 font-light mt-1">
              {initialData ? "Manage and update product details" : "List a new boutique item on your storefront"}
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-body-md rounded-md p-4 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Left column: Details card */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-6 border border-hairline-light bg-canvas-light flex flex-col gap-5 overflow-visible">
            <h2 className="text-body-strong font-bold text-ink uppercase tracking-wider border-b border-hairline-light pb-3">
              Basic Details
            </h2>

            {/* Product Name */}
            <form.Field
              name="name"
              children={(field) => (
                <div className="flex flex-col gap-1.5">
                  <FormLabel htmlFor={field.name}>Product Name *</FormLabel>
                  <Input
                    id={field.name}
                    placeholder="e.g. Premium Cotton Kurti"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    error={field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-caption text-red-500 font-medium mt-0.5">
                      {getErrorMessage(field.state.meta.errors[0])}
                    </span>
                  )}
                </div>
              )}
            />

            {/* Description */}
            <form.Field
              name="description"
              children={(field) => (
                <div className="flex flex-col gap-1.5">
                  <FormLabel htmlFor={field.name}>Product Description</FormLabel>
                  <Textarea
                    id={field.name}
                    placeholder="Provide descriptions including fabric, fit, styling notes..."
                    rows={6}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    error={field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-caption text-red-500 font-medium mt-0.5">
                      {getErrorMessage(field.state.meta.errors[0])}
                    </span>
                  )}
                </div>
              )}
            />

            {/* Price and Stock Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Price */}
              <form.Field
                name="price"
                children={(field) => (
                  <div className="flex flex-col gap-1.5">
                    <FormLabel htmlFor={field.name}>Price (BDT) *</FormLabel>
                    <Input
                      id={field.name}
                      type="number"
                      step="1"
                      placeholder="0"
                      leftIcon="৳"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : 0)}
                      error={field.state.meta.errors.length > 0}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <span className="text-caption text-red-500 font-medium mt-0.5">
                        {getErrorMessage(field.state.meta.errors[0])}
                      </span>
                    )}
                  </div>
                )}
              />

              {/* Stock count — managed per-variant when product has variants */}
              {hasVariants ? (
                <div className="flex flex-col gap-1.5">
                  <FormLabel htmlFor="variant-stock">Stock Quantity</FormLabel>
                  <div className="flex items-center gap-2 rounded-md border border-hairline-light bg-canvas-cream/60 px-3 py-2.5 text-body-md text-shade-40 italic">
                    Managed per variant
                  </div>
                  <p className="text-caption text-shade-40 mt-0.5">
                    Set individual stock levels for each variant in the Variants tab.
                  </p>
                </div>
              ) : (
                <form.Field
                  name="stockCount"
                  children={(field) => (
                    <div className="flex flex-col gap-1.5">
                      <FormLabel htmlFor={field.name}>Stock Quantity *</FormLabel>
                      <Input
                        id={field.name}
                        type="number"
                        placeholder="e.g. 100"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : 0)}
                        error={field.state.meta.errors.length > 0}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <span className="text-caption text-red-500 font-medium mt-0.5">
                          {getErrorMessage(field.state.meta.errors[0])}
                        </span>
                      )}
                    </div>
                  )}
                />
              )}
            </div>

            {/* Category selection */}
            <form.Field
              name="categoryId"
              children={(field) => {
                const selectedCategory = categories.find((cat) => cat.id === field.state.value) || null
                return (
                  <div className="flex flex-col gap-1.5">
                    <FormLabel>Category</FormLabel>
                    <Combobox
                      options={categories}
                      value={selectedCategory}
                      onChange={(val) => field.handleChange(val ? val.id : null)}
                      getOptionLabel={(cat) => cat.name}
                      getOptionValue={(cat) => cat.id}
                      placeholder="Select a category..."
                      searchPlaceholder="Search categories..."
                      noOptionsMessage="No categories found."
                    />
                    {field.state.meta.errors.length > 0 && (
                      <span className="text-caption text-red-500 font-medium">
                        {getErrorMessage(field.state.meta.errors[0])}
                      </span>
                    )}
                  </div>
                )
              }}
            />
          </Card>
        </div>

        {/* Right column: Images & Configuration */}
        <div className="flex flex-col gap-6">
          {/* Status & Alerts Card */}
          <Card className="p-6 border border-hairline-light bg-canvas-light flex flex-col gap-5">
            <h2 className="text-body-strong font-bold text-ink uppercase tracking-wider border-b border-hairline-light pb-3">
              Storefront Status
            </h2>

            {/* Publish state */}
            <form.Field
              name="isPublished"
              children={(field) => (
                <div className="flex items-center gap-3">
                  <input
                    id={field.name}
                    type="checkbox"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-hairline-light accent-emerald-800 text-on-primary focus:ring-emerald-800"
                  />
                  <div className="flex flex-col">
                    <FormLabel htmlFor={field.name} className="cursor-pointer font-semibold leading-tight">
                      Publish Storefront
                    </FormLabel>
                    <span className="text-micro text-shade-40 leading-none mt-1">
                      Make this product immediately visible to customers
                    </span>
                  </div>
                </div>
              )}
            />

            {/* Low stock threshold alert setting */}
            <form.Field
              name="lowStockThreshold"
              children={(field) => (
                <div className="flex flex-col gap-1.5 mt-2">
                  <FormLabel htmlFor={field.name}>Low Stock Threshold</FormLabel>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : 0)}
                    error={field.state.meta.errors.length > 0}
                  />
                  <span className="text-micro text-shade-40 mt-0.5">
                    We will send an SMS notification when stock count drops to or below this count.
                  </span>
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-caption text-red-500 font-medium">
                      {getErrorMessage(field.state.meta.errors[0])}
                    </span>
                  )}
                </div>
              )}
            />

            {/* Promotions checklist */}
            <form.Field
              name="promotionTypes"
              children={(field) => {
                const value = field.state.value || []
                const togglePromotion = (type: string) => {
                  if (value.includes(type)) {
                    field.handleChange(value.filter((t) => t !== type))
                  } else {
                    field.handleChange([...value, type])
                  }
                }

                return (
                  <div className="flex flex-col gap-3 border-t border-hairline-light pt-4 mt-2">
                    <FormLabel>Storefront Promotions</FormLabel>
                    <span className="text-micro text-shade-40 leading-normal -mt-1 block">
                      Feature this product in specialized landing page collections
                    </span>
                    <div className="flex flex-wrap gap-2.5 mt-1">
                      {[
                        { type: "featured", label: "Featured" },
                        { type: "new_arrival", label: "New Arrival" },
                        { type: "exclusive", label: "Exclusive" },
                      ].map((promo) => {
                        const isSelected = value.includes(promo.type)
                        return (
                          <button
                            key={promo.type}
                            type="button"
                            onClick={() => togglePromotion(promo.type)}
                            className={`px-3 py-1.5 text-[12px] rounded-full border transition-all cursor-pointer font-medium select-none ${
                              isSelected
                                ? "bg-emerald-800 border-emerald-800 text-white"
                                : "bg-transparent border-hairline-light text-ink hover:border-shade-40"
                            }`}
                          >
                            {promo.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              }}
            />
          </Card>

          {/* Product Media Card */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative flex flex-col grow"
          >
            <Card className="p-6 border border-hairline-light bg-canvas-light flex flex-col gap-5 grow transition-colors duration-300">
              <h2 className="text-body-strong font-bold text-ink uppercase tracking-wider border-b border-hairline-light pb-3 flex items-center justify-between">
                <span>Product Images</span>
                <span className="text-micro font-medium text-shade-50 normal-case">
                  {images.length} / {maxImages} uploaded
                </span>
              </h2>

              {/* Slot grid (5 columns on desktop/tablet, grid on mobile) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                {Array.from({ length: maxImages }).map((_, index) => {
                  const img = images[index]
                  if (img) {
                    return (
                      <div
                        key={img.id}
                        className="relative group border border-hairline-light rounded-xl overflow-hidden bg-canvas-cream/50 aspect-square transition-all duration-300 hover:border-shade-50"
                      >
                        <img
                          src={img.previewUrl}
                          alt={`Upload preview ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                        {index === 0 && (
                          <span className="absolute top-2 left-2 bg-primary text-on-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider select-none">
                            Cover
                          </span>
                        )}

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2">
                          {/* Top: Delete action */}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => removeImage(img.id)}
                              className="p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-full transition-colors duration-150 cursor-pointer"
                              title="Delete Image"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Bottom: Reordering actions */}
                          <div className="flex justify-between w-full gap-1">
                            {index > 0 ? (
                              <button
                                type="button"
                                onClick={() => moveImage(index, "left")}
                                className="p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors duration-150 cursor-pointer"
                                title="Move Left"
                              >
                                <ChevronLeft className="h-3.5 w-3.5 stroke-[2.5]" />
                              </button>
                            ) : (
                              <div className="w-6.5" />
                            )}

                            {index < images.length - 1 ? (
                              <button
                                type="button"
                                onClick={() => moveImage(index, "right")}
                                className="p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors duration-150 cursor-pointer"
                                title="Move Right"
                              >
                                <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                              </button>
                            ) : (
                              <div className="w-6.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // Empty Slot (acting as upload trigger)
                  return (
                    <button
                      key={`empty-${index}`}
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-hairline-light rounded-xl bg-canvas-cream/10 hover:bg-canvas-cream/50 hover:border-shade-40 transition-all flex flex-col items-center justify-center aspect-square gap-1.5 text-shade-40 hover:text-ink cursor-pointer group"
                    >
                      <Plus className="h-5 w-5 stroke-2 transition-transform duration-200 group-hover:scale-110" />
                      <span className="text-[10px] font-semibold tracking-wide uppercase select-none">
                        {index === 0 ? "Add Cover" : `Add Image`}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="text-micro text-shade-50 font-light mt-1 flex items-center gap-1">
                <UploadCloud className="h-4.5 w-4.5 stroke-[1.5]" />
                <span>Drag and drop anywhere on this card, or click any slot to upload (PNG, JPG, WebP up to {imageSizeLimitMb}MB each).</span>
              </div>
            </Card>

            {/* Drag & Drop Overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-emerald-900/10 backdrop-blur-[2px] border-2 border-dashed border-emerald-700/60 rounded-xl z-20 flex flex-col items-center justify-center pointer-events-none animate-fade-in">
                <div className="p-4 bg-canvas-light text-emerald-800 rounded-full border border-emerald-200/50 shadow-sm flex items-center justify-center">
                  <UploadCloud className="h-8 w-8 animate-bounce" />
                </div>
                <span className="text-body-strong font-semibold text-emerald-950 mt-3">
                  Drop images to upload
                </span>
                <span className="text-micro text-emerald-900/80 mt-1">
                  Upload up to {maxImages - images.length} remaining images
                </span>
              </div>
            )}
          </div>

          {/* Form controls */}
          <div className="flex gap-4 border-t border-hairline-light pt-6 mt-4">
            <Link href="/dashboard/products" className="grow">
              <Button type="button" variant="outline" className="w-full justify-center">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isPending}
              className="grow justify-center bg-primary text-on-primary hover:bg-shade-70 flex items-center gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{initialData ? "Save Changes" : "Create Product"}</span>
            </Button>
          </div>
        </div>
      </form>
      {/* Error Alert Dialog */}
      <AlertDialog
        isOpen={!!errorAlert}
        onClose={() => setErrorAlert(null)}
        onConfirm={() => setErrorAlert(null)}
        title={errorAlert?.title || "Warning"}
        description={errorAlert?.message || "An unexpected warning occurred."}
        confirmText="Acknowledge"
        variant="primary"
      />
    </div>
  )
}
