import React from "react"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { getMerchantById } from "@/db/queries/merchants"
import { getShippingZonesWithDistricts } from "@/db/queries/shippingZones"
import { CheckoutClientPage } from "@/components/storefront/CheckoutClientPage"
import type { Metadata } from "next"

type Props = {
  params: Promise<{ subdomain: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const merchantName = headersList.get("x-merchant-name") || "Boutique Store"
  return {
    title: `Checkout — ${merchantName}`,
  }
}

import { Suspense } from "react"
import { connection } from "next/server"

export default function CheckoutPage({ params }: Props) {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutPageContent params={params} />
    </Suspense>
  )
}

async function CheckoutPageContent({ params }: Props) {
  await connection()
  const { subdomain } = await params
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id")

  if (!merchantId) {
    notFound()
  }

  // Load merchant settings directly from database server-side (Zero-Trust Approach)
  const merchant = await getMerchantById(merchantId)
  if (!merchant) {
    notFound()
  }

  const shippingZones = await getShippingZonesWithDistricts(merchantId)

  return (
    <CheckoutClientPage
      merchantId={merchantId}
      merchantName={merchant.name}
      subdomain={subdomain}
      bkashNumber={merchant.bkashNumber}
      nagadNumber={merchant.nagadNumber}
      shippingZones={shippingZones}
    />
  )
}

function CheckoutSkeleton() {
  return (
    <div className="max-w-6xl mx-auto py-8 animate-pulse">
      <div className="h-8 w-48 bg-shade-30 rounded-full mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-canvas-light border border-hairline-light rounded-lg p-6 h-96 w-full" />
        <div className="bg-canvas-light border border-hairline-light rounded-lg p-6 h-64 w-full" />
      </div>
    </div>
  )
}

