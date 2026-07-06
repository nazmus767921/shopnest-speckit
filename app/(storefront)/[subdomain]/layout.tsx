import React from "react"
import { headers } from "next/headers"
import type { Metadata } from "next"
import "@/templates/general/styles.css"
import "@/templates/fashion/styles.css"
import { getMerchantById } from "@/db/queries/merchants"
import { StorefrontNavbar } from "@/components/storefront/StorefrontNavbar"
import { NewsletterSignup } from "@/components/storefront/shared/NewsletterSignup"
import { Archivo_Black } from "next/font/google"
import { Suspense } from "react"
import { connection } from "next/server"

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
  const headersList = await headers()
  const merchantId = headersList.get("x-merchant-id") || ""
  const merchant = merchantId ? await getMerchantById(merchantId) : null
  const template = merchant?.template || "general"
  const theme = template === "general" ? "default" : template

  return (
    <div className={`storefront-theme-${theme} ${archivoBlack.variable} min-h-screen flex flex-col font-sans`}>
      {/* Responsive Storefront Header */}
      <Suspense fallback={<NavbarSkeleton />}>
        <StorefrontNavbarWrapper params={params} />
      </Suspense>

      {/* Main Content Area */}
      <main className="grow py-8 md:py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">{children}</div>
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
    <footer className="w-full mt-12 bg-zinc-50 border-t border-hairline-light">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-10">
        
        {/* 1. Newsletter Block */}
        <NewsletterSignup />

        {/* 2. Link Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 border-b border-hairline-light pb-10 pt-4">
          {/* Brand Info Column */}
          <div className="flex flex-col gap-4 md:col-span-1">
            <span className="text-storefront-heading-lg font-bold text-ink uppercase tracking-tight">
              {merchantName}
            </span>
            <p className="text-storefront-body-md text-shade-40">
              {merchant?.storeDescription || "We have clothes that suit your style and which you're proud to wear. From women's to men's."}
            </p>
            {hasSocialLinks && (
              <div className="flex items-center gap-3">
                {parsedSocialLinks.facebook && (
                  <a href={parsedSocialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-shade-40 hover:text-ink transition-colors" aria-label="Facebook">
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                    </svg>
                  </a>
                )}
                {parsedSocialLinks.instagram && (
                  <a href={parsedSocialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-shade-40 hover:text-ink transition-colors" aria-label="Instagram">
                    <svg className="h-5 w-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                )}
                {parsedSocialLinks.whatsapp && (
                  <a href={`https://wa.me/${parsedSocialLinks.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-shade-40 hover:text-ink transition-colors" aria-label="WhatsApp">
                    <svg className="h-5 w-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  </a>
                )}
                {parsedSocialLinks.tiktok && (
                  <a href={parsedSocialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-shade-40 hover:text-ink transition-colors" aria-label="TikTok">
                    <svg className="h-5 w-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Utility Columns */}
          <div className="flex flex-col gap-4">
            <span className="text-storefront-body-strong font-bold uppercase tracking-wider text-ink">Company</span>
            <ul className="flex flex-col gap-2.5 text-storefront-body-md text-shade-40">
              <li><a href="#" className="hover:text-ink">About</a></li>
              <li><a href="#" className="hover:text-ink">Features</a></li>
              <li><a href="#" className="hover:text-ink">Works</a></li>
              <li><a href="#" className="hover:text-ink">Career</a></li>
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-storefront-body-strong font-bold uppercase tracking-wider text-ink">Help</span>
            <ul className="flex flex-col gap-2.5 text-storefront-body-md text-shade-40">
              <li><a href="#" className="hover:text-ink">Customer Support</a></li>
              <li><a href="#" className="hover:text-ink">Delivery Details</a></li>
              <li><a href="#" className="hover:text-ink">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-ink">Privacy Policy</a></li>
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-storefront-body-strong font-bold uppercase tracking-wider text-ink">FAQ</span>
            <ul className="flex flex-col gap-2.5 text-storefront-body-md text-shade-40">
              <li><a href="#" className="hover:text-ink">Account</a></li>
              <li><a href="#" className="hover:text-ink">Manage Deliveries</a></li>
              <li><a href="#" className="hover:text-ink">Orders</a></li>
              <li><a href="#" className="hover:text-ink">Payments</a></li>
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-storefront-body-strong font-bold uppercase tracking-wider text-ink">Resources</span>
            <ul className="flex flex-col gap-2.5 text-storefront-body-md text-shade-40">
              <li><a href="#" className="hover:text-ink">Free eBooks</a></li>
              <li><a href="#" className="hover:text-ink">Development Tutorial</a></li>
              <li><a href="#" className="hover:text-ink">How to - Blog</a></li>
              <li><a href="#" className="hover:text-ink">Youtube Playlist</a></li>
            </ul>
          </div>
        </div>

        {/* 3. Bottom copyright and payment badges */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-storefront-caption text-shade-40">
            © 2026 {merchantName}. Powered by ShopNest. {merchant?.storeAddress}
          </p>
          <div className="flex items-center gap-2 select-none grayscale opacity-80">
            {/* Simple representation of payment badges */}
            <span className="bg-white border border-hairline-light rounded px-2.5 py-1 text-[9px] font-bold text-ink tracking-widest">VISA</span>
            <span className="bg-white border border-hairline-light rounded px-2.5 py-1 text-[9px] font-bold text-ink tracking-widest">MC</span>
            <span className="bg-white border border-hairline-light rounded px-2.5 py-1 text-[9px] font-bold text-ink tracking-widest">PAYPAL</span>
            <span className="bg-white border border-hairline-light rounded px-2.5 py-1 text-[9px] font-bold text-ink tracking-widest">APPLEPAY</span>
            <span className="bg-white border border-hairline-light rounded px-2.5 py-1 text-[9px] font-bold text-ink tracking-widest">GPAY</span>
          </div>
        </div>

      </div>
    </footer>
  )
}

function NavbarSkeleton() {
  return (
    <header className="border-b border-hairline-light bg-canvas-light px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between animate-pulse">
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
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-3 text-center animate-pulse">
        <div className="h-4 w-64 bg-shade-30 rounded-full" />
        <div className="h-3 w-48 bg-shade-30 rounded-full" />
      </div>
    </footer>
  )
}

