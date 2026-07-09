import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getPageById } from "@/db/queries/pages"
import { PageForm } from "../components/page-form"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Edit Page — ShopNest Dashboard",
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditPage({ params }: PageProps) {
  return (
    <React.Suspense fallback={<div className="flex flex-col animate-pulse w-full h-[600px] bg-muted rounded-xl" />}>
      <EditPageContent params={params} />
    </React.Suspense>
  )
}

async function EditPageContent({ params }: PageProps) {
  const { id } = await params
  
  const session = await auth.api.getSession({ headers: await headers() })
  const merchant = session ? await getMerchantByOwnerId(session.user.id) : null

  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-64 text-foreground">
        <p className="text-muted-foreground">Merchant account not found.</p>
      </div>
    )
  }

  const page = await getPageById(merchant.id, id)

  if (!page) {
    notFound()
  }

  const initialData = {
    id: page.id,
    title: page.title,
    slug: page.slug,
    content: page.content || "",
    isPublished: page.isPublished,
  }

  return (
    <div className="flex flex-col animate-fade-in w-full">
      <PageForm initialData={initialData} />
    </div>
  )
}
