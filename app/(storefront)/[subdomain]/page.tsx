import React from "react"
import { headers } from "next/headers"
import { getStorefrontContext } from "@/lib/storefront/data/context"
import { Suspense } from "react"
import { connection } from "next/server"
import StorefrontPageClient from "./page-client"

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
  
  const previewTemplateSlug = headersList.get("x-template-preview")

  const context = await getStorefrontContext(subdomain, previewTemplateSlug)

  return (
    <StorefrontPageClient 
      initialLayout={context.sections} 
      store={context.store} 
      isPreview={context.isPreview} 
    />
  )
}

function StorefrontPageSkeleton() {
  return (
    <div className="flex flex-col gap-12 max-w-7xl mx-auto animate-pulse px-4 sm:px-6 lg:px-8 mt-12 w-full">
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
