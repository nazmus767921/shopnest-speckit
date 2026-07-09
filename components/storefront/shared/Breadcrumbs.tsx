"use client"

import React from "react"
import Link from "next/link"
import { ChevronRightIcon } from "lucide-react"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  return (
    <nav className={`flex items-center gap-2 font-sans tracking-tighter text-base text-[var(--color-shade-40)] flex-wrap ${className}`}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRightIcon className="h-4 w-4 shrink-0 text-[var(--color-shade-40)]" />}
            {isLast ? (
              <span className="text-[var(--color-ink)] font-semibold line-clamp-1">{item.label}</span>
            ) : item.href ? (
              <Link prefetch={false} href={item.href} className="hover:text-[var(--color-ink)] transition-colors shrink-0">
                {item.label}
              </Link>
            ) : (
              <span className="hover:text-[var(--color-ink)] transition-colors cursor-pointer shrink-0">{item.label}</span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
