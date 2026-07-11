import React from "react"
import { createPlanAction } from "@/app/actions/plans"
import { PlanForm } from "../components/PlanForm"
import { ArrowLeftIcon } from "@/lib/icons";

import Link from "next/link"

export const metadata = {
  title: "Create Subscription Plan — ShopNest Super Admin",
  description: "Create a new subscription plan with specific limits and features.",
}

export default async function NewPlanPage() {
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
          Create New Plan
        </h1>
        <p className="text-caption text-shade-50 font-light">
          Define monthly pricing, feature capabilities, and resource limits for the new subscription plan.
        </p>
      </div>

      <PlanForm
        onSubmit={async (values) => {
          "use server"
          return await createPlanAction(values)
        }}
      />
    </div>
  )
}
