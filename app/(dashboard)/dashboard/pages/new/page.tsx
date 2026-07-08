import React from "react"
import { PageForm } from "../components/page-form"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const metadata = {
  title: "Create Page — ShopNest Dashboard",
}

export default function NewPage() {
  return (
    <div className="flex flex-col gap-8 animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/pages"
          className="flex items-center gap-2 text-caption text-shade-50 hover:text-ink transition-colors w-fit"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Pages</span>
        </Link>
        <div className="pb-4 border-b border-hairline-light">
          <h1 className="font-display text-heading-xl tracking-tight text-ink font-semibold leading-none">
            Create Page
          </h1>
        </div>
      </div>

      <PageForm />
    </div>
  )
}
