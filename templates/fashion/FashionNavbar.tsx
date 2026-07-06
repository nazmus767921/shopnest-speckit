"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Search, ShoppingBag } from "lucide-react"
import { CartIconButton } from "@/components/storefront/shared/CartIconButton"
import { type NavbarProps } from "../types"

export function FashionNavbar({ store, subdomain }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navLinks = [
    { name: "Shop", href: "/products" },
    { name: "Orders", href: "/orders" },
  ]

  const isActive = (href: string) => {
    return pathname.startsWith(href)
  }

  return (
    <header className="border-b border-[var(--color-hairline-warm)] bg-[var(--color-canvas-warm)] px-8 py-5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-sans tracking-wide uppercase transition-colors ${
                isActive(link.href)
                  ? "text-[var(--color-ink)] font-semibold"
                  : "text-[var(--color-shade-50)] hover:text-[var(--color-ink)]"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Center: Brand name in serif display font */}
        <div className="flex justify-center md:absolute md:left-1/2 md:-translate-x-1/2">
          <Link href="/" className="flex items-center gap-2 select-none">
            <span className="font-display text-2xl tracking-wide font-normal text-[var(--color-ink)] uppercase">
              {store.name}
            </span>
          </Link>
        </div>

        {/* Right: Cart, Search, Menu */}
        <div className="flex items-center gap-4">
          <CartIconButton merchantId={store.id} subdomain={subdomain} />
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)] transition-colors border-none bg-transparent cursor-pointer"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="border-t border-[var(--color-hairline-warm)] bg-[var(--color-canvas-warm)] animate-fade-in absolute left-0 right-0 p-8 flex flex-col gap-6 shadow-sm border-b">
          <div className="flex flex-col gap-5">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="text-sm font-sans tracking-wide uppercase text-[var(--color-shade-50)] hover:text-[var(--color-ink)]"
            >
              Home
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`text-sm font-sans tracking-wide uppercase py-1 transition-colors ${
                  isActive(link.href)
                    ? "text-[var(--color-ink)] font-semibold border-l-2 border-[var(--color-ink)] pl-3"
                    : "text-[var(--color-shade-50)] hover:text-[var(--color-ink)] pl-3"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
