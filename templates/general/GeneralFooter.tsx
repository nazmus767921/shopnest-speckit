"use client"

import React from "react"
import Link from "next/link"
import { NewsletterSignup } from "@/components/storefront/shared/NewsletterSignup"
import { FacebookIcon, InstagramIcon, WhatsAppIcon, TikTokIcon } from "@/lib/icons"
import { type FooterProps } from "../types"
import { parseWhatsAppUrl } from "@/lib/utils"

export function GeneralFooter({ store, menu, footerSection }: FooterProps) {
  const content = footerSection?.content || {}
  const parsedSocialLinks: Record<string, string> = content.socialLinks || {}
  const hasSocialLinks = Object.values(parsedSocialLinks).some((url) => !!url)

  const menuItems = menu?.items || []

  // Resolve link hrefs
  const resolveHref = (item: any) => {
    if (item.type === "url") return item.url || "#"
    if (item.type === "page") return `/pages/${item.page?.slug || ""}`
    if (item.type === "category") return `/products?category=${item.category?.slug || ""}`
    if (item.type === "product") return `/products/${item.product?.slug || ""}`
    return "#"
  }

  // Build menu tree (1-level nesting)
  const topLevelItems = menuItems.filter((item: any) => !item.parentId)
  const getChildren = (parentId: string) => menuItems.filter((item: any) => item.parentId === parentId)

  const hasCustomMenu = topLevelItems.length > 0

  return (
    <footer className="w-full mt-12 bg-zinc-50 border-t border-[var(--color-hairline-light)]">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-10">
        
        {/* 1. Newsletter Block */}
        <NewsletterSignup />

        {/* 2. Link Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 border-b border-[var(--color-hairline-light)] pb-10 pt-4">
          {/* Brand Info Column */}
          <div className="flex flex-col gap-4 md:col-span-1">
            <span className="text-storefront-heading-lg font-bold text-[var(--color-ink)] uppercase tracking-tight">
              {store.name}
            </span>
            <p className="text-storefront-body-md text-[var(--color-shade-40)]">
              {content.storeDescription || "We have clothes that suit your style and which you're proud to wear. From women's to men's."}
            </p>
            {hasSocialLinks && (
              <div className="flex items-center gap-3">
                {parsedSocialLinks.facebook && (
                  <a href={parsedSocialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-[var(--color-shade-40)] hover:text-[var(--color-ink)] transition-colors" aria-label="Facebook">
                    <FacebookIcon className="h-5 w-5 fill-current" />
                  </a>
                )}
                {parsedSocialLinks.instagram && (
                  <a href={parsedSocialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-[var(--color-shade-40)] hover:text-[var(--color-ink)] transition-colors" aria-label="Instagram">
                    <InstagramIcon className="h-5 w-5 fill-none stroke-current" strokeWidth={2} />
                  </a>
                )}
                {parsedSocialLinks.whatsapp && (
                  <a href={parseWhatsAppUrl(parsedSocialLinks.whatsapp)} target="_blank" rel="noopener noreferrer" className="text-[var(--color-shade-40)] hover:text-[var(--color-ink)] transition-colors" aria-label="WhatsApp">
                    <WhatsAppIcon className="h-5 w-5 fill-none stroke-current" strokeWidth={2} />
                  </a>
                )}
                {parsedSocialLinks.tiktok && (
                  <a href={parsedSocialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-[var(--color-shade-40)] hover:text-[var(--color-ink)] transition-colors" aria-label="TikTok">
                    <TikTokIcon className="h-5 w-5 fill-none stroke-current" strokeWidth={2} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Columns */}
          {hasCustomMenu ? (
            topLevelItems.map((col: any) => {
              const children = getChildren(col.id)
              return (
                <div key={col.id} className="flex flex-col gap-4">
                  <span className="text-storefront-body-strong font-bold uppercase tracking-wider text-[var(--color-ink)]">
                    {col.label}
                  </span>
                  <ul className="flex flex-col gap-2.5 text-storefront-body-md text-[var(--color-shade-40)]">
                    {children.map((child: any) => {
                      const href = resolveHref(child)
                      return (
                        <li key={child.id}>
                          {href === "#" ? (
                            <span className="text-[var(--color-shade-30)] select-none cursor-default font-light">
                              {child.label}
                            </span>
                          ) : (
                            <Link href={href} className="hover:text-[var(--color-ink)] transition-colors">
                              {child.label}
                            </Link>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })
          ) : (
            <>
              {/* Utility Columns */}
              <div className="flex flex-col gap-4">
                <span className="text-storefront-body-strong font-bold uppercase tracking-wider text-[var(--color-ink)]">Company</span>
                <ul className="flex flex-col gap-2.5 text-storefront-body-md text-[var(--color-shade-40)]">
                  <li><Link href="/products" className="hover:text-[var(--color-ink)]">About</Link></li>
                  <li><Link href="/products" className="hover:text-[var(--color-ink)]">Features</Link></li>
                  <li><a href="#" className="hover:text-[var(--color-ink)]">Works</a></li>
                  <li><a href="#" className="hover:text-[var(--color-ink)]">Career</a></li>
                </ul>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-storefront-body-strong font-bold uppercase tracking-wider text-[var(--color-ink)]">Help</span>
                <ul className="flex flex-col gap-2.5 text-storefront-body-md text-[var(--color-shade-40)]">
                  <li><a href="#" className="hover:text-[var(--color-ink)]">Customer Support</a></li>
                  <li><a href="#" className="hover:text-[var(--color-ink)]">Delivery Details</a></li>
                  <li><a href="#" className="hover:text-[var(--color-ink)]">Terms & Conditions</a></li>
                  <li><a href="#" className="hover:text-[var(--color-ink)]">Privacy Policy</a></li>
                </ul>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-storefront-body-strong font-bold uppercase tracking-wider text-[var(--color-ink)]">FAQ</span>
                <ul className="flex flex-col gap-2.5 text-storefront-body-md text-[var(--color-shade-40)]">
                  <li><a href="#" className="hover:text-[var(--color-ink)]">Account</a></li>
                  <li><a href="#" className="hover:text-[var(--color-ink)]">Manage Deliveries</a></li>
                  <li><Link href="/orders" className="hover:text-[var(--color-ink)]">Orders</Link></li>
                  <li><a href="#" className="hover:text-[var(--color-ink)]">Payments</a></li>
                </ul>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-storefront-body-strong font-bold uppercase tracking-wider text-[var(--color-ink)]">Resources</span>
                <ul className="flex flex-col gap-2.5 text-storefront-body-md text-[var(--color-shade-40)]">
                  <li><a href="#" className="hover:text-[var(--color-ink)]">Free eBooks</a></li>
                  <li><a href="#" className="hover:text-[var(--color-ink)]">Development Tutorial</a></li>
                  <li><a href="#" className="hover:text-[var(--color-ink)]">How to - Blog</a></li>
                  <li><a href="#" className="hover:text-[var(--color-ink)]">Youtube Playlist</a></li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* 3. Bottom copyright and payment badges */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-storefront-caption text-[var(--color-shade-40)]">
            {content.copyrightText || `© 2026 ${store.name}. Powered by ShopNest.`} {content.storeAddress || ""}
          </p>
          <div className="flex items-center gap-2 select-none grayscale opacity-80">
            <span className="bg-white border border-[var(--color-hairline-light)] rounded px-2.5 py-1 text-[9px] font-bold text-[var(--color-ink)] tracking-widest">VISA</span>
            <span className="bg-white border border-[var(--color-hairline-light)] rounded px-2.5 py-1 text-[9px] font-bold text-[var(--color-ink)] tracking-widest">MC</span>
            <span className="bg-white border border-[var(--color-hairline-light)] rounded px-2.5 py-1 text-[9px] font-bold text-[var(--color-ink)] tracking-widest">PAYPAL</span>
            <span className="bg-white border border-[var(--color-hairline-light)] rounded px-2.5 py-1 text-[9px] font-bold text-[var(--color-ink)] tracking-widest">APPLEPAY</span>
            <span className="bg-white border border-[var(--color-hairline-light)] rounded px-2.5 py-1 text-[9px] font-bold text-[var(--color-ink)] tracking-widest">GPAY</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
