"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown } from "lucide-react"
import { CartIconButton } from "@/components/storefront/shared/CartIconButton"
import { type NavbarProps } from "../types"
import { Sheet } from "@/components/ui/layout/Sheet"

export function FashionNavbar({ store, subdomain, menu }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navLinks = [
    { name: "Shop", href: "/products" },
    { name: "Orders", href: "/orders" },
  ]

  const isActive = (href: string) => {
    if (href === "/" && pathname !== "/") return false
    return pathname.startsWith(href)
  }

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
  const visibleItems = topLevelItems.slice(0, 5)
  const overflowItems = topLevelItems.slice(5)

  return (
    <header className="border-b border-zinc-100 bg-white px-6 md:px-12 py-6 fixed top-0 left-0 right-0 w-full z-50 transition-colors duration-300">
      <div className="max-w-10xl mx-auto flex items-center justify-between">
        
        {/* Left: Brand name */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 select-none">
            <span className="font-serif text-2xl tracking-wide font-normal text-ink uppercase">
              {store.name}
            </span>
          </Link>
        </div>

        {/* Center: Nav links */}
        <nav className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
          {hasCustomMenu ? (
            <>
              {visibleItems.map((item: any) => {
                const children = getChildren(item.id)
                const hasChildren = children.length > 0

                if (hasChildren) {
                  return (
                    <div key={item.id} className="relative group py-2">
                      <button className="text-sm font-sans tracking-[0.2em] uppercase text-zinc-500 hover:text-ink font-light flex items-center gap-1 cursor-pointer bg-transparent border-none">
                        {item.label}
                        <ChevronDown className="h-3 w-3 stroke-[1.5]" />
                      </button>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-zinc-100 rounded-xl p-2 hidden group-hover:block hover:block transition-all shadow-lg z-50">
                        {children.map((child: any) => {
                          const href = resolveHref(child)
                          if (href === "#") {
                            return (
                              <span
                                key={child.id}
                                className="block px-4 py-2 text-xs font-sans tracking-wider uppercase text-zinc-400 font-light truncate select-none"
                              >
                                {child.label}
                              </span>
                            )
                          }
                          return (
                            <Link
                              key={child.id}
                              href={href}
                              className="block px-4 py-2 text-xs font-sans tracking-wider uppercase text-zinc-500 hover:text-ink hover:bg-zinc-50 rounded-lg transition-colors truncate"
                            >
                              {child.label}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                }

                const href = resolveHref(item)
                if (href === "#") {
                  return (
                    <span
                      key={item.id}
                      className="text-sm font-sans tracking-[0.2em] uppercase text-zinc-400 font-light select-none cursor-default"
                    >
                      {item.label}
                    </span>
                  )
                }

                return (
                  <Link
                    key={item.id}
                    href={href}
                    className={`text-sm font-sans tracking-[0.2em] uppercase transition-colors ${
                      isActive(href)
                        ? "text-ink font-medium"
                        : "text-zinc-500 hover:text-ink font-light"
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}

              {/* Overflow "More" menu */}
              {overflowItems.length > 0 && (
                <div className="relative group py-2">
                  <button className="text-sm font-sans tracking-[0.2em] uppercase text-zinc-500 hover:text-ink font-light flex items-center gap-1 cursor-pointer bg-transparent border-none">
                    More
                    <ChevronDown className="h-3 w-3 stroke-[1.5]" />
                  </button>
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-zinc-100 rounded-xl p-2 hidden group-hover:block hover:block transition-all shadow-lg z-50">
                    {overflowItems.map((item: any) => {
                      const href = resolveHref(item)
                      if (href === "#") {
                        return (
                          <span
                            key={item.id}
                            className="block px-4 py-2 text-xs font-sans tracking-wider uppercase text-zinc-400 font-light truncate select-none"
                          >
                            {item.label}
                          </span>
                        )
                      }
                      return (
                        <Link
                          key={item.id}
                          href={href}
                          className="block px-4 py-2 text-xs font-sans tracking-wider uppercase text-zinc-500 hover:text-ink hover:bg-zinc-50 rounded-lg transition-colors truncate"
                        >
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            navLinks.map((link) => (
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
            ))
          )}
        </nav>

        {/* Right: Cart, Menu */}
        <div className="flex items-center gap-6">
          <CartIconButton merchantId={store.id} subdomain={subdomain} />
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 -mr-2 rounded-full text-zinc-500 hover:text-ink hover:bg-zinc-50 transition-all cursor-pointer border-none bg-transparent md:hidden"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-6 w-6 stroke-[1.5]" /> : <Menu className="h-6 w-6 stroke-[1.5]" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer (Overlay backdrop) */}
      <Sheet isOpen={isOpen} onClose={() => setIsOpen(false)} side="right">
        <div className="flex flex-col gap-6 items-center text-center p-4">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="text-xs font-sans tracking-[0.2em] uppercase text-zinc-500 hover:text-primary font-light"
          >
            Home
          </Link>
          
          {hasCustomMenu ? (
            topLevelItems.map((item: any) => {
              const children = getChildren(item.id)
              return (
                <MobileMenuItem
                  key={item.id}
                  item={item}
                  childrenItems={children}
                  resolveHref={resolveHref}
                  setIsOpen={setIsOpen}
                />
              )
            })
          ) : (
            navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`text-xs font-sans tracking-[0.2em] uppercase py-2 transition-colors ${
                  isActive(link.href)
                    ? "text-primary font-medium"
                    : "text-zinc-500 hover:text-primary font-light"
                }`}
              >
                {link.name}
              </Link>
            ))
          )}
        </div>
      </Sheet>
    </header>
  )
}

function MobileMenuItem({ item, childrenItems, resolveHref, setIsOpen }: any) {
  const [isOpen, setIsOpenAccordion] = useState(false)
  const hasChildren = childrenItems.length > 0

  if (!hasChildren) {
    const href = resolveHref(item)
    if (href === "#") {
      return (
        <span
          className="text-xs font-sans tracking-[0.2em] uppercase text-zinc-400 font-light py-2 truncate max-w-full select-none cursor-default"
        >
          {item.label}
        </span>
      )
    }
    return (
      <Link
        href={href}
        onClick={() => setIsOpen(false)}
        className="text-xs font-sans tracking-[0.2em] uppercase text-zinc-500 hover:text-primary font-light py-2 truncate max-w-full"
      >
        {item.label}
      </Link>
    )
  }

  return (
    <div className="w-full flex flex-col items-center">
      <button
        onClick={() => setIsOpenAccordion(!isOpen)}
        className="w-full flex items-center justify-center gap-1 text-xs font-sans tracking-[0.2em] uppercase text-zinc-500 hover:text-primary font-light py-2 cursor-pointer bg-transparent border-none"
      >
        <span className="truncate max-w-[200px]">{item.label}</span>
        <ChevronDown className={`h-3 w-3 stroke-[1.5] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && (
        <div className="w-full flex flex-col gap-4 py-2 bg-zinc-50/50 rounded-xl my-1 items-center">
          {childrenItems.map((child: any) => {
            const href = resolveHref(child)
            if (href === "#") {
              return (
                <span
                  key={child.id}
                  className="text-[11px] font-sans tracking-wider uppercase text-zinc-400 font-light py-1 truncate max-w-[180px] select-none cursor-default"
                >
                  {child.label}
                </span>
              )
            }
            return (
              <Link
                key={child.id}
                href={href}
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-sans tracking-wider uppercase text-zinc-400 hover:text-primary font-light py-1 truncate max-w-[180px]"
              >
                {child.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
