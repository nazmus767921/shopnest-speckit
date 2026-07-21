import React from "react"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { getStorefrontContext } from "@/lib/storefront/data/context"
import { Suspense } from "react"
import { connection } from "next/server"

type Props = {
  params: Promise<{ subdomain: string }>
}

import { CartClientPage } from "@/components/storefront/pages/CartClientPage"

export default function CartPage({ params }: Props) {
  return (
    <Suspense fallback={<CartSkeleton />}>
      <CartPageContent params={params} />
    </Suspense>
  )
}

async function CartPageContent({ params }: Props) {
  await connection()
  const { subdomain } = await params
  const headersList = await headers()
  const previewTemplateSlug = headersList.get("x-template-preview")

  const context = await getStorefrontContext(subdomain, previewTemplateSlug)
  const { store } = context

  if (!store.id) {
    notFound()
  }

  return (
    <CartClientPage merchantId={store.id} merchantName={store.name} subdomain={subdomain} />
  )
}

function CartSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse mt-8">
      <div className="h-8 w-48 bg-zinc-200 rounded-full mb-6" />
      <div className="bg-zinc-100 rounded-lg p-6 h-64 w-full" />
    </div>
  )
}
