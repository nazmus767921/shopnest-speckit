import React from "react"
import { headers } from "next/headers"
import type { Metadata } from "next"
import "@/templates/elegance/styles.css"
import "@/lib/storefront/theme/storefront-tokens.css"
import { Archivo_Black } from "next/font/google"
import { Suspense } from "react"
import { connection } from "next/server"
import { fontClasses } from "@/lib/storefront/theme/fonts"
import { getStorefrontContext } from "@/lib/storefront/data/context"
import { getTemplate } from "@/templates/registry"

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
      <div className={`${archivoBlack.variable} ${fontClasses}`}>
        <StorefrontThemeWrapper params={params}>
          {children}
        </StorefrontThemeWrapper>
      </div>
    </Suspense>
  )
}

async function StorefrontThemeWrapper({ children, params }: Props) {
  await connection()
  const { subdomain } = await params
  const headersList = await headers()
  
  const previewTemplateSlug = headersList.get("x-template-preview")

  const context = await getStorefrontContext(subdomain, previewTemplateSlug)
  const { store, templateSlug, menus, categories, themeVars } = context
  const template = getTemplate(templateSlug)
  
  return (
    <template.Shell 
      store={store} 
      menus={menus as any} 
      categories={categories as any}
      themeVars={themeVars}
    >
      {context.isPreview && (
        <div className="bg-blue-600 text-white text-center text-sm py-2 px-4 sticky top-0 z-[100] font-sans">
          <strong>Preview Mode:</strong> You are currently previewing the <strong>{template.metadata.name}</strong> template.
        </div>
      )}
      {children}
    </template.Shell>
  )
}
