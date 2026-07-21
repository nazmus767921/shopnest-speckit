import React from "react"
import { TestimonialCard } from "@/components/storefront/primitives/TestimonialCard"
import { TestimonialsContent } from "@/lib/storefront/schema/sections"

export function Testimonials({ content }: { content: TestimonialsContent }) {
  const title = (content as any).headline || (content as any).title || "What Our Customers Say"
  const testimonials = content.testimonials || []

  if (testimonials.length === 0) {
    return null
  }

  return (
    <section className="py-24 px-6 md:px-12 max-w-10xl mx-auto w-full bg-[var(--color-surface-product)]">
      <div className="flex flex-col items-center justify-center mb-16 text-center">
        <h2 className="font-display text-4xl text-[var(--color-ink)] mb-4">
          {title}
        </h2>
        <div className="w-12 h-0.5 bg-[var(--color-ink)]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {testimonials.map((testimonial: any, index: number) => (
          <TestimonialCard
            key={index}
            name={testimonial.name}
            text={testimonial.text}
            rating={testimonial.rating}
            avatarUrl={testimonial.avatarUrl}
          />
        ))}
      </div>
    </section>
  )
}
