"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  Settings,
  CreditCard,
  ChevronRight,
  Percent,
  FolderTree,
} from "lucide-react"

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
    <div className="flex flex-col gap-6 grow">
      {navItems.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <span className="px-4 text-[10px] font-bold text-shade-45 uppercase tracking-widest mb-1.5 block">
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
                className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-caption transition-all duration-200 group ${
                  isActive
                    ? "bg-zinc-950 text-white font-semibold"
                    : "text-shade-60 font-semibold hover:bg-zinc-100 hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 transition-colors ${
                    isActive ? "text-white" : "text-shade-40 group-hover:text-ink"
                  }`} />
                  <span>{item.label}</span>
                </span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </Link>
            )
          })}
        </div>
      ))}
    </div>
  )
}
