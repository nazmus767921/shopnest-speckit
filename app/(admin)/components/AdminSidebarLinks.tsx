"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shield, Users, CreditCard, ChevronRight, Layers } from "lucide-react"

export function AdminSidebarLinks() {
  const pathname = usePathname()

  const links = [
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
    {
      label: "Plans",
      href: "/admin/plans",
      icon: Layers,
    },
  ]

  return (
    <div className="flex flex-col gap-1 grow">
      {links.map((item) => {
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
  )
}
