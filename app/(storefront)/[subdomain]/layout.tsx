import React from "react"
import { headers } from "next/headers"
import type { Metadata } from "next"
import "@/lib/storefront/theme/storefront-tokens.css"
import { Archivo_Black } from "next/font/google"
import { Suspense } from "react"
import { connection } from "next/server"
import { fontClasses } from "@/lib/storefront/theme/fonts"
import { getStorefrontContext } from "@/lib/storefront/data/context"
import { generateThemeCss } from "@/lib/storefront/theme/generate-css"
import { StorefrontNavbar } from "@/components/storefront/shared/StorefrontNavbar"
// A dummy footer for now since we deleted the template
const DummyFooter = ({ store }: any) => <footer className="bg-zinc-900 text-white p-8 text-center mt-auto">© 2024 {store.name}. All rights reserved.</footer>

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
  
  const previewTemplateSlug = headersList.get("x-template-preview")
  const context = await getStorefrontContext(subdomain, previewTemplateSlug)
  
  const customCss = context.cssVariables ? generateThemeCss(context.cssVariables) : ''

  return (
    <div className={`${archivoBlack.variable} ${fontClasses} min-h-screen flex flex-col font-sans theme-${context.templateSlug}`}>
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      {context.isPreview && (
        <div className="bg-blue-600 text-white text-center text-sm py-2 px-4 sticky top-0 z-[100] font-sans">
          <strong>Preview Mode:</strong> You are currently previewing changes.
        </div>
      )}
      <StorefrontNavbar store={context.store} menus={context.menus as any} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <DummyFooter store={context.store} />
    </div>
  )
}
