import React from "react"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { CartClientPage } from "@/components/storefront/CartClientPage"

type Props = {
  params: Promise<{ subdomain: string }>
}

import { Suspense } from "react"
import { connection } from "next/server"

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
  const merchantId = headersList.get("x-merchant-id")
  const merchantName = headersList.get("x-merchant-name") || "Boutique Store"

  if (!merchantId) {
    notFound()
  }

  return (
    <CartClientPage
      merchantId={merchantId}
      merchantName={merchantName}
      subdomain={subdomain}
    />
  )
}

function CartSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 w-48 bg-shade-30 rounded-full mb-6" />
      <div className="bg-canvas-light border border-hairline-light rounded-lg p-6 h-64 w-full" />
    </div>
  )
}

