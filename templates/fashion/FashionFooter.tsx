"use client"

import React from "react"
import Link from "next/link"
import { NewsletterSignup } from "@/components/storefront/shared/NewsletterSignup"
import { FacebookIcon, InstagramIcon, WhatsAppIcon, TikTokIcon } from "@/lib/icons"
import { type FooterProps } from "../types"
import { parseWhatsAppUrl } from "@/lib/utils"

export function FashionFooter({ store, menu, footerSection }: FooterProps) {
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
    <footer className="w-full mt-24 bg-[var(--color-primary)] text-[var(--color-on-primary)] border-t border-[var(--color-primary)]">
      <div className="max-w-10xl mx-auto px-8 py-16 flex flex-col gap-14">
        
        {/* 2. Brand Identity & Grid Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 border-b border-[var(--color-on-primary)]/10 pb-12 pt-4">
          <div className="flex flex-col gap-5 md:col-span-1">
            <span className="font-display text-3xl font-normal tracking-wide uppercase">
              {store.name}
            </span>
            <p className="text-base text-zinc-400 font-sans font-light leading-relaxed">
            {content.storeDescription || "Curated seasonal selections. Elevating everyday boutique wear with high-quality, timeless fashion garments."}
          </p>
            {hasSocialLinks && (
              <div className="flex items-center gap-3">
                {parsedSocialLinks.facebook && (
                  <a href={parsedSocialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-primary)]/75 hover:text-[var(--color-on-primary)] transition-colors" aria-label="Facebook">
                    <FacebookIcon className="h-4.5 w-4.5 fill-current" />
                  </a>
                )}
                {parsedSocialLinks.instagram && (
                  <a href={parsedSocialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-primary)]/75 hover:text-[var(--color-on-primary)] transition-colors" aria-label="Instagram">
                    <InstagramIcon className="h-4.5 w-4.5 fill-none stroke-current" strokeWidth={1.8} />
                  </a>
                )}
                {parsedSocialLinks.whatsapp && (
                  <a href={parseWhatsAppUrl(parsedSocialLinks.whatsapp)} target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-primary)]/75 hover:text-[var(--color-on-primary)] transition-colors" aria-label="WhatsApp">
                    <WhatsAppIcon className="h-4.5 w-4.5 fill-none stroke-current" strokeWidth={1.8} />
                  </a>
                )}
                {parsedSocialLinks.tiktok && (
                  <a href={parsedSocialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-primary)]/75 hover:text-[var(--color-on-primary)] transition-colors" aria-label="TikTok">
                    <TikTokIcon className="h-4.5 w-4.5 fill-none stroke-current" strokeWidth={1.8} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Links columns */}
          {hasCustomMenu ? (
            topLevelItems.map((col: any) => {
              const children = getChildren(col.id)
              return (
                <div key={col.id} className="flex flex-col gap-4">
                  <span className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[var(--color-on-primary)] font-sans">
                    {col.label}
                  </span>
                  <ul className="flex flex-col gap-3 text-xs text-[var(--color-on-primary)]/75 font-sans font-light">
                    {children.map((child: any) => {
                      const href = resolveHref(child)
                      return (
                        <li key={child.id}>
                          {href === "#" ? (
                            <span className="text-[var(--color-on-primary)]/50 select-none cursor-default font-light">
                              {child.label}
                            </span>
                          ) : (
                            <Link href={href} className="hover:text-[var(--color-on-primary)] transition-colors">
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
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[var(--color-on-primary)] font-sans">Shop</span>
                <ul className="flex flex-col gap-3 text-xs text-[var(--color-on-primary)]/75 font-sans font-light">
                  <li><Link href="/products" className="hover:text-[var(--color-on-primary)]">New Arrivals</Link></li>
                  <li><Link href="/products" className="hover:text-[var(--color-on-primary)]">Best Sellers</Link></li>
                  <li><Link href="/products" className="hover:text-[var(--color-on-primary)]">Boutique Edits</Link></li>
                  <li><Link href="/products" className="hover:text-[var(--color-on-primary)]">Sale Collection</Link></li>
                </ul>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[var(--color-on-primary)] font-sans">Company</span>
                <ul className="flex flex-col gap-3 text-xs text-[var(--color-on-primary)]/75 font-sans font-light">
                  <li><a href="#" className="hover:text-[var(--color-on-primary)]">Our Story</a></li>
                  <li><a href="#" className="hover:text-[var(--color-on-primary)]">Careers</a></li>
                  <li><a href="#" className="hover:text-[var(--color-on-primary)]">Sustainability</a></li>
                  <li><a href="#" className="hover:text-[var(--color-on-primary)]">Press</a></li>
                </ul>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[var(--color-on-primary)] font-sans">Support</span>
                <ul className="flex flex-col gap-3 text-xs text-[var(--color-on-primary)]/75 font-sans font-light">
                  <li><a href="#" className="hover:text-[var(--color-on-primary)]">Help Center</a></li>
                  <li><a href="#" className="hover:text-[var(--color-on-primary)]">Shipping & Returns</a></li>
                  <li><Link href="/orders" className="hover:text-[var(--color-on-primary)]">Contact Us</Link></li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* 3. Bottom Credits */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-12 border-t border-zinc-800 text-sm font-sans font-light text-zinc-500">
          <p>{content.copyrightText || `© 2026 ${store.name}. Powered by ShopNest.`} {content.storeAddress || ""}</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[var(--color-on-primary)] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--color-on-primary)] transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  )
}
