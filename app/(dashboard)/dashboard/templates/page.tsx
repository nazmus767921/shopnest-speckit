import React from "react"
import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getActiveTemplates } from "@/db/queries/templates"
import { getStorefrontSections } from "@/db/queries/storefront-sections"
import { TemplatesPageClient } from "./components/TemplatesPageClient"

import { connection } from "next/server"

export const metadata: Metadata = {
  title: "Templates | Shopnest",
}

import { Suspense } from "react"

export default function TemplatesPage() {
  return (
    <div className="flex-1 w-full max-w-6xl mx-auto space-y-8 animate-fade-in p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-heading-xl font-bold text-ink">Storefront Templates</h1>
        <p className="text-body-md text-shade-50">
          Choose a design template for your storefront and customize the homepage sections.
        </p>
      </div>

      <Suspense fallback={<div className="h-96 flex items-center justify-center text-shade-50">Loading templates...</div>}>
        <TemplatesPageContent />
      </Suspense>
    </div>
  )
}

async function TemplatesPageContent() {
  await connection()

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return redirect("/login")
  }

  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) {
    return redirect("/onboarding")
  }

  const activeTemplates = await getActiveTemplates()
  const currentTier = merchant.plan || "starter"
  
  // Transform templates to include locking logic based on current plan
  const mappedTemplates = activeTemplates.map((t) => {
    let isLocked = false
    if (t.allowedTiers.includes("growth") && currentTier === "starter") isLocked = true
    if (t.allowedTiers.includes("pro") && ["starter", "growth"].includes(currentTier)) isLocked = true
    return {
      id: t.id,
      slug: t.slug,
      name: t.name,
      description: `Best for ${t.businessTypes.join(", ")}`,
      isLocked,
      allowedTiers: t.allowedTiers,
    }
  })

  const sections = await getStorefrontSections(merchant.id, false) // Fetch all sections, not just visible ones

  return (
    <TemplatesPageClient 
      templates={mappedTemplates} 
      currentTemplate={merchant.template || "general"} 
      initialSections={sections as any}
    />
  )
}
