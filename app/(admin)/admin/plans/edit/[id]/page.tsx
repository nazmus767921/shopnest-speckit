import React from "react"
import { getPlanById } from "@/db/queries/plans"
import { updatePlanAction } from "@/app/actions/plans"
import { PlanForm } from "../../components/PlanForm"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "@/lib/icons";

import Link from "next/link"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  return {
    title: `Edit Subscription Plan — ShopNest Super Admin`,
    description: `Modify subscription plan configurations for ID ${id}.`,
  }
}

export default async function EditPlanPage({ params }: Props) {
  const { id } = await params
  const plan = await getPlanById(id)
  if (!plan) {
    notFound()
  }

  // Format initial values
  const formattedPlan = {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    pricePaisa: plan.pricePaisa,
    features: {
      max_products: plan.features.max_products ?? null,
      max_orders_per_month: plan.features.max_orders_per_month ?? null,
      max_categories: plan.features.max_categories ?? null,
      max_variants_per_product: plan.features.max_variants_per_product ?? null,
      max_images_per_product: plan.features.max_images_per_product ?? 5,
      image_size_limit_mb: plan.features.image_size_limit_mb ?? 2,
      discount_codes: !!plan.features.discount_codes,
      telegram_notifications: !!plan.features.telegram_notifications,
      cod: !!plan.features.cod,
    },
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in select-text max-w-4xl mx-auto">
      {/* Premium Header */}
      <div className="flex flex-col gap-2 pb-6 border-b border-hairline-light">
        <div className="flex items-center gap-1.5 text-shade-40 hover:text-ink transition-colors self-start mb-1">
          <ArrowLeftIcon className="h-4 w-4" />
          <Link href="/admin/plans" className="text-micro font-semibold font-mono uppercase tracking-wider">
            Back to Plans List
          </Link>
        </div>
        <h1 className="font-display text-heading-xl tracking-tight text-ink font-semibold leading-none">
          Edit Plan: {plan.name}
        </h1>
        <p className="text-caption text-shade-50 font-light">
          Modify pricing, resource limits, and capability configurations. Slug identifier remains immutable.
        </p>
      </div>

      <PlanForm
        initialData={formattedPlan}
        isEdit={true}
        onSubmit={async (values) => {
          "use server"
          return await updatePlanAction(id, values)
        }}
      />
    </div>
  )
}
