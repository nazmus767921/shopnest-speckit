import React, { Suspense } from "react"
import { db } from "@/db"
import { themes, merchantThemes } from "@/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { TemplatesClient } from "./components/TemplatesClient"

export const instant = false

async function TemplatesContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) {
    redirect("/onboarding")
  }

  const merchantId = merchant.id

  // Fetch all available themes
  const availableThemes = await db.select().from(themes)

  // Fetch the merchant's current theme
  const currentThemeData = await db.query.merchantThemes.findFirst({
    where: eq(merchantThemes.merchantId, merchantId)
  })

  const activeThemeId = currentThemeData?.themeId || "elegance"

  return (
    <TemplatesClient 
      themes={availableThemes} 
      activeThemeId={activeThemeId} 
    />
  )
}

export default function TemplatesPage() {
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Storefront Templates</h1>
        <p className="text-muted-foreground text-lg">
          Choose a base design system for your storefront. You can customize the layout in the visual editor.
        </p>
      </div>

      <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading templates...</div>}>
        <TemplatesContent />
      </Suspense>
    </div>
  )
}
