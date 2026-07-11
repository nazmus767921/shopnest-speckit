import React from "react"
import { PageForm } from "../components/page-form"
import Link from "next/link"
import { ChevronLeftIcon } from "@/lib/icons";

export const metadata = {
  title: "Create Page — ShopNest Dashboard",
}

export default function NewPage() {
  return (
    <div className="flex flex-col animate-fade-in w-full">

      <PageForm />
    </div>
  )
}
