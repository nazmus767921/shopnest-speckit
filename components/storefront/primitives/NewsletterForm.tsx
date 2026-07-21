"use client"

import React, { useState } from "react"
import { toast } from "sonner"

interface NewsletterFormProps {
  placeholder?: string
  buttonText?: string
  className?: string
  inputClassName?: string
  buttonClassName?: string
}

export function NewsletterForm({ 
  placeholder = "Enter your email address", 
  buttonText = "Subscribe",
  className,
  inputClassName,
  buttonClassName
}: NewsletterFormProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus("loading")
    
    // Simulate API call
    setTimeout(() => {
      setStatus("success")
      setEmail("")
      toast.success("Successfully subscribed to newsletter")
      setTimeout(() => setStatus("idle"), 3000)
    }, 1000)
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 w-full max-w-md ${className || ""}`}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        required
        disabled={status === "loading" || status === "success"}
        className={`flex-1 h-12 px-4 rounded-[var(--radius-md)] border border-[var(--color-hairline-warm)] bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-shade-40)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)] disabled:opacity-50 font-sans text-sm ${inputClassName || ""}`}
      />
      <button
        type="submit"
        disabled={status === "loading" || status === "success"}
        className={`h-12 px-8 rounded-[var(--radius-md)] bg-[var(--color-ink)] text-[var(--color-surface)] font-sans text-[11px] font-bold tracking-wider uppercase transition-colors hover:bg-[var(--color-shade-80)] disabled:opacity-50 whitespace-nowrap ${buttonClassName || ""}`}
      >
        {status === "loading" ? "Subscribing..." : status === "success" ? "Subscribed!" : buttonText}
      </button>
    </form>
  )
}
