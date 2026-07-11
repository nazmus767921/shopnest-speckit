"use client"

import React from "react"
import { CheckIcon, SlidersHorizontalIcon, ChevronDownIcon } from "@/lib/icons";

export interface Review {
  id: string
  author: string
  rating: number
  verified: boolean
  comment: string
  date: string
}

export const mockReviews: Review[] = [
  {
    id: "r1",
    author: "Samantha D.",
    rating: 5,
    verified: true,
    comment: "I absolutely love this t-shirt! The design is unique and the fabric feels so comfortable. As a fellow designer, I appreciate the attention to detail. It's become my favorite go-to shirt.",
    date: "August 14, 2023",
  },
  {
    id: "r2",
    author: "Alex M.",
    rating: 4,
    verified: true,
    comment: "The t-shirt exceeded my expectations! The colors are vibrant and the print quality is top-notch. Being a UI/UX designer myself, I'm quite picky about aesthetics, and this t-shirt definitely gets a thumbs up from me.",
    date: "August 15, 2023",
  },
  {
    id: "r3",
    author: "Ethan R.",
    rating: 5,
    verified: true,
    comment: "This t-shirt is a must-have for anyone who appreciates good design. The minimalistic yet stylish pattern caught my eye, and the fit is perfect. I can see the designer's touch in every aspect of this shirt.",
    date: "August 16, 2023",
  },
  {
    id: "r4",
    author: "Olivia P.",
    rating: 4,
    verified: true,
    comment: "As a UI/UX enthusiast, I value simplicity and functionality. This t-shirt not only represents those principles but also feels great to wear. It's evident that the designer poured their creativity into making this t-shirt stand out.",
    date: "August 17, 2023",
  },
  {
    id: "r5",
    author: "Liam K.",
    rating: 5,
    verified: true,
    comment: "This t-shirt is a fusion of comfort and creativity. The fabric is soft, and the design speaks volumes about the designer's skill. It's like wearing a piece of art that reflects my passion for both design and fashion.",
    date: "August 18, 2023",
  },
  {
    id: "r6",
    author: "Ava H.",
    rating: 5,
    verified: true,
    comment: "I'm not just wearing a t-shirt; I'm wearing a piece of design philosophy. The intricate details and thoughtful layout of the design make this shirt a conversation starter.",
    date: "August 19, 2023",
  },
]

interface ReviewSectionProps {
  reviews?: Review[]
  onWriteReview?: () => void
  onFilterClick?: () => void
  onSortChange?: (sort: string) => void
  onLoadMore?: () => void
  className?: string
}

export function ReviewSection({
  reviews = mockReviews,
  onWriteReview,
  onFilterClick,
  onSortChange,
  onLoadMore,
  className = ""
}: ReviewSectionProps) {
  return (
    <div className={`flex flex-col gap-6 w-full ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-1.5 select-none">
          <h4 className="text-lg md:text-2xl font-bold font-sans text-[var(--color-ink)]">All Reviews</h4>
          <span className="text-xs md:text-sm text-[var(--color-shade-40)] font-sans font-medium">({reviews.length})</span>
        </div>

        <div className="flex items-center gap-2 select-none">
          {/* Filter Icon Button */}
          <button
            type="button"
            onClick={onFilterClick}
            className="h-10 w-10 md:h-12 md:w-12 rounded-[var(--radius-pill)] bg-[var(--color-surface-secondary)] flex items-center justify-center text-[var(--color-ink)] hover:opacity-85 transition-opacity cursor-pointer border-none"
            aria-label="Filter reviews"
          >
            <SlidersHorizontalIcon className="h-4.5 w-4.5 md:h-5 w-5" />
          </button>

          {/* Sorting Dropdown */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              className="h-10 md:h-12 bg-[var(--color-surface-secondary)] rounded-[var(--radius-pill)] px-5 flex items-center gap-2 text-sm font-bold text-[var(--color-ink)] hover:opacity-85 transition-opacity cursor-pointer border-none"
            >
              <span>Latest</span>
              <ChevronDownIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Write a Review Button */}
          <button
            type="button"
            onClick={onWriteReview}
            className="h-10 md:h-12 btn-storefront-primary text-xs md:text-sm px-4 md:px-6 hover:opacity-90 select-none border-none"
          >
            Write a Review
          </button>
        </div>
      </div>
      
      {/* Grid of Reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="card-storefront-review flex flex-col gap-3 h-full hover:border-[var(--color-shade-40)] transition-colors"
          >
            {/* Rating Stars */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`h-4.5 w-4.5 ${
                    i < review.rating ? "text-[var(--color-rating-star)] fill-current" : "text-zinc-200"
                  }`}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>

            {/* Author Name & Checkmark */}
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-[var(--color-ink)] font-sans">{review.author}</span>
              {review.verified && (
                <span className="flex items-center justify-center h-4.5 w-4.5 rounded-[var(--radius-pill)] bg-[var(--color-success-green)] text-white p-0.5 select-none">
                  <CheckIcon className="h-3 w-3 stroke-[3]" />
                </span>
              )}
            </div>

            {/* Comment */}
            <p className="text-sm md:text-base text-[var(--color-shade-40)] leading-relaxed font-sans grow">
              "{review.comment}"
            </p>

            {/* Date */}
            <span className="text-xs md:text-sm text-[var(--color-shade-40)] font-medium font-sans mt-2 select-none">
              Posted on {review.date}
            </span>
          </div>
        ))}
      </div>

      {/* Load More Reviews Button */}
      <div className="flex justify-center mt-6">
        <button
          type="button"
          onClick={onLoadMore}
          className="btn-storefront-outline px-10 py-3.5 text-sm select-none"
        >
          Load More Reviews
        </button>
      </div>
    </div>
  )
}
