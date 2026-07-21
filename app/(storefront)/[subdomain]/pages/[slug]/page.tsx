
import React, { Suspense } from "react"
import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { connection } from "next/server"
import { getCachedMerchantById } from "@/lib/cache/merchants"
import { getCachedPageBySlug } from "@/db/queries/pages"
import { getTemplate } from "@/templates/registry"



type Props = {
  params: Promise<{ subdomain: string; slug: string }>
}

export default async function StandardPage({ params }: Props) {
  return (
    <Suspense fallback={<div>Loading page...</div>}>
      <StandardPageContent params={params} />
    </Suspense>
  )
}

async function StandardPageContent({ params }: Props) {
  await connection()
  
  const { subdomain, slug } = await params
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id") || ""
  const template = headersList.get("x-merchant-template") || "general"

  if (!merchantId) {
    notFound()
  }


  const [merchant, page] = await Promise.all([
    getCachedMerchantById(merchantId),
    getCachedPageBySlug(merchantId, slug)
  ])

  if (!page) {
    notFound()
  }

  const store = {
    id: merchant?.id || "",
    name: merchant?.name || "Boutique Store",
    subdomain: merchant?.subdomain || subdomain,
    template,
    themeSettings: merchant?.themeSettings || null,
  }

  const templateModule = getTemplate(template)
  const TemplatePage = templateModule.pages?.standard

  if (!TemplatePage) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1>{page.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: page.content || "" }} />
      </div>
    )
  }

  return (
    <TemplatePage
      store={store}
      page={{
        id: page.id,
        title: page.title,
        content: page.content || "",
      }}
    />
  )
}
