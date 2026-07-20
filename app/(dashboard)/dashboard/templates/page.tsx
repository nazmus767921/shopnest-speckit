import React from "react"
import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getActiveTemplates } from "@/db/queries/templates"
import { getCachedStorefrontSections } from "@/lib/cache/storefront"
import { TemplatesPageClient } from "./components/TemplatesPageClient"
import { TemplatesSkeleton } from "./components/TemplatesSkeleton"
import { ExternalLinkIcon } from "@/lib/icons"

import { connection } from "next/server"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Templates | Shopnest",
}

export default function TemplatesPage() {
  return (
    <div className="flex-1 w-full space-y-8 animate-fade-in p-6 text-foreground">
      <Suspense fallback={
        <>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-foreground">Storefront Templates</h1>
            <p className="text-sm text-muted-foreground">
              Customize your storefront's homepage sections and global theme settings.
            </p>
          </div>
          <TemplatesSkeleton />
        </>
      }>
        <TemplatesPageContent />
      </Suspense>
    </div>
  )
}

async function TemplatesPageContent() {
  await connection()

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return redirect("/login")
  }

  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) {
    return redirect("/onboarding")
  }

  const activeTemplates = await getActiveTemplates()
  const currentTier = merchant.plan || "starter"
  
  const mappedTemplates = activeTemplates.map((t) => {
    let isLocked = false
    if (t.allowedTiers.includes("growth") && currentTier === "starter") isLocked = true
    if (t.allowedTiers.includes("pro") && ["starter", "growth"].includes(currentTier)) isLocked = true
    return {
      id: t.id,
      slug: t.slug,
      name: t.name,
      description: `Best for ${t.businessTypes.join(", ")}`,
      isLocked,
      allowedTiers: t.allowedTiers,
      previewImageUrl: t.previewImageUrl,
    }
  })

  const sections = await getCachedStorefrontSections(merchant.id)
  const headersObj = await headers()
  const host = headersObj.get("host") || "localhost:3000"
  const protocol = host.includes("localhost") ? "http:" : "https:"
  const storeUrl = `${protocol}//${merchant.subdomain}.${host.replace("app.", "")}`

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">Storefront Templates</h1>
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-full"
          >
            Visit Store <ExternalLinkIcon className="w-4 h-4 ml-1" />
          </a>
        </div>
        <p className="text-sm text-muted-foreground">
          Customize your storefront's homepage sections and global theme settings.
        </p>
      </div>

      <TemplatesPageClient 
        templates={mappedTemplates} 
        currentTemplate={merchant.template || "elegance"} 
        initialSections={sections as any}
        initialThemeSettings={merchant.themeSettings as any}
        merchantSubdomain={merchant.subdomain || ""}
      />
    </>
  )
}
