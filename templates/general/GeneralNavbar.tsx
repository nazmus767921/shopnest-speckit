"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MenuIcon, XIcon, ShoppingBagIcon, ChevronDownIcon, UserIcon } from "@/lib/icons";
import { authClient } from "@/lib/auth/auth-client"

import { CartIconButton } from "@/components/storefront/shared/CartIconButton"
import { type NavbarProps } from "../types"
import { Sheet, SheetContent } from "@/components/ui/sheet"

export function GeneralNavbar({ store, subdomain, menu, categories }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = authClient.useSession()
  
  const isLoggedInCustomer = session?.user && session.user.role === "customer" && !session.user.isAnonymous

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
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
  const getChildren = (parentId: string) => {
    const manualChildren = menuItems.filter((item: any) => item.parentId === parentId)
    const parentItem = menuItems.find((item: any) => item.id === parentId)
    
    let autoChildren: any[] = []
    if (parentItem?.type === "category" && parentItem.category && categories) {
      const subcats = categories.filter((c: any) => c.parentId === parentItem.category.id)
      autoChildren = subcats.map((c: any) => ({
        id: `auto-subcat-${c.id}`,
        label: c.name,
        type: "category",
        category: c,
      }))
    }
    
    return [...manualChildren, ...autoChildren]
  }

  const hasCustomMenu = topLevelItems.length > 0
  const visibleItems = topLevelItems.slice(0, 5)
  const overflowItems = topLevelItems.slice(5)

  return (
    <header className="border-b border-[var(--color-hairline-light)] bg-[var(--color-canvas-light)] px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo / Name */}
        <Link href="/" className="flex items-center gap-3 select-none">
          <ShoppingBagIcon className="h-5 w-5 text-[var(--color-ink)] stroke-[1.8]" />
          <span className="text-storefront-heading-lg tracking-tight font-bold text-[var(--color-ink)] uppercase">
            {store.name}
          </span>
        </Link>
 
        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {hasCustomMenu ? (
            <>
              {visibleItems.map((item: any) => {
                const children = getChildren(item.id)
                const hasChildren = children.length > 0

                if (hasChildren) {
                  return (
                    <div key={item.id} className="relative group py-2">
                      <button className="text-storefront-body-md text-[var(--color-shade-50)] hover:text-[var(--color-ink)] flex items-center gap-1 cursor-pointer bg-transparent border-none">
                        {item.label}
                        <ChevronDownIcon className="h-3.5 w-3.5 stroke-[1.5]" />
                      </button>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-[var(--color-canvas-light)] border border-[var(--color-hairline-light)] rounded-xl p-2 hidden group-hover:block hover:block transition-all shadow-lg z-50">
                        {children.map((child: any) => {
                          const href = resolveHref(child)
                          if (href === "#") {
                            return (
                              <span
                                key={child.id}
                                className="block px-4 py-2 text-xs uppercase text-[var(--color-shade-40)] font-light truncate select-none"
                              >
                                {child.label}
                              </span>
                            )
                          }
                          return (
                            <Link
                              key={child.id}
                              href={href}
                              className="block px-4 py-2 text-xs uppercase text-[var(--color-shade-50)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-secondary)] rounded-lg transition-colors truncate"
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
                      className="text-storefront-body-md text-[var(--color-shade-30)] cursor-default select-none"
                    >
                      {item.label}
                    </span>
                  )
                }

                return (
                  <Link
                    key={item.id}
                    href={href}
                    className={`text-storefront-body-md transition-colors ${
                      isActive(href)
                        ? "text-[var(--color-ink)] font-semibold"
                        : "text-[var(--color-shade-50)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}

              {/* Overflow "More" menu */}
              {overflowItems.length > 0 && (
                <div className="relative group py-2">
                  <button className="text-storefront-body-md text-[var(--color-shade-50)] hover:text-[var(--color-ink)] flex items-center gap-1 cursor-pointer bg-transparent border-none">
                    More
                    <ChevronDownIcon className="h-3.5 w-3.5 stroke-[1.5]" />
                  </button>
                  <div className="absolute top-full right-0 mt-2 w-48 bg-[var(--color-canvas-light)] border border-[var(--color-hairline-light)] rounded-xl p-2 hidden group-hover:block hover:block transition-all shadow-lg z-50">
                    {overflowItems.map((item: any) => {
                      const href = resolveHref(item)
                      if (href === "#") {
                        return (
                          <span
                            key={item.id}
                            className="block px-4 py-2 text-xs uppercase text-[var(--color-shade-40)] font-light truncate select-none"
                          >
                            {item.label}
                          </span>
                        )
                      }
                      return (
                        <Link
                          key={item.id}
                          href={href}
                          className="block px-4 py-2 text-xs uppercase text-[var(--color-shade-50)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-secondary)] rounded-lg transition-colors truncate"
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
                className={`text-storefront-body-md transition-colors ${
                  isActive(link.href)
                    ? "text-[var(--color-ink)] font-semibold"
                    : "text-[var(--color-shade-50)] hover:text-[var(--color-ink)]"
                }`}
              >
                {link.name}
              </Link>
            ))
          )}
          <span className="tag-storefront-discount font-semibold">
            Active Storefront
          </span>
          <Link href={isLoggedInCustomer ? "/profile" : "/login"} className="text-[var(--color-ink)] hover:opacity-70 transition-opacity">
            <UserIcon className="h-5 w-5 stroke-[1.8]" />
          </Link>
          <CartIconButton merchantId={store.id} subdomain={subdomain} />
        </nav>
 
        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-3">
          <Link href={isLoggedInCustomer ? "/profile" : "/login"} className="text-[var(--color-ink)] hover:opacity-70 transition-opacity">
            <UserIcon className="h-5 w-5 stroke-[1.8]" />
          </Link>
          <CartIconButton merchantId={store.id} subdomain={subdomain} />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-ink)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer border-none bg-transparent"
            aria-label="Toggle Menu"
          >
            {isOpen ? <XIcon className="h-5.5 w-5.5" /> : <MenuIcon className="h-5.5 w-5.5" />}
          </button>
        </div>
      </div>
 
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right">
          <div className="flex flex-col gap-5 w-full p-2 mt-8">
            <div className="flex flex-col gap-4">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="text-storefront-body-md py-1 text-[var(--color-shade-50)] hover:text-[var(--color-ink)] pl-3"
              >
                Home
              </Link>

              {hasCustomMenu ? (
                topLevelItems.map((item: any) => {
                  const children = getChildren(item.id)
                  return (
                    <GeneralMobileMenuItem
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
                    className={`text-storefront-body-md py-1 transition-colors ${
                      isActive(link.href)
                        ? "text-[var(--color-ink)] font-semibold border-l-2 border-[var(--color-ink)] pl-3"
                        : "text-[var(--color-shade-50)] hover:text-[var(--color-ink)] pl-3"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))
              )}
            </div>
            <div className="border-t border-[var(--color-hairline-light)] pt-4 flex flex-col gap-4 pl-3">
              <Link
                href={isLoggedInCustomer ? "/profile" : "/login"}
                onClick={() => setIsOpen(false)}
                className="text-storefront-body-md text-[var(--color-shade-50)] hover:text-[var(--color-ink)] flex items-center gap-2"
              >
                <UserIcon className="h-5 w-5 stroke-[1.8]" />
                {isLoggedInCustomer ? "My Account" : "Sign In"}
              </Link>
              <span className="tag-storefront-discount font-semibold w-fit">
                Active Storefront
              </span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}

function GeneralMobileMenuItem({ item, childrenItems, resolveHref, setIsOpen }: any) {
  const [isOpen, setIsOpenAccordion] = useState(false)
  const hasChildren = childrenItems.length > 0

  if (!hasChildren) {
    const href = resolveHref(item)
    if (href === "#") {
      return (
        <span
          className="text-storefront-body-md py-1 text-[var(--color-shade-30)] pl-3 truncate max-w-full select-none cursor-default"
        >
          {item.label}
        </span>
      )
    }
    return (
      <Link
        href={href}
        onClick={() => setIsOpen(false)}
        className="text-storefront-body-md py-1 text-[var(--color-shade-50)] hover:text-[var(--color-ink)] pl-3 truncate max-w-full"
      >
        {item.label}
      </Link>
    )
  }

  return (
    <div className="w-full flex flex-col items-start pl-3">
      <button
        onClick={() => setIsOpenAccordion(!isOpen)}
        className="w-full flex items-center justify-between gap-1 text-storefront-body-md text-[var(--color-shade-50)] hover:text-[var(--color-ink)] py-1 cursor-pointer bg-transparent border-none text-left"
      >
        <span className="truncate">{item.label}</span>
        <ChevronDownIcon className={`h-4 w-4 stroke-[1.5] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && (
        <div className="w-full flex flex-col gap-3 py-2 bg-[var(--color-surface-secondary)]/30 rounded-xl my-1 items-start pl-4 border-l border-[var(--color-hairline-light)]">
          {childrenItems.map((child: any) => {
            const href = resolveHref(child)
            if (href === "#") {
              return (
                <span
                  key={child.id}
                  className="text-xs text-[var(--color-shade-30)] py-1 truncate max-w-full select-none cursor-default"
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
                className="text-xs text-[var(--color-shade-40)] hover:text-[var(--color-ink)] py-1 truncate max-w-full"
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
