"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Shield,
  Users,
  CreditCard,
  MoreHorizontal,
  X,
  UserCircle,
  Layers,
  LayoutTemplate
} from "lucide-react"
import { LogoutButton } from "../../(dashboard)/components/LogoutButton"

interface AdminMobileBottomNavProps {
  adminName: string
}

export function AdminMobileBottomNav({ adminName }: AdminMobileBottomNavProps) {
  const pathname = usePathname()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Primary admin tabs
  const primaryTabs = [
    {
      label: "Overview",
      href: "/admin",
      icon: Shield,
      exact: true,
    },
    {
      label: "Merchants",
      href: "/admin/merchants",
      icon: Users,
    },
    {
      label: "Subscriptions",
      href: "/admin/subscriptions",
      icon: CreditCard,
    },
  ]

  // Check if a primary path is active
  const isTabActive = (href: string, exact?: boolean) => {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <>
      {/* Admin Bottom Navigation Bar */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-canvas-light border-t border-hairline-light flex items-center justify-around px-2 z-40 select-none"
        aria-label="Admin Navigation"
      >
        {primaryTabs.map((tab) => {
          const active = isTabActive(tab.href, tab.exact)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 w-20 h-full text-caption transition-colors ${
                active ? "text-red-700 font-semibold" : "text-shade-60 hover:text-shade-70"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-red-700" : "text-shade-40"}`} />
              <span className="text-[11px] tracking-tight">{tab.label}</span>
            </Link>
          )
        })}

        {/* More Tab */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className={`flex flex-col items-center justify-center gap-1 w-20 h-full text-caption transition-colors focus:outline-none cursor-pointer ${
            isDrawerOpen ? "text-red-700 font-semibold" : "text-shade-60 hover:text-shade-70"
          }`}
          aria-expanded={isDrawerOpen}
          aria-haspopup="true"
        >
          <MoreHorizontal className={`h-5 w-5 ${isDrawerOpen ? "text-red-700" : "text-shade-40"}`} />
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
                <span className="text-eyebrow-cap font-bold text-red-700 tracking-wider">
                  Platform Admin
                </span>
                <span className="text-caption text-shade-50 font-light flex items-center gap-1.5 mt-0.5">
                  <UserCircle className="h-4 w-4 text-shade-40" />
                  <span>{adminName}</span>
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

            {/* Drawer Links */}
            <div className="flex flex-col gap-2">
              <Link
                href="/admin/plans"
                onClick={() => setIsDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md transition-colors ${
                  pathname.startsWith("/admin/plans")
                    ? "bg-primary text-on-primary font-semibold"
                    : "text-shade-70 font-medium hover:bg-canvas-cream"
                }`}
              >
                <Layers className="h-4.5 w-4.5" />
                <span>Subscription Plans</span>
              </Link>
              <Link
                href="/admin/templates"
                onClick={() => setIsDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md transition-colors ${
                  pathname.startsWith("/admin/templates")
                    ? "bg-primary text-on-primary font-semibold"
                    : "text-shade-70 font-medium hover:bg-canvas-cream"
                }`}
              >
                <LayoutTemplate className="h-4.5 w-4.5" />
                <span>Templates</span>
              </Link>
            </div>

            {/* Logout Action */}
            <div className="pt-2">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
