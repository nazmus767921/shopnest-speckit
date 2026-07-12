import React from "react"
import { FaqContent } from "@/lib/storefront-sections/types"

export function FaqSection({ content }: { content: FaqContent }) {
  const parsedFaqs = content.items || content.questions || []
  const heading = content.heading || content.title || "Frequently Asked Questions"

  if (parsedFaqs.length === 0) return null

  return (
    <section className="flex flex-col gap-6 pt-10 pb-10 w-full max-w-4xl mx-auto px-4 md:px-0">
      <h2 className="text-3xl md:text-4xl text-center font-semibold text-[var(--color-ink)] uppercase tracking-tight font-[family-name:var(--font-heading)]">
        {heading}
      </h2>
      <div className="flex flex-col divide-y divide-[var(--color-hairline-light)] border border-[var(--color-hairline-light)] rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-canvas-light)]">
        {parsedFaqs.map((faq: any, i: number) => (
          <details key={i} className="group p-5 cursor-pointer">
            <summary className="flex items-center justify-between font-semibold text-lg text-[var(--color-ink)] list-none font-[family-name:var(--font-body)]">
              <span>{faq.question}</span>
              <span className="text-[var(--color-shade-40)] group-open:rotate-45 transition-transform duration-250 text-xl leading-none select-none">
                +
              </span>
            </summary>
            <p className="mt-3 text-base text-[var(--color-shade-50)] font-light leading-relaxed animate-fade-in font-[family-name:var(--font-body)]">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
