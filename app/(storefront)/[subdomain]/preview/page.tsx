import React, { Suspense } from "react"
import { connection } from "next/server"
import { headers } from "next/headers"
import { getCachedMerchantById } from "@/lib/cache/merchants"
import { getCachedStorefrontSections } from "@/lib/cache/storefront"
import { defaultStorefrontSections } from "@/lib/storefront-sections/defaults"
import { PreviewClient } from "./PreviewClient"

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-zinc-50 animate-pulse" />}>
      <PreviewPageContent />
    </Suspense>
  )
}

async function PreviewPageContent() {
  await connection()
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id")

  if (!merchantId) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Preview requires a merchant context.
      </div>
    )
  }

  const merchant = await getCachedMerchantById(merchantId)
  if (!merchant) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Store not found.
      </div>
    )
  }

  let sections = await getCachedStorefrontSections(merchantId)
  if (!sections || sections.length === 0) {
    sections = defaultStorefrontSections as any
  }

  return (
    <PreviewClient 
      initialSections={sections} 
      initialThemeSettings={merchant.themeSettings} 
    />
  )
}
