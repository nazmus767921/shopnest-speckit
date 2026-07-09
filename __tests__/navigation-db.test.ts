import { describe, it, expect } from "vitest"
import { menus, menuItems } from "@/db/schema"
import { getTableColumns } from "drizzle-orm"

describe("Navigation Database Schema", () => {
  it("should have menus table with correct columns", () => {
    const cols = getTableColumns(menus)
    expect(cols).toHaveProperty("id")
    expect(cols).toHaveProperty("merchantId")
    expect(cols).toHaveProperty("name")
    expect(cols).toHaveProperty("slug")
    expect(cols).toHaveProperty("createdAt")
    expect(cols).toHaveProperty("updatedAt")
  })

  it("should have menuItems table with correct columns", () => {
    const cols = getTableColumns(menuItems)
    expect(cols).toHaveProperty("id")
    expect(cols).toHaveProperty("menuId")
    expect(cols).toHaveProperty("parentId")
    expect(cols).toHaveProperty("label")
    expect(cols).toHaveProperty("type")
    expect(cols).toHaveProperty("referenceId")
    expect(cols).toHaveProperty("url")
    expect(cols).toHaveProperty("position")
    expect(cols).toHaveProperty("createdAt")
    expect(cols).toHaveProperty("updatedAt")
  })
})
