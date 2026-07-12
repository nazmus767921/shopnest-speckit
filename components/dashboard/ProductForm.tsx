"use client"

import React, { useState, useTransition, useRef } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { supabase } from "@/lib/supabase/client"
import { productFormSchema } from "@/lib/validations/products"
import { createProductAction, updateProductAction } from "@/app/actions/products"
import { getCategoriesAction } from "@/app/actions/categories"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { Field, FieldLabel, FieldError, FieldDescription, FieldGroup, FieldSet } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import { UploadCloudIcon, XIcon, Loader2Icon, ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@/lib/icons";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
    compareAtPricePaisa?: number | null
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
  const [mounted, setMounted] = useState(false)
  const isEditMode = !!initialData

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [errorAlert, setErrorAlert] = useState<{ title: string; message: string } | null>(null)

  const [images, setImages] = useState<ImageItem[]>(() => {
    if (!initialData?.images) return []
    return initialData.images.map((img) => ({
      id: crypto.randomUUID(),
      storagePath: img.storagePath,
      previewUrl: supabase.storage.from("product-images").getPublicUrl(img.storagePath).data.publicUrl,
    }))
  })

  // Track image dirty state separately (images aren't part of TanStack Form state)
  const initialImagePaths = React.useMemo(
    () => (initialData?.images ? initialData.images.map((img) => img.storagePath).sort() : []),
    [initialData]
  )
  const imageDirty = React.useMemo(() => {
    if (!isEditMode) {
      // New product: dirty if any images added
      return images.length > 0
    }
    // Edit mode: compare current images to initial
    const currentPaths = images
      .filter((img) => img.storagePath)
      .map((img) => img.storagePath!)
      .sort()
    const hasNewFiles = images.some((img) => img.file)
    const pathsChanged =
      currentPaths.length !== initialImagePaths.length ||
      currentPaths.some((path, i) => path !== initialImagePaths[i])
    return hasNewFiles || pathsChanged
  }, [images, isEditMode, initialImagePaths])

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories", merchantId],
    queryFn: async () => {
      const res = await getCategoriesAction()
      if (!res.success) throw new Error(res.error)
      return res.categories || []
    },
    staleTime: 60_000,
  })

  const [searchQuery, setSearchQuery] = useState("")

  const getCategoryFullName = React.useCallback((categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return "";
    if (cat.parentId) {
      const parent = categories.find(c => c.id === cat.parentId);
      if (parent) return `${parent.name} • ${cat.name}`;
    }
    return cat.name;
  }, [categories]);

  const filteredCategories = React.useMemo(() => {
    if (!searchQuery) return categories
    return categories.filter((cat) =>
      getCategoryFullName(cat.id).toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [categories, searchQuery, getCategoryFullName])

  React.useEffect(() => {
    if (initialData?.categoryId && categories.length > 0) {
      const cat = categories.find((c) => c.id === initialData.categoryId)
      if (cat) {
        setSearchQuery(getCategoryFullName(cat.id))
      }
    }
  }, [categories, initialData])

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

  const form = useForm({
    defaultValues: {
      id: productId,
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData ? initialData.pricePaisa / 100 : 0,
      compareAtPrice: initialData?.compareAtPricePaisa ? initialData.compareAtPricePaisa / 100 : null,
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

  const saveButton = (
    <form.Subscribe
      selector={(state) => ({
        isDefaultValue: state.isDefaultValue,
        isValid: state.isValid,
      })}
      children={({ isDefaultValue, isValid }) => {
        // Edit mode: only need changes. New mode: need changes AND valid.
        const formChanged = !isDefaultValue || imageDirty
        const canSave = isEditMode ? formChanged : formChanged && isValid

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="inline-flex">
                  <Button
                    type="submit"
                    form="product-form"
                    disabled={isPending || !canSave}
                    className="flex items-center gap-2"
                  >
                    {isPending && <Loader2Icon className="h-4 w-4 animate-spin" />}
                    <span>{isEditMode ? "Save Changes" : "Create Product"}</span>
                  </Button>
                </span>
              </TooltipTrigger>
              {!canSave && !isPending && (
                <TooltipContent side="bottom">
                  {isEditMode ? "No changes to save" : "Fill in the form to continue"}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )
      }}
    />
  )

  const portalContainer = typeof window !== "undefined" ? document.getElementById("edit-product-header-actions") : null

  return (
    <div className="flex flex-col gap-6">
      {!hideHeader && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon-lg" className="rounded-sm" type="button" asChild>
              <Link href="/dashboard/products">
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight leading-none">
                {initialData ? "Edit Product" : "Add Product"}
              </h1>
              <p className="text-sm text-muted-foreground font-light mt-1">
                {initialData ? "Manage and update product details" : "List a new boutique item on your storefront"}
              </p>
            </div>
          </div>
          {saveButton}
        </div>
      )}

      {hideHeader && mounted && portalContainer && createPortal(saveButton, portalContainer)}

      {errorMsg && (
        <Alert variant="destructive">
          <div className="flex items-center justify-between w-full">
            <AlertDescription>{errorMsg}</AlertDescription>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setErrorMsg(null)}
              className="h-auto w-auto p-1 hover:bg-transparent"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}

      <form
        id="product-form"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Left column: Details card */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base font-semibold uppercase tracking-wider">Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-5 overflow-visible">
              {/* Product Name */}
              <form.Field
                name="name"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Product Name *</FieldLabel>
                    <Input
                      id={field.name}
                      placeholder="e.g. Premium Cotton Kurti"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      error={field.state.meta.errors.length > 0}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <FieldError>
                        {getErrorMessage(field.state.meta.errors[0])}
                      </FieldError>
                    )}
                  </Field>
                )}
              />

              {/* Description */}
              <form.Field
                name="description"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Product Description</FieldLabel>
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
                      <FieldError>
                        {getErrorMessage(field.state.meta.errors[0])}
                      </FieldError>
                    )}
                  </Field>
                )}
              />

              {/* Price and Stock Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Price */}
                <form.Field
                  name="price"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Price (BDT) *</FieldLabel>
                      <NumberInput
                        id={field.name}
                        placeholder="0"
                        leftIcon="৳"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(val) => field.handleChange(val)}
                        error={field.state.meta.errors.length > 0}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <FieldError>
                          {getErrorMessage(field.state.meta.errors[0])}
                        </FieldError>
                      )}
                    </Field>
                  )}
                />

                {/* Old Price */}
                <form.Field
                  name="compareAtPrice"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Old Price (BDT)</FieldLabel>
                      <NumberInput
                        id={field.name}
                        placeholder="e.g. 150"
                        leftIcon="৳"
                        value={field.state.value ?? undefined}
                        onBlur={field.handleBlur}
                        onChange={(val) => field.handleChange(isNaN(val) ? null : val)}
                        error={field.state.meta.errors.length > 0}
                      />
                      {field.state.meta.errors.length > 0 ? (
                        <FieldError>
                          {getErrorMessage(field.state.meta.errors[0])}
                        </FieldError>
                      ) : (
                        <FieldDescription>
                          Optional comparison price.
                        </FieldDescription>
                      )}
                    </Field>
                  )}
                />

                {/* Stock count */}
                {hasVariants ? (
                  <Field>
                    <FieldLabel htmlFor="variant-stock">Stock Quantity</FieldLabel>
                    <Input
                      id="variant-stock"
                      type="number"
                      disabled
                      value={totalVariantStock}
                      className="cursor-not-allowed opacity-75"
                    />
                    <FieldDescription className="text-amber-600 dark:text-amber-500 font-medium">
                      Stock is managed via variants
                    </FieldDescription>
                  </Field>
                ) : (
                  <form.Field
                    name="stockCount"
                    children={(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Stock Quantity *</FieldLabel>
                        <NumberInput
                          id={field.name}
                          placeholder="e.g. 100"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(val) => field.handleChange(val)}
                          error={field.state.meta.errors.length > 0}
                        />
                        {field.state.meta.errors.length > 0 && (
                          <FieldError>
                            {getErrorMessage(field.state.meta.errors[0])}
                          </FieldError>
                        )}
                      </Field>
                    )}
                  />
                )}
              </div>

              {/* Category selection */}
              <form.Field
                name="categoryId"
                children={(field) => {
                  return (
                    <Field>
                      <FieldLabel>Category</FieldLabel>
                      {categoriesLoading ? (
                        <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-muted/50">
                          <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Loading categories...</span>
                        </div>
                      ) : (
                        <Combobox
                          value={field.state.value || ""}
                          onValueChange={(val) => field.handleChange(val || null)}
                          inputValue={searchQuery}
                          onInputValueChange={(val) => setSearchQuery(val)}
                          itemToStringLabel={(val) => getCategoryFullName(val)}
                        >
                          <ComboboxInput placeholder="Select a category..." className="w-full" />
                          <ComboboxContent>
                            <ComboboxList>
                              {filteredCategories.map((cat) => (
                                <ComboboxItem key={cat.id} value={cat.id}>
                                  {getCategoryFullName(cat.id)}
                                </ComboboxItem>
                              ))}
                              {filteredCategories.length === 0 && (
                                <ComboboxEmpty>No categories found.</ComboboxEmpty>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                      )}
                      {field.state.meta.errors.length > 0 && (
                        <FieldError>
                          {getErrorMessage(field.state.meta.errors[0])}
                        </FieldError>
                      )}
                    </Field>
                  )
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column: Images & Configuration */}
        <div className="flex flex-col gap-6">
          {/* Status & Alerts Card */}
          <Card>
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base font-semibold uppercase tracking-wider">Storefront Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col gap-5">
              {/* Publish state */}
              <form.Field
                name="isPublished"
                children={(field) => (
                  <Field orientation="horizontal">
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(!!checked)}
                    />
                    <div className="flex flex-col">
                      <FieldLabel htmlFor={field.name} className="cursor-pointer font-semibold leading-tight">
                        Publish Storefront
                      </FieldLabel>
                      <FieldDescription className="mt-1">
                        Make this product immediately visible to customers
                      </FieldDescription>
                    </div>
                  </Field>
                )}
              />

              {/* Low stock threshold alert setting */}
              <form.Field
                name="lowStockThreshold"
                children={(field) => (
                  <Field className="mt-2">
                    <FieldLabel htmlFor={field.name}>Low Stock Threshold</FieldLabel>
                    <NumberInput
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(val) => field.handleChange(val)}
                      error={field.state.meta.errors.length > 0}
                    />
                    <FieldDescription>
                      We will send an SMS notification when stock count drops to or below this count.
                    </FieldDescription>
                    {field.state.meta.errors.length > 0 && (
                      <FieldError>
                        {getErrorMessage(field.state.meta.errors[0])}
                      </FieldError>
                    )}
                  </Field>
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
                    <Field className="border-t border-border pt-4 mt-2">
                      <FieldLabel>Storefront Promotions</FieldLabel>
                      <FieldDescription className="leading-normal -mt-1 block">
                        Feature this product in specialized landing page collections
                      </FieldDescription>
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
                              className={cn(
                                "px-3 py-1.5 text-xs rounded-full border transition-all cursor-pointer font-medium select-none",
                                isSelected
                                  ? "bg-primary border-primary text-primary-foreground font-bold shadow-sm"
                                  : "bg-transparent border-border text-foreground hover:border-muted-foreground/30"
                              )}
                            >
                              {promo.label}
                            </button>
                          )
                        })}
                      </div>
                    </Field>
                  )
                }}
              />
            </CardContent>
          </Card>

          {/* Product Media Card */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative flex flex-col grow"
          >
            <Card className="grow flex flex-col">
              <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-semibold uppercase tracking-wider">Product Images</CardTitle>
                <span className="text-xs font-medium text-muted-foreground normal-case">
                  {images.length} / {maxImages} uploaded
                </span>
              </CardHeader>
              <CardContent className="pt-6 flex flex-col gap-5 grow">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                  {Array.from({ length: maxImages }).map((_, index) => {
                    const img = images[index]
                    if (img) {
                      return (
                        <div
                          key={img.id}
                          className="relative group border border-border rounded-xl overflow-hidden bg-muted/20 aspect-square transition-all duration-300 hover:border-muted-foreground/30"
                        >
                          <img
                            src={img.previewUrl}
                            alt={`Upload preview ${index + 1}`}
                            className="object-cover w-full h-full"
                          />
                          {index === 0 && (
                            <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider select-none">
                              Cover
                            </span>
                          )}

                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeImage(img.id)}
                                className="p-1 bg-red-650 hover:bg-red-600 text-white rounded-full transition-colors duration-150 cursor-pointer border-none"
                                title="Delete Image"
                              >
                                <XIcon className="h-3 w-3" />
                              </button>
                            </div>

                            <div className="flex justify-between w-full gap-1">
                              {index > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => moveImage(index, "left")}
                                  className="p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors duration-150 cursor-pointer border-none"
                                  title="Move Left"
                                >
                                  <ChevronLeftIcon className="h-3.5 w-3.5 stroke-[2.5]" />
                                </button>
                              ) : (
                                <div className="w-6.5" />
                              )}

                              {index < images.length - 1 ? (
                                <button
                                  type="button"
                                  onClick={() => moveImage(index, "right")}
                                  className="p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors duration-150 cursor-pointer border-none"
                                  title="Move Right"
                                >
                                  <ChevronRightIcon className="h-3.5 w-3.5 stroke-[2.5]" />
                                </button>
                              ) : (
                                <div className="w-6.5" />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <button
                        key={`empty-${index}`}
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-xl bg-muted/10 hover:bg-muted/30 hover:border-muted-foreground/30 transition-all flex flex-col items-center justify-center aspect-square gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer group"
                      >
                        <PlusIcon className="h-5 w-5 stroke-2 transition-transform duration-200 group-hover:scale-110" />
                        <span className="text-[10px] font-semibold tracking-wide uppercase select-none">
                          {index === 0 ? "Add Cover" : `Add Image`}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="text-xs text-muted-foreground font-light mt-1 flex items-center gap-1.5">
                  <UploadCloudIcon className="h-4.5 w-4.5 stroke-[1.5]" />
                  <span>Drag and drop anywhere on this card, or click any slot to upload (PNG, JPG, WebP up to {imageSizeLimitMb}MB each).</span>
                </div>
              </CardContent>
            </Card>

            {isDragging && (
              <div className="absolute inset-0 bg-emerald-950/10 backdrop-blur-[2px] border-2 border-dashed border-emerald-700/60 rounded-xl z-20 flex flex-col items-center justify-center pointer-events-none animate-fade-in">
                <div className="p-4 bg-card text-emerald-800 rounded-full border border-emerald-250 shadow-sm flex items-center justify-center">
                  <UploadCloudIcon className="h-8 w-8 animate-bounce" />
                </div>
                <span className="text-base font-semibold text-emerald-950 mt-3">
                  Drop images to upload
                </span>
                <span className="text-xs text-emerald-900/80 mt-1">
                  Upload up to {maxImages - images.length} remaining images
                </span>
              </div>
            )}
          </div>
        </div>
      </form>
      <AlertDialog open={!!errorAlert} onOpenChange={(open) => !open && setErrorAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{errorAlert?.title || "Warning"}</AlertDialogTitle>
            <AlertDialogDescription>
              {errorAlert?.message || "An unexpected warning occurred."}
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
