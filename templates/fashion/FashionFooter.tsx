"use client"

import React from "react"
import { NewsletterSignup } from "@/components/storefront/shared/NewsletterSignup"
import { type FooterProps } from "../types"

export function FashionFooter({ store }: FooterProps) {
  const parsedSocialLinks: Record<string, string> = store.socialLinks || {}
  const hasSocialLinks = Object.values(parsedSocialLinks).some((url) => !!url)

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
                  <a href={parsedSocialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-primary)]/70 hover:text-[var(--color-on-primary)] transition-colors" aria-label="Facebook">
                    <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                    </svg>
                  </a>
                )}
                {parsedSocialLinks.instagram && (
                  <a href={parsedSocialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-[var(--color-on-primary)]/70 hover:text-[var(--color-on-primary)] transition-colors" aria-label="Instagram">
                    <svg className="h-4.5 w-4.5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
          <div className="flex flex-col gap-4">
            <span className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[var(--color-on-primary)] font-sans">Shop</span>
            <ul className="flex flex-col gap-3 text-xs text-[var(--color-on-primary)]/75 font-sans font-light">
              <li><a href="#" className="hover:text-[var(--color-on-primary)]">New Arrivals</a></li>
              <li><a href="#" className="hover:text-[var(--color-on-primary)]">Best Sellers</a></li>
              <li><a href="#" className="hover:text-[var(--color-on-primary)]">Boutique Edits</a></li>
              <li><a href="#" className="hover:text-[var(--color-on-primary)]">Sale Collection</a></li>
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
              <li><a href="#" className="hover:text-[var(--color-on-primary)]">Contact Us</a></li>
              <li><a href="#" className="hover:text-[var(--color-on-primary)]">FAQ</a></li>
            </ul>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[var(--color-on-primary)] font-sans">Legal</span>
            <ul className="flex flex-col gap-3 text-xs text-[var(--color-on-primary)]/75 font-sans font-light">
              <li><a href="#" className="hover:text-[var(--color-on-primary)]">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-[var(--color-on-primary)]">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[var(--color-on-primary)]">Cookie Settings</a></li>
            </ul>
          </div>
        </div>

        {/* 3. Footer bottom details */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs text-[var(--color-on-primary)]/65 font-light">
          <p>
            © 2026 {store.name}. Powered by ShopNest. {store.address}
          </p>
          <div className="flex items-center gap-2 select-none opacity-50 grayscale hover:opacity-70 transition-opacity">
            <span className="border border-[var(--color-on-primary)]/30 rounded px-2.5 py-1 text-[9px] font-bold tracking-widest text-white">VISA</span>
            <span className="border border-[var(--color-on-primary)]/30 rounded px-2.5 py-1 text-[9px] font-bold tracking-widest text-white">MC</span>
            <span className="border border-[var(--color-on-primary)]/30 rounded px-2.5 py-1 text-[9px] font-bold tracking-widest text-white">AMEX</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
