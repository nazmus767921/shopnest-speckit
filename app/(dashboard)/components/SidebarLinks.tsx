"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  LayoutTemplate,
  ShoppingBag,
  Tag,
  Settings,
  CreditCard,
  Percent,
  FolderTree,
  FileText,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<any>
  exact?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

export function SidebarLinks() {
  const pathname = usePathname()

  const navItems: NavGroup[] = [
    {
      label: "Core",
      items: [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      label: "Storefront",
      items: [
        {
          label: "Templates",
          href: "/dashboard/templates",
          icon: LayoutTemplate,
        },
        {
          label: "Pages",
          href: "/dashboard/pages",
          icon: FileText,
        },
        {
          label: "Navigation",
          href: "/dashboard/settings/navigation",
          icon: Menu,
        },
        {
          label: "Products",
          href: "/dashboard/products",
          icon: ShoppingBag,
        },
        {
          label: "Categories",
          href: "/dashboard/categories",
          icon: FolderTree,
        },
        {
          label: "Orders",
          href: "/dashboard/orders",
          icon: Tag,
        },
        {
          label: "Discounts",
          href: "/dashboard/discounts",
          icon: Percent,
        },
      ],
    },
    {
      label: "Settings",
      items: [
        {
          label: "Store Settings",
          href: "/dashboard/settings",
          icon: Settings,
        },
        {
          label: "Billing & Plan",
          href: "/dashboard/billing",
          icon: CreditCard,
        },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-6 grow text-foreground">
      {navItems.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <span className="px-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1.5 block">
            {group.label}
          </span>
          {group.items.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)

            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group font-semibold",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground/80 group-hover:text-foreground"
                  )} />
                  <span>{item.label}</span>
                </span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />}
              </Link>
            )
          })}
        </div>
      ))}
    </div>
  )
}
