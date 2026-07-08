"use client"

import React from "react"
import Link from "next/link"
import { NewsletterSignup } from "@/components/storefront/shared/NewsletterSignup"
import { type FooterProps } from "../types"

export function FashionFooter({ store, menu }: FooterProps) {
  const parsedSocialLinks: Record<string, string> = store.socialLinks || {}
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
            <p className="text-xs text-[var(--color-on-primary)]/75 leading-relaxed font-sans font-light">
              {store.description || "Curated seasonal selections. Elevating everyday boutique wear with high-quality, timeless fashion garments."}
            </p>
            {hasSocialLinks && (
              <div className="flex items-center gap-3">
                {parsedSocialLinks.facebook && (
                  <a href={parsedSocialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-primary)]/75 hover:text-[var(--color-on-primary)] transition-colors" aria-label="Facebook">
                    <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                    </svg>
                  </a>
                )}
                {parsedSocialLinks.instagram && (
                  <a href={parsedSocialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-primary)]/75 hover:text-[var(--color-on-primary)] transition-colors" aria-label="Instagram">
                    <svg className="h-4.5 w-4.5 fill-none stroke-current" strokeWidth="1.8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 font-sans text-[11px] tracking-wider text-[var(--color-on-primary)]/60">
          <p>© 2026 {store.name}. Powered by ShopNest. {store.address}</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[var(--color-on-primary)] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--color-on-primary)] transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  )
}
