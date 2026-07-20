"use client"

import React from "react"
import Image from "next/image"

interface TestimonialCardProps {
  name: string
  text: string
  rating?: number
  avatarUrl?: string
  className?: string
}

export function TestimonialCard({ name, text, rating = 5, avatarUrl, className }: TestimonialCardProps) {
  return (
    <div className={`flex flex-col gap-4 p-6 md:p-8 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-hairline-warm)] ${className || ""}`}>
      {/* Rating Stars */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < rating ? "fill-[var(--color-rating-star)] text-[var(--color-rating-star)]" : "fill-[var(--color-shade-20)] text-[var(--color-shade-20)]"}`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Testimonial Text */}
      <blockquote className="font-display text-base md:text-lg text-[var(--color-ink)] leading-relaxed italic">
        "{text}"
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3 mt-auto pt-2">
        {avatarUrl ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
            <Image src={avatarUrl} alt={name} fill className="object-cover" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full shrink-0 bg-[var(--color-shade-20)] flex items-center justify-center font-display font-semibold text-[var(--color-shade-60)]">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-sans text-sm font-semibold tracking-wider text-[var(--color-shade-80)] uppercase">
          {name}
        </span>
      </div>
    </div>
  )
}
