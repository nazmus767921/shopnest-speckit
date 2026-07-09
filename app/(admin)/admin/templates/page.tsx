import React from "react"
import { db } from "@/db"
import { storeTemplates } from "@/db/schema"
import { asc } from "drizzle-orm"
import { TemplatesDashboardClient } from "./TemplatesDashboardClient"

export const metadata = {
  title: "Templates Management — ShopNest Admin",
}

export default async function TemplatesAdminPage() {
  const templates = await db.query.storeTemplates.findMany({
    orderBy: [asc(storeTemplates.sortOrder)]
  })

  return <TemplatesDashboardClient initialTemplates={templates} />
}
