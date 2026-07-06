"use client"

import React, { useState } from "react"
import { Check, SlidersHorizontal, ChevronDown } from "lucide-react"

interface Review {
  id: string
  author: string
  rating: number
  verified: boolean
  comment: string
  date: string
}

interface Faq {
  question: string
  answer: string
}

export interface ProductMetadataItem {
  key: string
  value: string
}

interface ProductTabsProps {
  description: string
  metadata?: ProductMetadataItem[]
  faqs?: Faq[]
}

const mockReviews: Review[] = [
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

const fallbackFaqs: Faq[] = [
  {
    question: "What is your return policy?",
    answer: "We accept returns within 14 days of delivery. Items must be in their original packaging and unused condition.",
  },
  {
    question: "How long does shipping take?",
    answer: "Standard shipping takes 3-5 business days. Express options are available at checkout.",
  },
]

export function ProductTabs({ description, metadata = [], faqs = [] }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<"details" | "reviews" | "faqs">("reviews")
  const displayFaqs = faqs.length > 0 ? faqs : fallbackFaqs

  return (
    <div className="w-full flex flex-col gap-6 mt-12">
      {/* Tab Headers */}
      <div className="flex border-b border-hairline-light justify-between md:justify-around gap-4 text-center select-none">
        <button
          onClick={() => setActiveTab("details")}
          className={`w-full pb-4 text-sm md:text-lg font-sans transition-all cursor-pointer border-b-2 font-medium ${
            activeTab === "details"
              ? "border-black text-ink font-semibold"
              : "border-transparent text-shade-40 hover:text-ink"
          }`}
        >
          Product Details
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`w-full pb-4 text-sm md:text-lg font-sans transition-all cursor-pointer border-b-2 font-medium ${
            activeTab === "reviews"
              ? "border-black text-ink font-semibold"
              : "border-transparent text-shade-40 hover:text-ink"
          }`}
        >
          Rating & Reviews
        </button>
        <button
          onClick={() => setActiveTab("faqs")}
          className={`w-full pb-4 text-sm md:text-lg font-sans transition-all cursor-pointer border-b-2 font-medium ${
            activeTab === "faqs"
              ? "border-black text-ink font-semibold"
              : "border-transparent text-shade-40 hover:text-ink"
          }`}
        >
          FAQs
        </button>
      </div>

      {/* Tab Contents */}
      <div className="py-2">
        {activeTab === "details" && (
          <div className="text-sm md:text-base font-sans text-shade-50 max-w-3xl leading-relaxed whitespace-pre-line">
            <p className="mb-4">{description || "Boutique exclusive design."}</p>
            {metadata.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 max-w-md mt-6 pt-4 border-t border-hairline-light font-sans">
                {metadata.map((item, index) => (
                  <React.Fragment key={index}>
                    <span className="font-bold text-ink">{item.key}</span>
                    <span className="text-shade-50">{item.value}</span>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-w-md mt-6 pt-4 border-t border-hairline-light font-sans">
                <span className="font-bold text-ink">Material</span>
                <span className="text-shade-50">100% Premium Cotton</span>
                <span className="font-bold text-ink">Care Instructions</span>
                <span className="text-shade-50">Machine wash cold, dry flat</span>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="flex flex-col gap-6">
            {/* Header Controls */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-1.5 select-none">
                <h4 className="text-lg md:text-2xl font-bold font-sans text-ink">All Reviews</h4>
                <span className="text-xs md:text-sm text-shade-40 font-sans font-medium">({mockReviews.length})</span>
              </div>

              <div className="flex items-center gap-2 select-none">
                {/* Filter Icon Button */}
                <button
                  type="button"
                  className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-[#F2F0F1] flex items-center justify-center text-ink hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                  aria-label="Filter reviews"
                >
                  <SlidersHorizontal className="h-4.5 w-4.5 md:h-5 md:w-5" />
                </button>

                {/* Sorting Dropdown */}
                <div className="relative hidden sm:block">
                  <button
                    type="button"
                    className="h-12 bg-[#F2F0F1] rounded-full px-5 flex items-center gap-2 text-sm font-bold text-ink hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                  >
                    <span>Latest</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Write a Review Button */}
                <button
                  type="button"
                  className="h-10 md:h-12 bg-primary text-white rounded-full px-4 md:px-6 text-xs md:text-sm font-bold hover:bg-zinc-800 transition-colors cursor-pointer select-none"
                >
                  Write a Review
                </button>
              </div>
            </div>
            
            {/* Grid of Reviews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
              {mockReviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-hairline-light rounded-[16px] p-6 bg-transparent flex flex-col gap-3 h-full hover:border-shade-40 transition-colors"
                >
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`h-4.5 w-4.5 ${
                          i < review.rating ? "text-[#FFC633] fill-current" : "text-zinc-200"
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
                    <span className="text-base font-bold text-ink font-sans">{review.author}</span>
                    {review.verified && (
                      <span className="flex items-center justify-center h-4.5 w-4.5 rounded-full bg-[#01AB31] text-white p-0.5 select-none">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Comment */}
                  <p className="text-sm md:text-base text-shade-40 leading-relaxed font-sans grow">
                    "{review.comment}"
                  </p>

                  {/* Date */}
                  <span className="text-xs md:text-sm text-shade-40 font-medium font-sans mt-2 select-none">
                    Posted on {review.date}
                  </span>
                </div>
              ))}
            </div>

            {/* Load More Reviews Button */}
            <div className="flex justify-center mt-6">
              <button
                type="button"
                className="rounded-full border border-hairline-light px-10 py-3.5 text-sm font-bold font-sans text-ink hover:bg-zinc-50 transition-colors cursor-pointer select-none"
              >
                Load More Reviews
              </button>
            </div>
          </div>
        )}

        {activeTab === "faqs" && (
          <div className="flex flex-col gap-6 max-w-3xl font-sans">
            {displayFaqs.map((faq, index) => (
              <div key={index} className="flex flex-col gap-2 border-b border-hairline-light pb-4">
                <h4 className="text-lg font-bold text-ink">{faq.question}</h4>
                <p className="text-sm md:text-base text-shade-50 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
