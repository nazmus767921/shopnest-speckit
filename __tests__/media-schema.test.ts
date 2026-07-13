import { describe, it, expect } from "vitest"
import { getTableColumns } from "drizzle-orm"
// We will import mediaFiles and mediaFolders once they are created in schema.ts
// For TDD, this test will fail initially because they don't exist yet.
import * as schema from "@/db/schema"

describe("Media Management Database Schema", () => {
  it("should have media_folders table with merchantId isolation", () => {
    // @ts-expect-error TDD - table not yet created
    const cols = getTableColumns(schema.mediaFolders)
    expect(cols).toHaveProperty("id")
    expect(cols).toHaveProperty("merchantId")
    expect(cols).toHaveProperty("name")
    expect(cols).toHaveProperty("slug")
  })

  it("should have media_files table with merchantId isolation", () => {
    // @ts-expect-error TDD - table not yet created
    const cols = getTableColumns(schema.mediaFiles)
    expect(cols).toHaveProperty("id")
    expect(cols).toHaveProperty("merchantId")
    expect(cols).toHaveProperty("url")
    expect(cols).toHaveProperty("key")
    expect(cols).toHaveProperty("name")
    expect(cols).toHaveProperty("size")
    expect(cols).toHaveProperty("type")
    expect(cols).toHaveProperty("folder")
    expect(cols).toHaveProperty("uploadedById")
  })
})
