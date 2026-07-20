import React from "react"
import { NewsletterForm } from "@/components/storefront/primitives/NewsletterForm"
import { type SectionProps } from "@/templates/types"

export function Newsletter({ section }: SectionProps) {
  const content = section.content as any
  const heading = content.heading || "Join Our Newsletter"
  const subheading = content.subheading || "Subscribe to receive updates, access to exclusive deals, and more."
  const placeholder = content.placeholder || "Enter your email address"
  const buttonText = content.buttonText || "Subscribe"

  return (
    <section className="py-24 px-6 md:px-12 w-full bg-[var(--color-surface)] border-y border-[var(--color-hairline-warm)]">
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center">
        <h2 className="font-display text-3xl md:text-4xl text-[var(--color-ink)] mb-4">
          {heading}
        </h2>
        {subheading && (
          <p className="font-sans text-[var(--color-shade-60)] mb-8 max-w-lg">
            {subheading}
          </p>
        )}
        <NewsletterForm 
          placeholder={placeholder}
          buttonText={buttonText}
          className="w-full"
        />
      </div>
    </section>
  )
}
