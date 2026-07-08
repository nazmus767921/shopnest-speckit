import { describe, it, expect } from "vitest"
import { merchants, pages } from "@/db/schema"
import { getTableColumns } from "drizzle-orm"

describe("Database Schema Updates (dynamic-templates-v2)", () => {
  it("should have theme_settings column in merchants table", () => {
    const cols = getTableColumns(merchants)
    expect(cols).toHaveProperty("themeSettings")
  })

  it("should have pages table with correct columns", () => {
    const cols = getTableColumns(pages)
    expect(cols).toHaveProperty("id")
    expect(cols).toHaveProperty("merchantId")
    expect(cols).toHaveProperty("slug")
    expect(cols).toHaveProperty("title")
    expect(cols).toHaveProperty("content")
    expect(cols).toHaveProperty("isPublished")
  })
})
