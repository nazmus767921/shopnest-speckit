import React from "react"
import { headers } from "next/headers"
import type { Metadata } from "next"
import { getMerchantById } from "@/db/queries/merchants"
import { StorefrontNavbar } from "@/components/storefront/StorefrontNavbar"

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

import { Suspense } from "react"

export const instant = false

export default function StorefrontLayout({ children, params }: Props) {
  return (
    <div className="min-h-screen bg-canvas-cream text-ink flex flex-col font-sans">
      {/* Responsive Storefront Header */}
      <Suspense fallback={<NavbarSkeleton />}>
        <StorefrontNavbarWrapper params={params} />
      </Suspense>

      {/* Main Content Area */}
      <main className="grow py-12 px-6">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>

      {/* Modern responsive footer */}
      <Suspense fallback={<FooterSkeleton />}>
        <StorefrontFooterWrapper params={params} />
      </Suspense>
    </div>
  )
}

async function StorefrontNavbarWrapper({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params
  const headersList = await headers()
  const merchantName = headersList.get("x-merchant-name") || "Boutique Store"
  const merchantId = headersList.get("x-merchant-id") || ""

  return (
    <StorefrontNavbar
      merchantId={merchantId}
      subdomain={subdomain}
      merchantName={merchantName}
    />
  )
}

async function StorefrontFooterWrapper({ params }: { params: Promise<{ subdomain: string }> }) {
  const headersList = await headers()
  const merchantName = headersList.get("x-merchant-name") || "Boutique Store"
  const merchantId = headersList.get("x-merchant-id") || ""

  // Fetch full merchant record from DB to get address, social links, etc.
  const merchant = merchantId ? await getMerchantById(merchantId) : null

  // Parse social links
  const parsedSocialLinks: Record<string, string> = merchant?.socialLinks || {}
  const hasSocialLinks = Object.values(parsedSocialLinks).some((url) => !!url)

  return (
    <footer className="border-t border-hairline-light bg-canvas-light py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-3 text-center">
        <p className="text-caption text-shade-40">© 2026 {merchantName}. Powered by ShopNest.</p>
        {merchant?.storeAddress && (
          <p className="text-micro text-shade-40">{merchant.storeAddress}</p>
        )}
        {hasSocialLinks && (
          <div className="flex items-center gap-4 mt-1">
            {parsedSocialLinks.facebook && (
              <a
                href={parsedSocialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-shade-40 hover:text-ink transition-colors flex items-center justify-center w-7 h-7 bg-canvas-cream border border-hairline-light rounded-full"
                aria-label="Facebook"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                </svg>
              </a>
            )}
            {parsedSocialLinks.instagram && (
              <a
                href={parsedSocialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-shade-40 hover:text-ink transition-colors flex items-center justify-center w-7 h-7 bg-canvas-cream border border-hairline-light rounded-full"
                aria-label="Instagram"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            )}
            {parsedSocialLinks.whatsapp && (
              <a
                href={`https://wa.me/${parsedSocialLinks.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-shade-40 hover:text-ink transition-colors flex items-center justify-center w-7 h-7 bg-canvas-cream border border-hairline-light rounded-full"
                aria-label="WhatsApp"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </a>
            )}
            {parsedSocialLinks.tiktok && (
              <a
                href={parsedSocialLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="text-shade-40 hover:text-ink transition-colors flex items-center justify-center w-7 h-7 bg-canvas-cream border border-hairline-light rounded-full"
                aria-label="TikTok"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
    </footer>
  )
}

function NavbarSkeleton() {
  return (
    <header className="border-b border-hairline-light bg-canvas-light px-6 py-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 bg-shade-30 rounded-full" />
          <div className="h-6 w-32 bg-shade-30 rounded-full" />
        </div>
        <div className="hidden md:flex items-center gap-8">
          <div className="h-4 w-12 bg-shade-30 rounded-full" />
          <div className="h-4 w-16 bg-shade-30 rounded-full" />
          <div className="h-4 w-12 bg-shade-30 rounded-full" />
          <div className="h-6 w-28 bg-shade-30 rounded-full" />
          <div className="h-5 w-5 bg-shade-30 rounded-full" />
        </div>
        <div className="flex md:hidden items-center gap-3">
          <div className="h-5 w-5 bg-shade-30 rounded-full" />
          <div className="h-5 w-5 bg-shade-30 rounded-full" />
        </div>
      </div>
    </header>
  )
}

function FooterSkeleton() {
  return (
    <footer className="border-t border-hairline-light bg-canvas-light py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-3 text-center animate-pulse">
        <div className="h-4 w-64 bg-shade-30 rounded-full" />
        <div className="h-3 w-48 bg-shade-30 rounded-full" />
      </div>
    </footer>
  )
}

