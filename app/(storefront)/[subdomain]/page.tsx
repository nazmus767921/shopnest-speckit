import React from "react"
import { headers } from "next/headers"
import { getCachedPublishedProducts } from "@/lib/cache/products"
import { getCachedMerchantById } from "@/lib/cache/merchants"
import { getTemplate } from "@/templates/registry"
import { type CategoryWithProducts } from "@/templates/types"
import { getCachedStorefrontSections } from "@/lib/cache/storefront"
import { defaultStorefrontSections } from "@/lib/storefront-sections/defaults"
import { Suspense } from "react"
import { connection } from "next/server"

export const instant = false

type Props = {
  params: Promise<{ subdomain: string }>
}

export default function StorefrontPage({ params }: Props) {
  return (
    <Suspense fallback={<StorefrontPageSkeleton />}>
      <StorefrontPageContent params={params} />
    </Suspense>
  )
}

async function StorefrontPageContent({ params }: Props) {
  await connection()
  const { subdomain } = await params
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id") || ""
  const template = headersList.get("x-merchant-template") || "general"

  const merchant = merchantId ? await getCachedMerchantById(merchantId) : null

  const store = {
    id: merchant?.id || "",
    name: merchant?.name || "Boutique Store",
    subdomain: merchant?.subdomain || subdomain,
    template,
  }

  let sections = merchantId ? await getCachedStorefrontSections(merchantId) : []
  if (!sections || sections.length === 0) {
    sections = defaultStorefrontSections as any
  }

  const templateModule = getTemplate(template)

  return (
    <templateModule.HomePage
      store={store}
      sections={sections as any}
    />
  )
}

function StorefrontPageSkeleton() {
  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto animate-pulse px-4 sm:px-6 lg:px-8">
      <div className="relative aspect-[3/1] w-full rounded-3xl bg-zinc-200 mt-4" />
      <div className="flex flex-col gap-6 w-full">
        <div className="h-6 w-48 bg-zinc-200 rounded-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-64 bg-zinc-200 rounded-2xl" />
          <div className="h-64 bg-zinc-200 rounded-2xl" />
          <div className="h-64 bg-zinc-200 rounded-2xl" />
          <div className="h-64 bg-zinc-200 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
