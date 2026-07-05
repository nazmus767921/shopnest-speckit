"use client"

import React, { useState } from "react"
import { Check } from "lucide-react"

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

interface ProductTabsProps {
  description: string
  faqs?: Faq[]
}

const mockReviews: Review[] = [
  {
    id: "r1",
    author: "Samantha D.",
    rating: 5,
    verified: true,
    comment: "I absolutely love this piece! The fabric is high quality and it fits perfectly. Will definitely purchase again.",
    date: "July 2, 2026",
  },
  {
    id: "r2",
    author: "Alex M.",
    rating: 4,
    verified: true,
    comment: "Great minimalist style. Looks premium and fits well. Minor loose thread but otherwise perfect.",
    date: "June 28, 2026",
  },
  {
    id: "r3",
    author: "Liam K.",
    rating: 5,
    verified: true,
    comment: "Stunning design. It is rare to find boutique items with this attention to detail. Highly recommend to everyone!",
    date: "June 15, 2026",
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

export function ProductTabs({ description, faqs = [] }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<"details" | "reviews" | "faqs">("reviews")
  const displayFaqs = faqs.length > 0 ? faqs : fallbackFaqs

  return (
    <div className="w-full flex flex-col gap-6 mt-12">
      {/* Tab Headers */}
      <div className="flex border-b border-hairline-light justify-center md:justify-start gap-8">
        <button
          onClick={() => setActiveTab("details")}
          className={`pb-4 text-storefront-body-strong border-b-2 font-bold transition-all cursor-pointer ${
            activeTab === "details"
              ? "border-black text-ink font-bold"
              : "border-transparent text-shade-40 hover:text-ink"
          }`}
        >
          Product Details
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`pb-4 text-storefront-body-strong border-b-2 font-bold transition-all cursor-pointer ${
            activeTab === "reviews"
              ? "border-black text-ink font-bold"
              : "border-transparent text-shade-40 hover:text-ink"
          }`}
        >
          Rating & Reviews
        </button>
        <button
          onClick={() => setActiveTab("faqs")}
          className={`pb-4 text-storefront-body-strong border-b-2 font-bold transition-all cursor-pointer ${
            activeTab === "faqs"
              ? "border-black text-ink font-bold"
              : "border-transparent text-shade-40 hover:text-ink"
          }`}
        >
          FAQs
        </button>
      </div>

      {/* Tab Contents */}
      <div className="py-2">
        {activeTab === "details" && (
          <div className="text-storefront-body-md text-shade-50 max-w-3xl leading-relaxed whitespace-pre-line">
            <p className="mb-4">{description || "Boutique exclusive design."}</p>
            <div className="grid grid-cols-2 gap-4 max-w-md mt-6 pt-4 border-t border-hairline-light">
              <span className="text-storefront-body-strong font-bold text-ink">Material</span>
              <span className="text-storefront-body-md text-shade-50">100% Premium Cotton</span>
              <span className="text-storefront-body-strong font-bold text-ink">Care Instructions</span>
              <span className="text-storefront-body-md text-shade-50">Machine wash cold, dry flat</span>
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h4 className="text-storefront-heading-sm font-bold text-ink">All Reviews ({mockReviews.length})</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockReviews.map((review) => (
                <div key={review.id} className="card-storefront-review flex flex-col gap-3">
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
                  <div className="flex items-center gap-2">
                    <span className="text-storefront-body-strong font-bold text-ink">{review.author}</span>
                    {review.verified && (
                      <span className="flex items-center justify-center h-4.5 w-4.5 rounded-full bg-emerald-500 text-white p-0.5">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Comment */}
                  <p className="text-storefront-body-md text-shade-40 leading-relaxed">
                    "{review.comment}"
                  </p>

                  {/* Date */}
                  <span className="text-storefront-caption text-shade-50 font-normal mt-2">
                    Posted on {review.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "faqs" && (
          <div className="flex flex-col gap-6 max-w-3xl">
            {displayFaqs.map((faq, index) => (
              <div key={index} className="flex flex-col gap-2 border-b border-hairline-light pb-4">
                <h4 className="text-storefront-heading-sm font-bold text-ink">{faq.question}</h4>
                <p className="text-storefront-body-md text-shade-50 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
