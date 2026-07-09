import { db } from "@/db"
import { pages } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { cacheLife } from "next/dist/server/use-cache/cache-life"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"

export async function getPageBySlug(merchantId: string, slug: string) {
  return await db.query.pages.findFirst({
    where: and(
      eq(pages.merchantId, merchantId),
      eq(pages.slug, slug),
      eq(pages.isPublished, true)
    ),
  })
}

export async function getCachedPageBySlug(merchantId: string, slug: string) {
  "use cache"
  cacheLife("hours")
  cacheTag(`merchant-${merchantId}-pages`, `page-${merchantId}-${slug}`)
  return await getPageBySlug(merchantId, slug)
}

export async function getPages(merchantId: string) {
  return await db.query.pages.findMany({
    where: eq(pages.merchantId, merchantId),
    orderBy: (pages, { desc }) => [desc(pages.createdAt)],
  })
}

export async function getPageById(merchantId: string, id: string) {
  return await db.query.pages.findFirst({
    where: and(
      eq(pages.merchantId, merchantId),
      eq(pages.id, id)
    ),
  })
}

export async function createPage(data: { merchantId: string; slug: string; title: string; content?: string | null; isPublished?: boolean }) {
  const [page] = await db.insert(pages).values({
    id: crypto.randomUUID(),
    merchantId: data.merchantId,
    slug: data.slug,
    title: data.title,
    content: data.content || null,
    isPublished: data.isPublished ?? false,
  }).returning()
  return page
}

export async function updatePage(merchantId: string, id: string, data: { slug?: string; title?: string; content?: string | null; isPublished?: boolean }) {
  const [page] = await db.update(pages).set({
    ...data,
    updatedAt: new Date(),
  }).where(
    and(
      eq(pages.id, id),
      eq(pages.merchantId, merchantId)
    )
  ).returning()
  return page
}

export async function deletePage(merchantId: string, id: string) {
  await db.delete(pages).where(
    and(
      eq(pages.id, id),
      eq(pages.merchantId, merchantId)
    )
  )
}
