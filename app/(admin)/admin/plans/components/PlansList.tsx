"use client"

import React, { useState } from "react"
import Link from "next/link"
import { archivePlanAction, unarchivePlanAction } from "@/app/actions/plans"
import { Button, Card, Badge, Alert } from "@/components/ui"
import { PlusIcon, Edit2Icon, ArchiveIcon, RotateCcwIcon, Loader2Icon, PackageIcon, ReceiptIcon, FolderOpenIcon, LayersIcon, ImageIcon, HardDriveIcon } from "@/lib/icons";


type PlanForList = {
  id: string
  name: string
  slug: string
  pricePaisa: number
  isActive: boolean
  isArchived: boolean
  features: {
    max_products: number | null
    max_orders_per_month: number | null
    max_categories: number | null
    max_variants_per_product: number | null
    max_images_per_product: number
    image_size_limit_mb: number
    discount_codes: boolean
    telegram_notifications: boolean
    cod: boolean
  }
}

interface PlansListProps {
  initialPlans: PlanForList[]
}

export function PlansList({ initialPlans }: PlansListProps) {
  const [plans, setPlans] = useState<PlanForList[]>(initialPlans)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleArchive = async (planId: string) => {
    setLoadingId(planId)
    setError(null)
    try {
      const res = await archivePlanAction(planId)
      if (res.success) {
        setPlans((prev) =>
          prev.map((p) => (p.id === planId ? { ...p, isArchived: true, isActive: false } : p))
        )
      } else {
        setError(res.error || "Failed to archive plan.")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoadingId(null)
    }
  }

  const handleUnarchive = async (planId: string) => {
    setLoadingId(planId)
    setError(null)
    try {
      const res = await unarchivePlanAction(planId)
      if (res.success) {
        setPlans((prev) =>
          prev.map((p) => (p.id === planId ? { ...p, isArchived: false, isActive: true } : p))
        )
      } else {
        setError(res.error || "Failed to restore plan.")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoadingId(null)
    }
  }

  const formatTaka = (paisa: number) => {
    return `৳${(paisa / 100).toLocaleString()}`
  }

  return (
    <div className="flex flex-col gap-6 select-text w-full">
      {error && (
        <Alert variant="destructive" className="animate-fade-in">
          {error}
        </Alert>
      )}

      {/* Control bar */}
      <div className="flex justify-between items-center gap-4 bg-canvas-cream/15 p-4 border border-hairline-light rounded-lg">
        <span className="text-caption font-mono text-shade-50 font-medium">
          Manage {plans.length} configured system plans
        </span>
        <Button
          variant="primary"
          size="sm"
          asChild
          className="flex items-center gap-2 cursor-pointer shadow-none font-semibold"
        >
          <Link href="/admin/plans/new">
            <PlusIcon className="h-4 w-4" />
            <span>Create Plan</span>
          </Link>
        </Button>
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isArchived = p.isArchived
          return (
            <Card
              key={p.id}
              className={`border transition-all duration-350 flex flex-col justify-between p-0 rounded-lg overflow-hidden ${isArchived
                  ? "opacity-65 bg-canvas-cream/30 border-dashed border-hairline-light"
                  : "bg-canvas-light border-hairline-light hover:border-emerald-800/30"
                }`}
            >
              <div>
                {/* Header card info */}
                <div className="p-6 border-b border-hairline-light/50 bg-canvas-cream/10">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-heading-lg font-display font-semibold text-ink leading-none">
                        {p.name}
                      </h3>
                      <span className="text-micro font-mono text-shade-50 bg-canvas-cream border border-hairline-light rounded px-2 py-0.5 mt-1 self-start uppercase tracking-wider font-semibold">
                        {p.slug}
                      </span>
                    </div>
                    {isArchived ? (
                      <Badge variant="shade" className="font-semibold">Archived</Badge>
                    ) : (
                      <Badge variant="mint" className="font-semibold bg-emerald-50 text-emerald-850 border border-emerald-100">Active</Badge>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1 mt-5">
                    <span className="text-display-md font-bold font-display text-ink leading-none">
                      {formatTaka(p.pricePaisa)}
                    </span>
                    <span className="text-shade-40 text-caption">/ month</span>
                  </div>
                </div>

                {/* Resource Limits List Grid */}
                <div className="p-6 flex flex-col gap-5">
                  <span className="text-[10px] uppercase font-bold text-shade-40 tracking-wider">
                    Resource Quotas
                  </span>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-caption">
                    {/* Products limit */}
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-canvas-cream text-shade-60 rounded border border-hairline-light shrink-0">
                        <PackageIcon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-shade-40 leading-none">Products</span>
                        <span className="font-semibold text-ink mt-0.5 leading-none font-sans">
                          {p.features.max_products !== null ? `${p.features.max_products} active` : "Unlimited"}
                        </span>
                      </div>
                    </div>

                    {/* Orders limit */}
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-canvas-cream text-shade-60 rounded border border-hairline-light shrink-0">
                        <ReceiptIcon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-shade-40 leading-none">Orders/Mo</span>
                        <span className="font-semibold text-ink mt-0.5 leading-none font-sans">
                          {p.features.max_orders_per_month !== null ? `${p.features.max_orders_per_month}` : "Unlimited"}
                        </span>
                      </div>
                    </div>

                    {/* Categories limit */}
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-canvas-cream text-shade-60 rounded border border-hairline-light shrink-0">
                        <FolderOpenIcon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-shade-40 leading-none">Categories</span>
                        <span className="font-semibold text-ink mt-0.5 leading-none font-sans">
                          {p.features.max_categories !== null ? `${p.features.max_categories}` : "Unlimited"}
                        </span>
                      </div>
                    </div>

                    {/* Variants limit */}
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-canvas-cream text-shade-60 rounded border border-hairline-light shrink-0">
                        <LayersIcon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-shade-40 leading-none">Variants</span>
                        <span className="font-semibold text-ink mt-0.5 leading-none font-sans">
                          {p.features.max_variants_per_product !== null ? `${p.features.max_variants_per_product}` : "Unlimited"}
                        </span>
                      </div>
                    </div>

                    {/* Images limit */}
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-canvas-cream text-shade-60 rounded border border-hairline-light shrink-0">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-shade-40 leading-none">Images</span>
                        <span className="font-semibold text-ink mt-0.5 leading-none font-sans">
                          {p.features.max_images_per_product} photos
                        </span>
                      </div>
                    </div>

                    {/* Image size limit */}
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-canvas-cream text-shade-60 rounded border border-hairline-light shrink-0">
                        <HardDriveIcon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-shade-40 leading-none">Max Size</span>
                        <span className="font-semibold text-ink mt-0.5 leading-none font-sans">
                          {p.features.image_size_limit_mb} MB
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Capabilities Capsule List */}
                  <div className="border-t border-hairline-light/50 pt-4.5 flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold text-shade-40 tracking-wider">
                      Features Enabled
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors select-none ${p.features.discount_codes
                            ? "bg-emerald-50 text-emerald-850 border-emerald-100 font-bold"
                            : "bg-shade-30/10 text-shade-40 border-hairline-light/50"
                          }`}
                      >
                        % Discounts
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors select-none ${p.features.telegram_notifications
                            ? "bg-emerald-50 text-emerald-850 border-emerald-100 font-bold"
                            : "bg-shade-30/10 text-shade-40 border-hairline-light/50"
                          }`}
                      >
                        Telegram Alerts
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors select-none ${p.features.cod
                            ? "bg-emerald-50 text-emerald-850 border-emerald-100 font-bold"
                            : "bg-shade-30/10 text-shade-40 border-hairline-light/50"
                          }`}
                      >
                        COD Support
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-4 border-t border-hairline-light/50 flex items-center justify-end gap-2 bg-canvas-cream/10 mt-auto">
                <Button
                  variant="outline-light"
                  size="sm"
                  asChild
                  disabled={loadingId === p.id}
                  className="flex items-center gap-1.5 min-h-9 px-3.5 text-caption font-semibold cursor-pointer border-hairline hover:bg-canvas-cream"
                >
                  <Link href={`/admin/plans/edit/${p.id}`}>
                    <Edit2Icon className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </Link>
                </Button>
                {isArchived ? (
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => handleUnarchive(p.id)}
                    disabled={loadingId === p.id}
                    className="flex items-center gap-1.5 min-h-9 px-3.5 text-caption font-semibold cursor-pointer border-emerald-200 text-emerald-850 hover:bg-emerald-50/50"
                  >
                    {loadingId === p.id ? (
                      <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcwIcon className="h-3.5 w-3.5" />
                    )}
                    <span>Restore</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => handleArchive(p.id)}
                    disabled={loadingId === p.id}
                    className="flex items-center gap-1.5 min-h-9 px-3.5 text-caption font-semibold cursor-pointer border-red-100 text-red-700 hover:bg-red-50/50"
                  >
                    {loadingId === p.id ? (
                      <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ArchiveIcon className="h-3.5 w-3.5" />
                    )}
                    <span>ArchiveIcon</span>
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
