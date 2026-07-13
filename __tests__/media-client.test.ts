import { describe, it, expect } from "vitest"
import { calculateShiftClickRange, validateFileForStaging } from "../lib/media-helpers"

describe("Media Library Client Helpers", () => {
  describe("calculateShiftClickRange", () => {
    const fileIds = ["file-1", "file-2", "file-3", "file-4", "file-5"]

    it("should toggle selection if lastSelectedId is not set", () => {
      const currentSelected = new Set(["file-1"])
      
      // Select new file
      const next1 = calculateShiftClickRange(fileIds, null, "file-3", currentSelected)
      expect(next1.has("file-1")).toBe(true)
      expect(next1.has("file-3")).toBe(true)

      // Deselect existing file
      const next2 = calculateShiftClickRange(fileIds, null, "file-1", currentSelected)
      expect(next2.has("file-1")).toBe(false)
    })

    it("should select range between lastSelectedId and currentId", () => {
      const currentSelected = new Set(["file-2"])
      
      // Shift-click file-4 with last selected file-2
      const next = calculateShiftClickRange(fileIds, "file-2", "file-4", currentSelected)
      expect(next.has("file-2")).toBe(true)
      expect(next.has("file-3")).toBe(true)
      expect(next.has("file-4")).toBe(true)
      expect(next.has("file-1")).toBe(false)
      expect(next.has("file-5")).toBe(false)
    })

    it("should select range backwards (from larger index to smaller)", () => {
      const currentSelected = new Set(["file-4"])
      
      const next = calculateShiftClickRange(fileIds, "file-4", "file-2", currentSelected)
      expect(next.has("file-2")).toBe(true)
      expect(next.has("file-3")).toBe(true)
      expect(next.has("file-4")).toBe(true)
      expect(next.has("file-1")).toBe(false)
      expect(next.has("file-5")).toBe(false)
    })

    it("should fall back to toggle if lastSelectedId is not in list", () => {
      const currentSelected = new Set(["file-1"])
      
      const next = calculateShiftClickRange(fileIds, "non-existent", "file-3", currentSelected)
      expect(next.has("file-1")).toBe(true)
      expect(next.has("file-3")).toBe(true)
    })
  })

  describe("validateFileForStaging", () => {
    const limitBytes = 2 * 1024 * 1024 // 2MB

    it("should accept valid images under limit", () => {
      const validPng = { name: "test.png", size: 1 * 1024 * 1024, type: "image/png" }
      const validWebp = { name: "test.webp", size: 500 * 1024, type: "image/webp" }
      const validSvg = { name: "logo.svg", size: 10 * 1024, type: "image/svg+xml" }

      expect(validateFileForStaging(validPng, limitBytes)).toEqual({ valid: true })
      expect(validateFileForStaging(validWebp, limitBytes)).toEqual({ valid: true })
      expect(validateFileForStaging(validSvg, limitBytes)).toEqual({ valid: true })
    })

    it("should reject unsupported mime types", () => {
      const invalidPdf = { name: "doc.pdf", size: 500 * 1024, type: "application/pdf" }
      const invalidMp4 = { name: "video.mp4", size: 1 * 1024 * 1024, type: "video/mp4" }

      expect(validateFileForStaging(invalidPdf, limitBytes).valid).toBe(false)
      expect(validateFileForStaging(invalidPdf, limitBytes).error).toContain("Unsupported file type")
      
      expect(validateFileForStaging(invalidMp4, limitBytes).valid).toBe(false)
      expect(validateFileForStaging(invalidMp4, limitBytes).error).toContain("Unsupported file type")
    })

    it("should reject files exceeding plan limits", () => {
      const bigPng = { name: "huge.png", size: 3 * 1024 * 1024, type: "image/png" }
      
      const result = validateFileForStaging(bigPng, limitBytes)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("exceeds the current plan limit")
    })
  })
})
