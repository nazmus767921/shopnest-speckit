import React from "react"
import { headers } from "next/headers"
import type { Metadata } from "next"
import "@/templates/general/styles.css"
import "@/templates/fashion/styles.css"
import { getMerchantById } from "@/db/queries/merchants"
import { getTemplate } from "@/templates/registry"
import { Archivo_Black } from "next/font/google"
import { Suspense } from "react"
import { connection } from "next/server"
import { getThemeVariables } from "@/lib/theme"

const archivoBlack = Archivo_Black({
  weight: "400",
  variable: "--font-archivo-black",
  subsets: ["latin"],
})

type Props = {
  children: React.ReactNode
  params: Promise<{ subdomain: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const merchantName = (await headers()).get("x-merchant-name") ?? "Boutique Store"
  return {
    title: `${merchantName} — Shop Online`,
    description: `Browse ${merchantName}'s boutique clothing collections and order online.`,
  }
}

export const instant = false

export default function StorefrontLayout({ children, params }: Props) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 animate-pulse" />}>
      <StorefrontThemeWrapper params={params}>
        {children}
      </StorefrontThemeWrapper>
    </Suspense>
  )
}

async function StorefrontThemeWrapper({ children, params }: Props) {
  await connection()
  const { subdomain } = await params
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id") || ""
  
  // Fetch full merchant record from DB
  const merchant = merchantId ? await getMerchantById(merchantId) : null
  const template = headersList.get("x-merchant-template") || merchant?.template || "general"
  const templateModule = getTemplate(template)

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
    themeSettings: merchant?.themeSettings || null,
  }

  const themeVars = getThemeVariables(store.themeSettings)

  return (
    <div style={themeVars} className={`storefront-template-${template} ${archivoBlack.variable} min-h-screen flex flex-col font-sans overflow-x-hidden`}>
      {/* Dynamic Template Header */}
      <templateModule.Navbar store={store} subdomain={subdomain} />

      {/* Main Content Area */}
      <main className={`grow px-4 md:px-8 ${template === "fashion" ? "pt-[81px] pb-16 md:pt-[89px] md:pb-24" : "py-8 md:py-12"}`}>
        <div className={`${template === "fashion" ? "max-w-10xl" : "max-w-7xl"} mx-auto`}>{children}</div>
      </main>

      {/* Dynamic Template Footer */}
      <templateModule.Footer store={store} />
    </div>
  )
}
