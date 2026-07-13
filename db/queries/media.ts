import { db } from "@/db"
import { mediaFiles, mediaFolders } from "@/db/schema"
import { eq, and, inArray } from "drizzle-orm"

export async function insertMediaFile(merchantId: string, uploadedById: string, payload: { url: string, key: string, name: string, size: number, type: string, folder?: string }) {
  const [file] = await db.insert(mediaFiles).values({
    merchantId,
    uploadedById,
    url: payload.url,
    key: payload.key,
    name: payload.name,
    size: payload.size,
    type: payload.type,
    folder: payload.folder ?? "uncategorized"
  }).returning()
  return file
}

export async function deleteMediaFiles(merchantId: string, fileIds: string[]) {
  if (fileIds.length === 0) return []
  
  return await db.delete(mediaFiles)
    .where(and(eq(mediaFiles.merchantId, merchantId), inArray(mediaFiles.id, fileIds)))
    .returning()
}

export async function getMediaFiles(merchantId: string) {
  return await db.select().from(mediaFiles).where(eq(mediaFiles.merchantId, merchantId))
}

// Additional folder queries we'll need for actions
export async function getMediaFolders(merchantId: string) {
  return await db.select().from(mediaFolders).where(eq(mediaFolders.merchantId, merchantId))
}

export async function insertMediaFolder(merchantId: string, payload: { name: string, slug: string }) {
  const [folder] = await db.insert(mediaFolders).values({
    merchantId,
    name: payload.name,
    slug: payload.slug
  }).returning()
  return folder
}

export async function deleteMediaFolder(merchantId: string, folderSlug: string) {
  // Move files to general
  await db.update(mediaFiles)
    .set({ folder: "uncategorized" })
    .where(and(eq(mediaFiles.merchantId, merchantId), eq(mediaFiles.folder, folderSlug)))
    
  return await db.delete(mediaFolders).where(and(eq(mediaFolders.merchantId, merchantId), eq(mediaFolders.slug, folderSlug)))
}

export async function moveMediaFiles(merchantId: string, fileIds: string[], targetFolder: string) {
  if (fileIds.length === 0) return 0
  const result = await db.update(mediaFiles)
    .set({ folder: targetFolder })
    .where(and(eq(mediaFiles.merchantId, merchantId), inArray(mediaFiles.id, fileIds)))
    .returning()
  return result.length
}

export async function renameMediaFile(merchantId: string, fileId: string, newName: string) {
  const [file] = await db.update(mediaFiles)
    .set({ name: newName })
    .where(and(eq(mediaFiles.merchantId, merchantId), eq(mediaFiles.id, fileId)))
    .returning()
  return file
}

export async function toggleStarMediaFiles(merchantId: string, fileIds: string[], isStarred: boolean) {
  if (fileIds.length === 0) return 0
  const result = await db.update(mediaFiles)
    .set({ isStarred })
    .where(and(eq(mediaFiles.merchantId, merchantId), inArray(mediaFiles.id, fileIds)))
    .returning()
  return result.length
}

