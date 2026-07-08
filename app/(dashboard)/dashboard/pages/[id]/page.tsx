import React from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getPageById } from "@/db/queries/pages"
import { PageForm } from "../components/page-form"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Edit Page — ShopNest Dashboard",
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditPage({ params }: PageProps) {
  const { id } = await params
  
  const session = await auth.api.getSession({ headers: await headers() })
  const merchant = session ? await getMerchantByOwnerId(session.user.id) : null

  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-shade-50">Merchant account not found.</p>
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
    <div className="flex flex-col gap-8 animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/pages"
          className="flex items-center gap-2 text-caption text-shade-50 hover:text-ink transition-colors w-fit"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Pages</span>
        </Link>
        <div className="pb-4 border-b border-hairline-light">
          <h1 className="font-display text-heading-xl tracking-tight text-ink font-semibold leading-none">
            Edit Page
          </h1>
        </div>
      </div>

      <PageForm initialData={initialData} />
    </div>
  )
}
