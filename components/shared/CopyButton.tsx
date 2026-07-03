"use client"

import React, { useState } from "react"
import { Copy, Check } from "lucide-react"

interface CopyButtonProps {
  text: string
  className?: string
}

export function CopyButton({ text, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={`text-shade-40 hover:text-ink cursor-pointer p-1 rounded-md hover:bg-shade-30/15 transition-colors shrink-0 ${className}`}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-700 stroke-[2.5px]" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  )
}
