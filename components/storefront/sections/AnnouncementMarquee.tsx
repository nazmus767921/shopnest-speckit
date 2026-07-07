import React from "react"
import Link from "next/link"
import { AnnouncementBarContent } from "@/lib/storefront-sections/types"

export function AnnouncementMarquee({ content }: { content: AnnouncementBarContent }) {
  const { text, link, backgroundColor = "#000000", textColor = "#ffffff" } = content

  // Generate a repeated set of text spans to fill the viewport width nicely
  const repeatedText = Array(12).fill(text)

  const track = (
    <div className="flex shrink-0 items-center justify-around min-w-full animate-marquee">
      {repeatedText.map((t, idx) => (
        <span key={idx} className="mx-8 whitespace-nowrap">
          {t}
        </span>
      ))}
    </div>
  )

  const inner = (
    <div 
      className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] py-3 text-center font-sans text-xs font-light uppercase tracking-[0.2em] flex overflow-hidden select-none"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="flex w-max min-w-full">
        {track}
        {track}
      </div>
    </div>
  )

  if (link) {
    return (
      <Link href={link} className="block w-full hover:opacity-90 transition-opacity">
        {inner}
      </Link>
    )
  }

  return inner
}
