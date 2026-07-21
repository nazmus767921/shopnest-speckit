"use client"

import React from "react"
import Link from "next/link"
import type { FooterContent } from "@/lib/storefront/schema/sections"

export function FooterSection({ content, merchantId, subdomain }: { content: FooterContent, merchantId: string, subdomain: string }) {
  const { description, showSocials, copyrightText } = content || {}

  return (
    <footer className="bg-[var(--color-surface)] border-t border-[var(--color-hairline-warm)] py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
        <div className="text-center md:text-left max-w-sm">
          <p className="font-sans text-sm text-[var(--color-shade-50)]">
            {description || "Your store description goes here."}
          </p>
        </div>
        
        {showSocials && (
          <div className="flex gap-4">
            {/* Social Icons Stub */}
            <span className="text-[var(--color-ink)]">Instagram</span>
            <span className="text-[var(--color-ink)]">Twitter</span>
          </div>
        )}
      </div>
      
      <div className="mt-12 pt-8 border-t border-[var(--color-hairline-warm)] text-center text-xs text-[var(--color-shade-50)]">
        <p>{copyrightText || `© ${new Date().getFullYear()} ${subdomain}. All rights reserved.`}</p>
      </div>
    </footer>
  )
}
