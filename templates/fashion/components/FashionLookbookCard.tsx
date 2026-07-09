"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"

interface FashionLookbookCardProps {
  title: string
  subtitle: string
  imageUrl?: string | null
  href: string
  className?: string
}

export function FashionLookbookCard({ title, subtitle, imageUrl, href, className = "" }: FashionLookbookCardProps) {
  return (
    <Link href={href} className={`group block relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-hairline-warm)] bg-[var(--color-surface-product)] ${className}`}>
      <div className="relative aspect-[3/4] w-full">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-product)]" />
        )}
        {/* Editorial Text Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex flex-col justify-end p-6 md:p-8">
          <span className="text-white/80 text-[10px] tracking-[1.5px] uppercase font-sans font-semibold mb-1">
            {subtitle}
          </span>
          <h3 className="font-display text-2xl md:text-3xl text-white font-normal leading-tight">
            {title}
          </h3>
        </div>
      </div>
    </Link>
  )
}
