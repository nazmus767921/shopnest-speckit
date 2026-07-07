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
    <header className="border-b border-zinc-100 bg-white px-6 md:px-12 py-6 fixed top-0 left-0 right-0 w-full z-50 transition-colors duration-300">
      <div className="max-w-10xl mx-auto flex items-center justify-between">
        
        {/* Left: Brand name in serif display font */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 select-none">
            <span className="font-serif text-2xl tracking-wide font-normal text-ink uppercase">
              {store.name}
            </span>
          </Link>
        </div>

        {/* Center: Nav links */}
        <nav className="hidden md:flex items-center gap-12 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-sans tracking-[0.2em] uppercase transition-colors ${
                isActive(link.href)
                  ? "text-ink font-medium"
                  : "text-zinc-500 hover:text-ink font-light"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right: Cart, Menu */}
        <div className="flex items-center gap-6">
          <CartIconButton merchantId={store.id} subdomain={subdomain} />
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded text-ink hover:text-zinc-500 transition-colors border-none bg-transparent cursor-pointer md:hidden"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-5 w-5 stroke-[1]" /> : <Menu className="h-5 w-5 stroke-[1]" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="border-t border-zinc-100 bg-white animate-fade-in absolute left-0 right-0 p-8 flex flex-col gap-6 shadow-xl border-b z-40">
          <div className="flex flex-col gap-6 items-center text-center">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="text-xs font-sans tracking-[0.2em] uppercase text-zinc-500 hover:text-ink font-light"
            >
              Home
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`text-xs font-sans tracking-[0.2em] uppercase py-2 transition-colors ${
                  isActive(link.href)
                    ? "text-ink font-medium"
                    : "text-zinc-500 hover:text-ink font-light"
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
