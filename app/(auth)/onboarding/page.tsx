import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getAllPlans } from "@/db/queries/plans"
import OnboardingForm from "./OnboardingForm"

import { Suspense } from "react"

export const instant = false

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingSkeleton />}>
      <OnboardingPageContent />
    </Suspense>
  )
}

async function OnboardingPageContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    redirect("/login")
  }

  const merchant = await getMerchantByOwnerId(session.user.id)
  if (merchant) {
    redirect("/dashboard")
  }

  // Fetch dynamic plans from DB
  const plans = await getAllPlans()

  return <OnboardingForm plans={plans} />
}

function OnboardingSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-md bg-canvas-light p-8 rounded-2xl border border-hairline-light animate-pulse">
      <div className="h-6 w-32 bg-shade-30 rounded-full" />
      <div className="h-4 w-48 bg-shade-30 rounded-full" />
      <div className="h-10 w-full bg-shade-30 rounded-lg mt-4" />
      <div className="h-10 w-full bg-shade-30 rounded-lg" />
    </div>
  )
}
