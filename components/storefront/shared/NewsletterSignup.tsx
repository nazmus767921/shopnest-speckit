"use client"

import React, { useState } from "react"

interface NewsletterSignupProps {
  title?: string
  placeholder?: string
  buttonText?: string
  onSubscribe?: (email: string) => Promise<void>
  className?: string
}

export function NewsletterSignup({
  title = "Stay upto date about our latest offers",
  placeholder = "Enter your email address",
  buttonText = "Subscribe to Newsletter",
  onSubscribe,
  className = ""
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setStatus("loading")
    try {
      if (onSubscribe) {
        await onSubscribe(email)
      } else {
        // Mock API call
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      setStatus("success")
      setEmail("")
      setTimeout(() => setStatus("idle"), 3000)
    } catch (err) {
      setStatus("error")
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  return (
    <div className={`block-storefront-newsletter flex flex-col md:flex-row items-center justify-between gap-6 ${className}`}>
      <h3 className="text-storefront-display-huge font-bold max-w-md text-[var(--color-on-primary)]">
        {title}
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <input
          type="email"
          required
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          className="input-storefront-text grow bg-[var(--color-canvas-light)] text-[var(--color-ink)]"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-storefront-primary bg-[var(--color-on-primary)] text-[var(--color-primary)] hover:opacity-90 disabled:opacity-50 border-none"
        >
          {status === "loading" ? "Subscribing..." : status === "success" ? "Subscribed ✓" : buttonText}
        </button>
      </form>
    </div>
  )
}
