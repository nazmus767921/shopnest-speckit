import { db } from "@/db"
import { storefrontSections } from "@/db/schema"
import { eq, and, asc } from "drizzle-orm"

export async function getStorefrontSections(merchantId: string, onlyVisible = true) {
  return db.query.storefrontSections.findMany({
    where: (sections, { eq, and }) => 
      onlyVisible 
        ? and(eq(sections.merchantId, merchantId), eq(sections.isVisible, true))
        : eq(sections.merchantId, merchantId),
    orderBy: (sections, { asc }) => [asc(sections.sortOrder)],
  })
}

export type StorefrontSectionInput = {
  sectionKey: string
  content: any
  sortOrder: number
  isVisible: boolean
}

export async function saveStorefrontSections(merchantId: string, sections: StorefrontSectionInput[]) {
  return db.transaction(async (tx) => {
    // Delete all existing sections for this merchant
    await tx.delete(storefrontSections).where(eq(storefrontSections.merchantId, merchantId))

    // If there are sections to save, insert them
    if (sections.length > 0) {
      const values = sections.map((section) => ({
        merchantId,
        sectionKey: section.sectionKey,
        content: section.content,
        sortOrder: section.sortOrder,
        isVisible: section.isVisible,
      }))
      await tx.insert(storefrontSections).values(values)
    }
  })
}
