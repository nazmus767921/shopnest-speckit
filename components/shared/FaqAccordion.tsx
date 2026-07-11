"use client"

import * as React from "react"
import { ChevronDownIcon } from "@/lib/icons";

import { cn } from "@/lib/utils"

interface FaqItem {
  question: string
  answer: string
}

const faqItems: FaqItem[] = [
  {
    question: "How does the 7-day free trial work?",
    answer: "You get full, unrestricted access to all features of your chosen plan. No credit card or bKash payment details are required to start. At the end of the 7 days, you can choose to upgrade to a paid subscription to keep your store active."
  },
  {
    question: "Do I need my own domain name?",
    answer: "No, you don't. We provide a professional, branded subdomain under our domain (e.g., yourname.shopnest.com.bd) instantly during setup. This link is ready to be shared immediately on your Facebook page or WhatsApp group."
  },
  {
    question: "How do customers pay me?",
    answer: "Customers pay you directly. During checkout, customers see your bKash or Nagad number and scanning instructions. They transfer the money using their bKash/Nagad app, copy the Transaction ID (TxID), and paste it into the checkout page. You confirm the payment in your dashboard with one click once you verify the funds on your phone."
  },
  {
    question: "How do I pay for my ShopNest subscription?",
    answer: "Subscriptions are collected manually via bKash or Nagad in v1. Our super admin records your payment and activates your account. You will receive SMS alerts before your subscription expires with payment instructions."
  },
  {
    question: "Is there any limit on products or orders?",
    answer: "Yes, the Starter plan (৳499/mo) supports up to 50 active products and 200 orders per month. The Growth plan (৳1499/mo) is completely unlimited for both products and orders, and also unlocks custom discount codes."
  }
]

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-3xl mx-auto">
      {faqItems.map((item, idx) => {
        const isOpen = openIndex === idx
        return (
          <div
            key={idx}
            className="border-b border-hairline-light pb-4 transition-colors duration-200"
          >
            <button
              onClick={() => toggle(idx)}
              className="w-full flex items-center justify-between text-left py-3 cursor-pointer focus:outline-none group"
              aria-expanded={isOpen}
            >
              <span className="text-heading-sm text-ink font-medium group-hover:text-primary transition-colors duration-200">
                {item.question}
              </span>
              <ChevronDownIcon
                className={cn(
                  "h-5 w-5 text-shade-50 transition-transform duration-300",
                  {
                    "transform rotate-180 text-primary": isOpen
                  }
                )}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                {
                  "max-h-40 opacity-100 mt-2": isOpen,
                  "max-h-0 opacity-0": !isOpen
                }
              )}
            >
              <p className="text-body-md text-shade-60 leading-relaxed pr-6">
                {item.answer}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
