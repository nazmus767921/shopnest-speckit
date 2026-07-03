import React from "react"
import { getAllPlansAdmin } from "@/db/queries/plans"
import { PlansList } from "./components/PlansList"

export const metadata = {
  title: "Subscription Plans Management — ShopNest Super Admin",
  description: "Create, edit, and archive subscription plans and resource limits.",
}

export default async function AdminPlansPage() {
  const plansList = await getAllPlansAdmin()

  // Format plans features for safety and pass to client component
  const formattedPlans = plansList.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    pricePaisa: p.pricePaisa,
    isActive: p.isActive,
    isArchived: p.isArchived,
    features: {
      max_products: p.features.max_products ?? null,
      max_orders_per_month: p.features.max_orders_per_month ?? null,
      max_categories: p.features.max_categories ?? null,
      max_variants_per_product: p.features.max_variants_per_product ?? null,
      max_images_per_product: p.features.max_images_per_product ?? 5,
      image_size_limit_mb: p.features.image_size_limit_mb ?? 2,
      discount_codes: !!p.features.discount_codes,
      telegram_notifications: !!p.features.telegram_notifications,
      cod: !!p.features.cod,
    },
  }))

  const activeCount = formattedPlans.filter((p) => !p.isArchived).length
  const archivedCount = formattedPlans.filter((p) => p.isArchived).length

  return (
    <div className="flex flex-col gap-8 animate-fade-in select-text max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-hairline-light">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-heading-xl tracking-tight text-ink font-semibold leading-none">
              Subscription Plans
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-emerald-850 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-sans tracking-wide">
                {activeCount} Active
              </span>
              {archivedCount > 0 && (
                <span className="text-[10px] uppercase font-bold text-shade-50 bg-shade-30/15 px-2 py-0.5 rounded border border-hairline-light font-sans tracking-wide">
                  {archivedCount} Archived
                </span>
              )}
            </div>
          </div>
          <p className="text-caption text-shade-50 font-light mt-1">
            Define pricing, feature capabilities, and resource limits for Starter, Growth, Pro, and custom plans.
          </p>
        </div>
      </div>

      <PlansList initialPlans={formattedPlans} />
    </div>
  )
}
