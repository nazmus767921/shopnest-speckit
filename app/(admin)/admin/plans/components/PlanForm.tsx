"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { planSchema, type PlanInput } from "@/lib/validations/plans"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Alert } from "@/components/ui"
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field"
import { Loader2Icon, SaveIcon, PackageIcon, ReceiptIcon, FolderOpenIcon, LayersIcon, ImageIcon, HardDriveIcon, PercentIcon, SendIcon, CoinsIcon, CheckIcon, MinusIcon, PlusIcon } from "@/lib/icons";


interface PlanFormProps {
  initialData?: PlanInput & { id: string }
  isEdit?: boolean
  onSubmit: (values: PlanInput) => Promise<{ success: boolean; error?: string }>
}

interface IosSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}

function IosSwitch({ checked, onChange, label, description }: IosSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4 w-full">
      <div className="flex flex-col">
        <span className="text-caption font-semibold text-ink leading-tight">{label}</span>
        {description && (
          <span className="text-micro font-light text-shade-50 mt-0.5">
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6.5 w-11.5 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${checked ? "bg-emerald-800" : "bg-shade-30"
          }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white transition duration-200 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"
            }`}
        />
      </button>
    </div>
  )
}

interface NumberAdjusterProps {
  id: string
  value: number | null
  onChange: (val: number | null) => void
  min?: number
  required?: boolean
}

function NumberAdjuster({ id, value, onChange, min = 1, required = false }: NumberAdjusterProps) {
  const displayVal = value === null ? "" : value
  return (
    <div className="flex items-center w-full max-w-[160px] border border-hairline-light rounded-md bg-canvas-light overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
      <button
        type="button"
        onClick={() => {
          const current = value === null ? min : value
          if (current > min) {
            onChange(current - 1)
          }
        }}
        className="px-3.5 py-2 text-shade-60 hover:bg-canvas-cream border-r border-hairline-light h-11 flex items-center justify-center cursor-pointer select-none transition-colors"
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <input
        id={id}
        type="number"
        min={min}
        required={required}
        value={displayVal}
        onChange={(e) => {
          const val = e.target.value
          onChange(val === "" ? (required ? min : null) : Number(val))
        }}
        className="w-full text-center outline-none bg-transparent font-semibold text-ink text-body-md h-11 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => {
          const current = value === null ? 0 : value
          onChange(current + 1)
        }}
        className="px-3.5 py-2 text-shade-60 hover:bg-canvas-cream border-l border-hairline-light h-11 flex items-center justify-center cursor-pointer select-none transition-colors"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

export function PlanForm({ initialData, isEdit = false, onSubmit }: PlanFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(false)
  }, [])

  // Track state for the nullable limit toggles (Switch = true means Unlimited/null, false means Limited)
  const [productsUnlimited, setProductsUnlimited] = useState(initialData ? initialData.features.max_products === null : true)
  const [ordersUnlimited, setOrdersUnlimited] = useState(initialData ? initialData.features.max_orders_per_month === null : true)
  const [categoriesUnlimited, setCategoriesUnlimited] = useState(initialData ? initialData.features.max_categories === null : true)
  const [variantsUnlimited, setVariantsUnlimited] = useState(initialData ? initialData.features.max_variants_per_product === null : true)

  const initialPriceTaka = initialData ? initialData.pricePaisa / 100 : 0

  const form = useForm({
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      priceTaka: initialPriceTaka,
      features: {
        max_products: initialData?.features.max_products ?? null,
        max_orders_per_month: initialData?.features.max_orders_per_month ?? null,
        max_categories: initialData?.features.max_categories ?? null,
        max_variants_per_product: initialData?.features.max_variants_per_product ?? null,
        max_images_per_product: initialData?.features.max_images_per_product ?? 5,
        image_size_limit_mb: initialData?.features.image_size_limit_mb ?? 2,
        discount_codes: initialData?.features.discount_codes ?? false,
        telegram_notifications: initialData?.features.telegram_notifications ?? true,
        cod: initialData?.features.cod ?? true,
      },
    },
    onSubmit: async ({ value }) => {
      setError(null)
      setLoading(true)
      try {
        const pricePaisa = Math.round(value.priceTaka * 100)

        const parsedFeatures = {
          max_products: productsUnlimited ? null : (value.features.max_products ? Number(value.features.max_products) : null),
          max_orders_per_month: ordersUnlimited ? null : (value.features.max_orders_per_month ? Number(value.features.max_orders_per_month) : null),
          max_categories: categoriesUnlimited ? null : (value.features.max_categories ? Number(value.features.max_categories) : null),
          max_variants_per_product: variantsUnlimited ? null : (value.features.max_variants_per_product ? Number(value.features.max_variants_per_product) : null),
          max_images_per_product: Number(value.features.max_images_per_product) || 5,
          image_size_limit_mb: Number(value.features.image_size_limit_mb) || 2,
          discount_codes: !!value.features.discount_codes,
          telegram_notifications: !!value.features.telegram_notifications,
          cod: !!value.features.cod,
        }

        const payload: PlanInput = {
          name: value.name,
          slug: isEdit ? initialData!.slug : value.slug,
          pricePaisa,
          features: parsedFeatures,
        }

        const validation = planSchema.safeParse(payload)
        if (!validation.success) {
          setError(validation.error.issues[0].message)
          setLoading(false)
          return
        }

        const res = await onSubmit(validation.data)
        if (res.error) {
          setError(res.error)
          setLoading(false)
        } else if (res.success) {
          router.push("/admin/plans")
          router.refresh()
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.")
        setLoading(false)
      }
    },
  })

  return (
    <div className="flex flex-col gap-6 w-full select-text">
      {error && (
        <Alert variant="danger" className="animate-fade-in">
          {error}
        </Alert>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="flex flex-col gap-8"
      >
        {/* Section 1: Basic Configuration */}
        <Card className="border border-hairline-light bg-canvas-light p-6">
          <CardHeader className="px-0 pt-0 pb-4 border-b border-hairline-light mb-6">
            <CardTitle className="text-heading-lg font-display font-semibold text-ink">
              1. Basic Configuration
            </CardTitle>
            <CardDescription className="text-caption text-shade-50">
              Set the name, slug identifier, and pricing structure for the plan.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Plan Name */}
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => {
                    const res = planSchema.shape.name.safeParse(value)
                    return res.success ? undefined : res.error.issues[0].message
                  },
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name} className="text-shade-60 font-semibold">
                      Plan Name
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="text"
                      placeholder="e.g. Starter, Growth, Pro"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      error={field.state.meta.isTouched && field.state.meta.errors.length > 0}
                    />
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                      <FieldError className="font-medium">
                        {field.state.meta.errors[0]}
                      </FieldError>
                    )}
                  </Field>
                )}
              </form.Field>

              {/* Plan Slug */}
              <form.Field
                name="slug"
                validators={{
                  onChange: ({ value }) => {
                    if (isEdit) return undefined
                    const res = planSchema.shape.slug.safeParse(value)
                    return res.success ? undefined : res.error.issues[0].message
                  },
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name} className="text-shade-60 font-semibold">
                      Plan Slug (Unique URL Segment)
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="text"
                      disabled={isEdit}
                      placeholder="e.g. starter, growth, pro-unlimited"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value.toLowerCase())}
                      className={isEdit ? "bg-canvas-cream/50 cursor-not-allowed opacity-75 font-mono border-dashed" : "font-mono"}
                      error={field.state.meta.isTouched && field.state.meta.errors.length > 0}
                    />
                    {isEdit ? (
                      <FieldDescription>
                        * The identifier slug is locked and cannot be changed after creation.
                      </FieldDescription>
                    ) : (
                      field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                        <FieldError className="font-medium">
                          {field.state.meta.errors[0]}
                        </FieldError>
                      )
                    )}
                  </Field>
                )}
              </form.Field>
            </div>

            {/* Pricing amount */}
            <form.Field
              name="priceTaka"
              validators={{
                onChange: ({ value }) => {
                  if (value < 0) return "Price cannot be negative"
                  return undefined
                },
              }}
            >
              {(field) => (
                <Field className="max-w-lg space-y-2.5">
                  <FieldLabel htmlFor={field.name} className="text-shade-60 font-semibold">
                    Monthly Price (৳ Taka)
                  </FieldLabel>
                  <div className="flex rounded-md border border-hairline-light bg-canvas-light focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 overflow-hidden transition-all duration-200 w-full max-w-sm">
                    <span className="bg-canvas-cream text-ink text-body-md font-semibold px-4 flex items-center border-r border-hairline-light select-none font-mono">
                      ৳
                    </span>
                    <input
                      id={field.name}
                      name={field.name}
                      type="number"
                      min="0"
                      placeholder="499"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(Number(e.target.value) || 0)}
                      className="grow bg-transparent text-ink font-sans text-body-md px-3.5 py-2.5 outline-none min-h-11 placeholder:text-shade-40 font-semibold"
                    />
                    <span className="bg-canvas-cream text-shade-50 text-micro px-3.5 flex items-center border-l border-hairline-light select-none uppercase tracking-wide">
                      / month
                    </span>
                  </div>
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                    <FieldError className="font-medium">
                      {field.state.meta.errors[0]}
                    </FieldError>
                  )}

                  {/* Visual Pricing Presets */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[
                      { label: "Free (৳0)", value: 0 },
                      { label: "Starter (৳499)", value: 499 },
                      { label: "Growth (৳999)", value: 999 },
                      { label: "Pro (৳1499)", value: 1499 }
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => field.handleChange(preset.value)}
                        className={`px-3 py-1.5 rounded-full text-micro border transition-all duration-150 cursor-pointer select-none font-mono ${field.state.value === preset.value
                            ? "bg-emerald-800 border-emerald-850 text-white font-medium"
                            : "bg-canvas-light border-hairline-light text-shade-60 hover:bg-canvas-cream hover:text-ink"
                          }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </Field>
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* Section 2: Resource Quotas & Limits */}
        <Card className="border border-hairline-light bg-canvas-light p-6">
          <CardHeader className="px-0 pt-0 pb-4 border-b border-hairline-light mb-6">
            <CardTitle className="text-heading-lg font-display font-semibold text-ink">
              2. Resource Limits & Quotas
            </CardTitle>
            <CardDescription className="text-caption text-shade-50">
              Control the storage and volume limits for merchants assigned to this plan.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Max Products */}
            <form.Field name="features.max_products">
              {(field) => (
                <div className="flex flex-col gap-4 p-5 border border-hairline-light rounded-lg bg-canvas-cream/15 transition-all duration-200">
                  <div className="flex items-start gap-3 border-b border-hairline-light/50 pb-3">
                    <div className="p-2 bg-canvas-cream rounded-md text-shade-60">
                      <PackageIcon className="h-5 w-5" />
                    </div>
                    <div className="grow">
                      <IosSwitch
                        checked={productsUnlimited}
                        onChange={(checked) => {
                          setProductsUnlimited(checked)
                          if (checked) {
                            field.handleChange(null)
                          } else {
                            field.handleChange(initialData?.features.max_products || 50)
                          }
                        }}
                        label="Unlimited Active Products"
                        description="Boutiques can list unlimited products"
                      />
                    </div>
                  </div>

                  {!productsUnlimited && (
                    <div className="flex flex-col gap-2.5 animate-fade-in">
                      <span className="text-micro font-semibold text-shade-60">Custom Limit Count</span>
                      <NumberAdjuster
                        id={field.name}
                        value={field.state.value}
                        onChange={(val) => field.handleChange(val)}
                        min={1}
                      />
                    </div>
                  )}

                  {productsUnlimited && (
                    <div className="flex items-center gap-2 text-emerald-800 text-micro font-semibold bg-emerald-50/50 border border-emerald-100 rounded-md py-2.5 px-3.5 self-start">
                      <CheckIcon className="h-4 w-4" />
                      <span>Unlimited Active Products Enabled</span>
                    </div>
                  )}
                </div>
              )}
            </form.Field>

            {/* Max Orders */}
            <form.Field name="features.max_orders_per_month">
              {(field) => (
                <div className="flex flex-col gap-4 p-5 border border-hairline-light rounded-lg bg-canvas-cream/15 transition-all duration-200">
                  <div className="flex items-start gap-3 border-b border-hairline-light/50 pb-3">
                    <div className="p-2 bg-canvas-cream rounded-md text-shade-60">
                      <ReceiptIcon className="h-5 w-5" />
                    </div>
                    <div className="grow">
                      <IosSwitch
                        checked={ordersUnlimited}
                        onChange={(checked) => {
                          setOrdersUnlimited(checked)
                          if (checked) {
                            field.handleChange(null)
                          } else {
                            field.handleChange(initialData?.features.max_orders_per_month || 200)
                          }
                        }}
                        label="Unlimited Monthly Orders"
                        description="Boutiques can process unlimited orders per month"
                      />
                    </div>
                  </div>

                  {!ordersUnlimited && (
                    <div className="flex flex-col gap-2.5 animate-fade-in">
                      <span className="text-micro font-semibold text-shade-60">Custom Limit Count</span>
                      <NumberAdjuster
                        id={field.name}
                        value={field.state.value}
                        onChange={(val) => field.handleChange(val)}
                        min={1}
                      />
                    </div>
                  )}

                  {ordersUnlimited && (
                    <div className="flex items-center gap-2 text-emerald-800 text-micro font-semibold bg-emerald-50/50 border border-emerald-100 rounded-md py-2.5 px-3.5 self-start">
                      <CheckIcon className="h-4 w-4" />
                      <span>Unlimited Orders Enabled</span>
                    </div>
                  )}
                </div>
              )}
            </form.Field>

            {/* Max Categories */}
            <form.Field name="features.max_categories">
              {(field) => (
                <div className="flex flex-col gap-4 p-5 border border-hairline-light rounded-lg bg-canvas-cream/15 transition-all duration-200">
                  <div className="flex items-start gap-3 border-b border-hairline-light/50 pb-3">
                    <div className="p-2 bg-canvas-cream rounded-md text-shade-60">
                      <FolderOpenIcon className="h-5 w-5" />
                    </div>
                    <div className="grow">
                      <IosSwitch
                        checked={categoriesUnlimited}
                        onChange={(checked) => {
                          setCategoriesUnlimited(checked)
                          if (checked) {
                            field.handleChange(null)
                          } else {
                            field.handleChange(initialData?.features.max_categories || 5)
                          }
                        }}
                        label="Unlimited Categories"
                        description="Boutiques can create unlimited product categories"
                      />
                    </div>
                  </div>

                  {!categoriesUnlimited && (
                    <div className="flex flex-col gap-2.5 animate-fade-in">
                      <span className="text-micro font-semibold text-shade-60">Custom Limit Count</span>
                      <NumberAdjuster
                        id={field.name}
                        value={field.state.value}
                        onChange={(val) => field.handleChange(val)}
                        min={1}
                      />
                    </div>
                  )}

                  {categoriesUnlimited && (
                    <div className="flex items-center gap-2 text-emerald-800 text-micro font-semibold bg-emerald-50/50 border border-emerald-100 rounded-md py-2.5 px-3.5 self-start">
                      <CheckIcon className="h-4 w-4" />
                      <span>Unlimited Categories Enabled</span>
                    </div>
                  )}
                </div>
              )}
            </form.Field>

            {/* Max Variants per Product */}
            <form.Field name="features.max_variants_per_product">
              {(field) => (
                <div className="flex flex-col gap-4 p-5 border border-hairline-light rounded-lg bg-canvas-cream/15 transition-all duration-200">
                  <div className="flex items-start gap-3 border-b border-hairline-light/50 pb-3">
                    <div className="p-2 bg-canvas-cream rounded-md text-shade-60">
                      <LayersIcon className="h-5 w-5" />
                    </div>
                    <div className="grow">
                      <IosSwitch
                        checked={variantsUnlimited}
                        onChange={(checked) => {
                          setVariantsUnlimited(checked)
                          if (checked) {
                            field.handleChange(null)
                          } else {
                            field.handleChange(initialData?.features.max_variants_per_product || 10)
                          }
                        }}
                        label="Unlimited Product Variants"
                        description="Boutiques can create unlimited options per product"
                      />
                    </div>
                  </div>

                  {!variantsUnlimited && (
                    <div className="flex flex-col gap-2.5 animate-fade-in">
                      <span className="text-micro font-semibold text-shade-60">Custom Limit Count</span>
                      <NumberAdjuster
                        id={field.name}
                        value={field.state.value}
                        onChange={(val) => field.handleChange(val)}
                        min={1}
                      />
                    </div>
                  )}

                  {variantsUnlimited && (
                    <div className="flex items-center gap-2 text-emerald-800 text-micro font-semibold bg-emerald-50/50 border border-emerald-100 rounded-md py-2.5 px-3.5 self-start">
                      <CheckIcon className="h-4 w-4" />
                      <span>Unlimited Variants Enabled</span>
                    </div>
                  )}
                </div>
              )}
            </form.Field>

            {/* Max Images per Product */}
            <form.Field name="features.max_images_per_product">
              {(field) => (
                <div className="flex flex-col gap-4 p-5 border border-hairline-light rounded-lg bg-canvas-cream/15">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-canvas-cream rounded-md text-shade-60 shrink-0">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-caption font-semibold text-ink leading-tight">
                        Max Images per Product
                      </span>
                      <span className="text-micro font-light text-shade-50 mt-0.5">
                        Allowed images in a single product listing. Cannot be unlimited.
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-hairline-light/50 pt-3 flex flex-col gap-2">
                    <span className="text-micro font-semibold text-shade-60">Allowed Photos</span>
                    <NumberAdjuster
                      id={field.name}
                      value={field.state.value}
                      onChange={(val) => field.handleChange(val || 5)}
                      min={1}
                      required={true}
                    />
                  </div>
                </div>
              )}
            </form.Field>

            {/* Image Size Limit */}
            <form.Field name="features.image_size_limit_mb">
              {(field) => (
                <div className="flex flex-col gap-4 p-5 border border-hairline-light rounded-lg bg-canvas-cream/15">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-canvas-cream rounded-md text-shade-60 shrink-0">
                      <HardDriveIcon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-caption font-semibold text-ink leading-tight">
                        Max File Size per Image (MB)
                      </span>
                      <span className="text-micro font-light text-shade-50 mt-0.5">
                        Storage quota per image uploaded. Cannot be unlimited.
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-hairline-light/50 pt-3 flex flex-col gap-2">
                    <span className="text-micro font-semibold text-shade-60">Max Size (MB)</span>
                    <NumberAdjuster
                      id={field.name}
                      value={field.state.value}
                      onChange={(val) => field.handleChange(val || 2)}
                      min={1}
                      required={true}
                    />
                  </div>
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* Section 3: Feature Capabilities */}
        <Card className="border border-hairline-light bg-canvas-light p-6">
          <CardHeader className="px-0 pt-0 pb-4 border-b border-hairline-light mb-6">
            <CardTitle className="text-heading-lg font-display font-semibold text-ink">
              3. Feature Capabilities
            </CardTitle>
            <CardDescription className="text-caption text-shade-50">
              Select key features and integrations accessible to merchants on this plan.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Discount Codes */}
              <form.Field name="features.discount_codes">
                {(field) => {
                  const isChecked = !!field.state.value
                  return (
                    <div
                      onClick={() => field.handleChange(!isChecked)}
                      className={`flex items-start gap-3.5 p-5 border rounded-lg cursor-pointer transition-all duration-200 select-none ${isChecked
                          ? "border-emerald-850 bg-aloe-10/20"
                          : "border-hairline-light bg-canvas-light hover:bg-canvas-cream/30"
                        }`}
                    >
                      <div className={`p-2.5 rounded-full shrink-0 ${isChecked ? "bg-emerald-800 text-white" : "bg-canvas-cream text-shade-60"}`}>
                        <PercentIcon className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col grow">
                        <div className="flex items-center justify-between">
                          <span className="text-caption font-semibold text-ink leading-tight">Discount Codes</span>
                          {isChecked && (
                            <span className="text-[10px] uppercase font-bold text-emerald-850 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-sans tracking-wide">
                              Enabled
                            </span>
                          )}
                        </div>
                        <span className="text-micro font-light text-shade-50 mt-1.5">
                          Allows boutiques to create fixed or percentage-based discount coupons at checkout.
                        </span>
                      </div>
                    </div>
                  )
                }}
              </form.Field>

              {/* Telegram Notifications */}
              <form.Field name="features.telegram_notifications">
                {(field) => {
                  const isChecked = !!field.state.value
                  return (
                    <div
                      onClick={() => field.handleChange(!isChecked)}
                      className={`flex items-start gap-3.5 p-5 border rounded-lg cursor-pointer transition-all duration-200 select-none ${isChecked
                          ? "border-emerald-850 bg-aloe-10/20"
                          : "border-hairline-light bg-canvas-light hover:bg-canvas-cream/30"
                        }`}
                    >
                      <div className={`p-2.5 rounded-full shrink-0 ${isChecked ? "bg-emerald-800 text-white" : "bg-canvas-cream text-shade-60"}`}>
                        <SendIcon className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col grow">
                        <div className="flex items-center justify-between">
                          <span className="text-caption font-semibold text-ink leading-tight">Telegram Alerts</span>
                          {isChecked && (
                            <span className="text-[10px] uppercase font-bold text-emerald-850 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-sans tracking-wide">
                              Enabled
                            </span>
                          )}
                        </div>
                        <span className="text-micro font-light text-shade-50 mt-1.5">
                          Enables real-time push notifications about new orders to the boutique owner's Telegram chat.
                        </span>
                      </div>
                    </div>
                  )
                }}
              </form.Field>

              {/* COD */}
              <form.Field name="features.cod">
                {(field) => {
                  const isChecked = !!field.state.value
                  return (
                    <div
                      onClick={() => field.handleChange(!isChecked)}
                      className={`flex items-start gap-3.5 p-5 border rounded-lg cursor-pointer transition-all duration-200 select-none ${isChecked
                          ? "border-emerald-850 bg-aloe-10/20"
                          : "border-hairline-light bg-canvas-light hover:bg-canvas-cream/30"
                        }`}
                    >
                      <div className={`p-2.5 rounded-full shrink-0 ${isChecked ? "bg-emerald-800 text-white" : "bg-canvas-cream text-shade-60"}`}>
                        <CoinsIcon className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col grow">
                        <div className="flex items-center justify-between">
                          <span className="text-caption font-semibold text-ink leading-tight">Cash on Delivery</span>
                          {isChecked && (
                            <span className="text-[10px] uppercase font-bold text-emerald-850 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-sans tracking-wide">
                              Enabled
                            </span>
                          )}
                        </div>
                        <span className="text-micro font-light text-shade-50 mt-1.5">
                          Allows customers of the boutique to choose cash payment upon delivery rather than advance mobile pay.
                        </span>
                      </div>
                    </div>
                  )
                }}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Form Action Controls */}
        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ canSubmit }) => (
            <div className="flex justify-end pt-4 border-t border-hairline-light">
              <Button
                type="submit"
                disabled={!canSubmit || loading}
                variant="primary"
                className="flex items-center gap-2 font-medium px-8 py-3 cursor-pointer"
              >
                {loading ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <SaveIcon className="h-4 w-4" />
                )}
                <span>{isEdit ? "Save Plan Changes" : "Create & Launch Plan"}</span>
              </Button>
            </div>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}
