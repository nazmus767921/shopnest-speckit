"use server"

import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import { getSubscriptionByMerchantId } from "@/db/queries/subscriptions"
import { insertMediaFile, deleteMediaFiles, insertMediaFolder, deleteMediaFolder, renameMediaFile, moveMediaFiles, toggleStarMediaFiles, getMediaFiles, getMediaFolders } from "@/db/queries/media"
import { revalidatePath, revalidateTag } from "next/cache"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { db } from "@/db"
import { mediaFolders } from "@/db/schema"
import { and, eq } from "drizzle-orm"

async function requireMerchantContext() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) {
    throw new Error("Merchant not found")
  }
  return { session, merchant }
}

export async function createMediaFileAction(payload: { url: string, key: string, name: string, size: number, type: string, folder?: string }) {
  try {
    const { session, merchant } = await requireMerchantContext()
    
    const sub = await getSubscriptionByMerchantId(merchant.id)
    const limitMb = sub?.snapshotImageSizeMb ?? 2 // Default fallback
    const limitBytes = limitMb * 1024 * 1024
    
    if (payload.size > limitBytes) {
      return { success: false, error: `Image size exceeds the ${limitMb}MB limit on your current plan.` }
    }

    const folderSlug = payload.folder || "uncategorized"
    if (folderSlug !== "uncategorized") {
      const existing = await db.select()
        .from(mediaFolders)
        .where(and(eq(mediaFolders.merchantId, merchant.id), eq(mediaFolders.slug, folderSlug)))
        .limit(1)

      if (existing.length === 0) {
        const folderName = folderSlug.charAt(0).toUpperCase() + folderSlug.slice(1)
        await db.insert(mediaFolders).values({
          merchantId: merchant.id,
          name: folderName,
          slug: folderSlug
        })
      }
    }
    
    const file = await insertMediaFile(merchant.id, session.user.id, {
      ...payload,
      folder: folderSlug
    })
    revalidatePath("/media")
    revalidateTag("media", "max")
    return { success: true, file }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteMediaFilesAction(fileIds: string[]) {
  try {
    const { merchant } = await requireMerchantContext()
    const deletedFiles = await deleteMediaFiles(merchant.id, fileIds)
    
    if (deletedFiles.length > 0) {
      const keys = deletedFiles.map(f => f.key)
      const { error: storageError } = await supabaseAdmin.storage
        .from("media")
        .remove(keys)
        
      if (storageError) {
        console.error("Failed to delete storage objects from bucket:", storageError.message)
      }
    }
    
    revalidatePath("/media")
    revalidateTag("media", "max")
    return { success: true, count: deletedFiles.length }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createFolderAction(name: string, slug: string) {
  try {
    const { merchant } = await requireMerchantContext()
    const folder = await insertMediaFolder(merchant.id, { name, slug })
    revalidatePath("/media")
    revalidateTag("media", "max")
    return { success: true, folder }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteFolderAction(folderSlug: string) {
  try {
    const { merchant } = await requireMerchantContext()
    await deleteMediaFolder(merchant.id, folderSlug)
    revalidatePath("/media")
    revalidateTag("media", "max")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function renameMediaFileAction(fileId: string, newName: string) {
  try {
    const { merchant } = await requireMerchantContext()
    const file = await renameMediaFile(merchant.id, fileId, newName)
    revalidatePath("/media")
    revalidateTag("media", "max")
    return { success: true, file }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function moveMediaFilesAction(fileIds: string[], targetFolder: string) {
  try {
    const { merchant } = await requireMerchantContext()
    const count = await moveMediaFiles(merchant.id, fileIds, targetFolder)
    revalidatePath("/media")
    revalidateTag("media", "max")
    return { success: true, count }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function toggleStarMediaAction(fileIds: string[], isStarred: boolean) {
  try {
    const { merchant } = await requireMerchantContext()
    const count = await toggleStarMediaFiles(merchant.id, fileIds, isStarred)
    revalidatePath("/media")
    revalidateTag("media", "max")
    return { success: true, count }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getMediaFilesAction() {
  try {
    const { merchant } = await requireMerchantContext()
    const files = await getMediaFiles(merchant.id)
    return { success: true, files }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getMediaFoldersAction() {
  try {
    const { merchant } = await requireMerchantContext()
    const folders = await getMediaFolders(merchant.id)
    return { success: true, folders }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
