import React from "react"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { getMerchantById } from "@/db/queries/merchants"
import { getTemplate } from "@/templates/registry"
import { Suspense } from "react"
import { connection } from "next/server"

type Props = {
  params: Promise<{ subdomain: string }>
}

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
  const template = headersList.get("x-merchant-template") || "general"

  if (!merchantId) {
    notFound()
  }

  const merchant = await getMerchantById(merchantId)

  const store = {
    id: merchant?.id || "",
    name: merchant?.name || "Boutique Store",
    subdomain: merchant?.subdomain || subdomain,
    template,
    heroImageUrl: merchant?.heroImageUrl || null,
    subtitle: merchant?.subtitle || null,
    description: merchant?.storeDescription || null,
    address: merchant?.storeAddress || null,
    socialLinks: merchant?.socialLinks || null,
    customFaqs: merchant?.customFaqs || null,
  }

  const templateModule = getTemplate(template)

  return (
    <templateModule.CartPage store={store} />
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
