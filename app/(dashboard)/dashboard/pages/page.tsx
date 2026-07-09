import React, { Suspense } from "react"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getPages } from "@/db/queries/pages"
import { PagesClient } from "./components/pages-client"

export const metadata = {
  title: "Pages — ShopNest Dashboard",
  description: "Create and manage standard content pages for your storefront.",
}

export default function PagesPage() {
  return (
    <Suspense fallback={<PagesSkeleton />}>
      <PagesPageContent />
    </Suspense>
  )
}

async function PagesPageContent() {
  const session = await auth.api.getSession({ headers: await headers() })
  const merchant = session ? await getMerchantByOwnerId(session.user.id) : null

  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-64 text-foreground">
        <p className="text-muted-foreground">Merchant account not found.</p>
      </div>
    )
  }

  const initialPages = await getPages(merchant.id)

  return (
    <div className="flex flex-col gap-8 animate-fade-in text-foreground">
      <div className="pb-2 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight text-foreground leading-none">
          Pages
        </h1>
        <p className="text-sm text-muted-foreground font-light mt-1">
          Manage standard rich text pages like About Us, Contact, and Policies.
        </p>
      </div>

      <PagesClient initialPages={initialPages} merchantId={merchant.id} />
    </div>
  )
}

function PagesSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse text-foreground">
      <div className="pb-2 border-b border-border">
        <div className="h-8 w-48 bg-muted rounded-full" />
        <div className="h-4 w-64 bg-muted rounded-full mt-2" />
      </div>
      <div className="bg-card border border-border rounded-xl p-6 h-64 w-full" />
    </div>
  )
}
