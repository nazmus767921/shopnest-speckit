"use client"

import React, { useState } from "react"
import { ReviewSection } from "@/components/storefront/shared/ReviewSection"

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
          <ReviewSection />
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
