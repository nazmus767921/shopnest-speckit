"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, ShoppingBag } from "lucide-react"
import { CartIconButton } from "./CartIconButton"

interface StorefrontNavbarProps {
  merchantId: string
  subdomain: string
  merchantName: string
}

export function StorefrontNavbar({ merchantId, subdomain, merchantName }: StorefrontNavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    { name: "Orders", href: "/orders" },
  ]

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="border-b border-hairline-light bg-canvas-light px-6 py-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo / Name */}
        <Link href="/" className="flex items-center gap-3 select-none">
          <ShoppingBag className="h-5 w-5 text-ink stroke-[1.8]" />
          <span className="text-storefront-heading-lg tracking-tight font-bold text-ink uppercase">
            {merchantName}
          </span>
        </Link>
 
        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-storefront-body-md transition-colors ${
                isActive(link.href)
                  ? "text-ink font-semibold"
                  : "text-shade-50 hover:text-ink"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <span className="tag-storefront-discount font-semibold">
            Active Storefront
          </span>
          <CartIconButton merchantId={merchantId} subdomain={subdomain} />
        </nav>
 
        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-3">
          <CartIconButton merchantId={merchantId} subdomain={subdomain} />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg text-ink hover:bg-canvas-cream transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
          </button>
        </div>
      </div>
 
      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden border-t border-hairline-light bg-canvas-light animate-fade-in absolute left-0 right-0 p-6 flex flex-col gap-5 shadow-sm">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`text-storefront-body-md py-1 transition-colors ${
                  isActive(link.href)
                    ? "text-ink font-semibold border-l-2 border-ink pl-3"
                    : "text-shade-50 hover:text-ink pl-3"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="border-t border-hairline-light pt-4 flex items-center justify-between">
            <span className="tag-storefront-discount font-semibold">
              Active Storefront
            </span>
          </div>
        </div>
      )}
    </header>
  )
}
