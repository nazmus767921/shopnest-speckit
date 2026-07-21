import React from "react"
import { type StandardPageProps } from "../types"

export function MidnightStandardPage({ page }: StandardPageProps) {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.content }} />
    </div>
  )
}
