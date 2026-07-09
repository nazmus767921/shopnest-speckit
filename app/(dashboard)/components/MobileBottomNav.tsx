"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  LayoutTemplate,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

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

  const isTabActive = (href: string, exact?: boolean) => {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-40 select-none text-foreground"
        aria-label="Mobile Navigation"
      >
        {primaryTabs.map((tab) => {
          const active = isTabActive(tab.href, tab.exact)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-20 h-full text-sm transition-colors",
                active ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground/60")} />
              <span className="text-[11px] tracking-tight">{tab.label}</span>
            </Link>
          )
        })}

        {/* More Tab */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-20 h-full text-sm transition-colors focus:outline-none cursor-pointer",
            isDrawerOpen ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
          )}
          aria-expanded={isDrawerOpen}
          aria-haspopup="true"
        >
          <MoreHorizontal className={cn("h-5 w-5", isDrawerOpen ? "text-primary" : "text-muted-foreground/60")} />
          <span className="text-[11px] tracking-tight">More</span>
        </button>
      </nav>

      {/* Slide-Up Drawer Overlay */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="bottom" className="h-[80vh] sm:h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xs font-bold text-muted-foreground tracking-wider uppercase">{storeName}</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground font-light">Store Administration</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-6 text-foreground mt-4">
            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard/templates"
                onClick={() => setIsDrawerOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                  pathname.startsWith("/dashboard/templates")
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-foreground hover:bg-muted font-medium"
                )}
              >
                <LayoutTemplate className="h-5 w-5" />
                <span>Templates</span>
              </Link>

              <Link
                href="/dashboard/categories"
                onClick={() => setIsDrawerOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                  pathname.startsWith("/dashboard/categories")
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-foreground hover:bg-muted font-medium"
                )}
              >
                <FolderTree className="h-5 w-5" />
                <span>Categories</span>
              </Link>

              <Link
                href="/dashboard/discounts"
                onClick={() => setIsDrawerOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                  pathname.startsWith("/dashboard/discounts")
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-foreground hover:bg-muted font-medium"
                )}
              >
                <Percent className="h-5 w-5" />
                <span>Discounts</span>
              </Link>

              <Link
                href="/dashboard/settings"
                onClick={() => setIsDrawerOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                  pathname.startsWith("/dashboard/settings")
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-foreground hover:bg-muted font-medium"
                )}
              >
                <Settings className="h-5 w-5" />
                <span>Store Settings</span>
              </Link>

              <Link
                href="/dashboard/billing"
                onClick={() => setIsDrawerOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                  pathname.startsWith("/dashboard/billing")
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-foreground hover:bg-muted font-medium"
                )}
              >
                <CreditCard className="h-5 w-5" />
                <span>Billing & Plan</span>
              </Link>
            </div>

            {/* Trial & Footer Panel inside Drawer */}
            <div className="border-t border-border pt-4 flex flex-col gap-4">
              {isTrial && (
                <div className={cn(trialStyles.cardBg, "p-4 border", trialStyles.borderClass, "rounded-xl flex flex-col gap-2.5")}>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-bold flex items-center gap-1.5", trialStyles.textClass)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", trialStyles.dotBg)} />
                      Free Trial
                    </span>
                    <span className={cn("text-xs font-semibold", trialStyles.textBadge)}>
                      {trialDaysLeft} {trialDaysLeft === 1 ? "Day" : "Days"} Left
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", trialStyles.barBg)}
                      style={{ width: `${trialProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <LogoutButton />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
