"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  Percent,
  Settings,
  CreditCard,
  MoreHorizontal,
  FolderTree,
  X
} from "lucide-react"
import { LogoutButton } from "./LogoutButton"

interface MobileBottomNavProps {
  storeName: string
  isTrial: boolean
  trialDaysLeft: number
  trialProgress: number
  trialStyles: {
    cardBg: string
    borderClass: string
    textClass: string
    barBg: string
    dotBg: string
    textBadge: string
  }
}

export function MobileBottomNav({
  storeName,
  isTrial,
  trialDaysLeft,
  trialProgress,
  trialStyles,
}: MobileBottomNavProps) {
  const pathname = usePathname()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Primary tabs shown on the bottom bar
  const primaryTabs = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Orders",
      href: "/dashboard/orders",
      icon: Tag,
    },
    {
      label: "Products",
      href: "/dashboard/products",
      icon: ShoppingBag,
    },
  ]

  // Check if a primary path is active
  const isTabActive = (href: string, exact?: boolean) => {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-canvas-light border-t border-hairline-light flex items-center justify-around px-2 z-40 select-none"
        aria-label="Mobile Navigation"
      >
        {primaryTabs.map((tab) => {
          const active = isTabActive(tab.href, tab.exact)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 w-20 h-full text-caption transition-colors ${
                active ? "text-primary font-semibold" : "text-shade-60 hover:text-shade-70"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-shade-40"}`} />
              <span className="text-[11px] tracking-tight">{tab.label}</span>
            </Link>
          )
        })}

        {/* More Tab */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className={`flex flex-col items-center justify-center gap-1 w-20 h-full text-caption transition-colors focus:outline-none cursor-pointer ${
            isDrawerOpen ? "text-primary font-semibold" : "text-shade-60 hover:text-shade-70"
          }`}
          aria-expanded={isDrawerOpen}
          aria-haspopup="true"
        >
          <MoreHorizontal className={`h-5 w-5 ${isDrawerOpen ? "text-primary" : "text-shade-40"}`} />
          <span className="text-[11px] tracking-tight">More</span>
        </button>
      </nav>

      {/* Slide-Up Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop with fade-in */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in cursor-pointer"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel with slide-up */}
          <div className="relative bg-canvas-light border-t border-hairline-light rounded-t-xl py-6 px-5 flex flex-col gap-6 animate-slide-up max-h-[85vh] overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-hairline-light">
              <div className="flex flex-col gap-0.5">
                <span className="text-eyebrow-cap font-bold text-shade-45 tracking-wider">
                  {storeName}
                </span>
                <span className="text-caption text-shade-50 font-light">
                  Store Administration
                </span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 hover:bg-canvas-cream rounded-full text-shade-50 hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Options inside Drawer */}
            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard/categories"
                onClick={() => setIsDrawerOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-full text-body-md transition-colors ${
                  pathname.startsWith("/dashboard/categories")
                    ? "bg-primary text-on-primary font-semibold"
                    : "text-shade-70 hover:bg-canvas-cream font-medium"
                }`}
              >
                <FolderTree className="h-5 w-5" />
                <span>Categories</span>
              </Link>

              <Link
                href="/dashboard/discounts"
                onClick={() => setIsDrawerOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-full text-body-md transition-colors ${
                  pathname.startsWith("/dashboard/discounts")
                    ? "bg-primary text-on-primary font-semibold"
                    : "text-shade-70 hover:bg-canvas-cream font-medium"
                }`}
              >
                <Percent className="h-5 w-5" />
                <span>Discounts</span>
              </Link>

              <Link
                href="/dashboard/settings"
                onClick={() => setIsDrawerOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-full text-body-md transition-colors ${
                  pathname.startsWith("/dashboard/settings")
                    ? "bg-primary text-on-primary font-semibold"
                    : "text-shade-70 hover:bg-canvas-cream font-medium"
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>Store Settings</span>
              </Link>

              <Link
                href="/dashboard/billing"
                onClick={() => setIsDrawerOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-full text-body-md transition-colors ${
                  pathname.startsWith("/dashboard/billing")
                    ? "bg-primary text-on-primary font-semibold"
                    : "text-shade-70 hover:bg-canvas-cream font-medium"
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span>Billing & Plan</span>
              </Link>
            </div>

            {/* Trial & Footer Panel inside Drawer */}
            <div className="border-t border-hairline-light pt-4 flex flex-col gap-4">
              {isTrial && (
                <div className={`${trialStyles.cardBg} p-4 border ${trialStyles.borderClass} rounded-2xl flex flex-col gap-2.5`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-caption font-bold ${trialStyles.textClass} flex items-center gap-1.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${trialStyles.dotBg} animate-pulse`} />
                      Free Trial
                    </span>
                    <span className={`text-micro font-semibold ${trialStyles.textBadge}`}>
                      {trialDaysLeft} {trialDaysLeft === 1 ? "Day" : "Days"} Left
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-shade-30 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${trialStyles.barBg} rounded-full transition-all duration-500`}
                      style={{ width: `${trialProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
