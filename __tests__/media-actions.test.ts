import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMediaFileAction, deleteMediaFilesAction } from "@/app/actions/media"

const mockGetSession = vi.fn()
vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: (...args: any[]) => mockGetSession(...args)
    }
  }
}))

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Map())
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn()
}))

const mockGetMerchantByOwnerId = vi.fn()
const mockGetSubscriptionByMerchantId = vi.fn()
vi.mock("@/db/queries/merchants", () => ({
  getMerchantByOwnerId: (...args: any[]) => mockGetMerchantByOwnerId(...args)
}))
vi.mock("@/db/queries/subscriptions", () => ({
  getSubscriptionByMerchantId: (...args: any[]) => mockGetSubscriptionByMerchantId(...args)
}))

const mockInsertMediaFile = vi.fn()
const mockDeleteMediaFiles = vi.fn()
vi.mock("@/db/queries/media", () => ({
  insertMediaFile: (...args: any[]) => mockInsertMediaFile(...args),
  deleteMediaFiles: (...args: any[]) => mockDeleteMediaFiles(...args)
}))

const mockRemove = vi.fn()
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    storage: {
      from: vi.fn(() => ({
        remove: (...args: any[]) => mockRemove(...args)
      }))
    }
  }
}))

describe("media server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("createMediaFileAction", () => {
    it("should fail if unauthorized", async () => {
      mockGetSession.mockResolvedValue(null)
      const res = await createMediaFileAction({ url: "test", key: "test", name: "test", size: 100, type: "image/png" })
      expect(res).toEqual({ success: false, error: "Unauthorized" })
    })

    it("should fail if image size exceeds snapshotImageSizeMb limit", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-1" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-1" })
      mockGetSubscriptionByMerchantId.mockResolvedValue({ snapshotImageSizeMb: 2 })
      
      const res = await createMediaFileAction({ url: "test", key: "test", name: "test", size: 3 * 1024 * 1024, type: "image/png" })
      expect(res.success).toBe(false)
      expect(res.error).toMatch(/exceeds/i)
      expect(mockInsertMediaFile).not.toHaveBeenCalled()
    })

    it("should insert media file passing merchantId for isolation", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-1" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-1" })
      mockGetSubscriptionByMerchantId.mockResolvedValue({ snapshotImageSizeMb: 5 })
      mockInsertMediaFile.mockResolvedValue({ id: "file-1" })
      
      const payload = { url: "test", key: "test", name: "test", size: 1024, type: "image/png" }
      const res = await createMediaFileAction(payload)
      
      expect(res).toEqual({ success: true, file: { id: "file-1" } })
      expect(mockInsertMediaFile).toHaveBeenCalledWith("merchant-1", "user-1", payload)
    })
  })

  describe("deleteMediaFilesAction", () => {
    it("should delete media files using merchantId for isolation and invoke storage remove", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-1" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-1" })
      mockDeleteMediaFiles.mockResolvedValue([
        { id: "file-1", key: "key-1" },
        { id: "file-2", key: "key-2" }
      ])
      mockRemove.mockResolvedValue({ error: null })
      
      const res = await deleteMediaFilesAction(["file-1", "file-2"])
      
      expect(res).toEqual({ success: true, count: 2 })
      expect(mockDeleteMediaFiles).toHaveBeenCalledWith("merchant-1", ["file-1", "file-2"])
      expect(mockRemove).toHaveBeenCalledWith(["key-1", "key-2"])
    })
  })
})
