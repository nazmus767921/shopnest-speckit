import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMenuAction, updateMenuAction, deleteMenuAction, saveMenuItemsAction, resetMenuToDefaultsAction } from "@/app/actions/navigation"

const mockGetSession = vi.fn()
const mockGetMerchantByOwnerId = vi.fn()
const mockCreateMenu = vi.fn()
const mockUpdateMenu = vi.fn()
const mockDeleteMenu = vi.fn()
const mockSaveMenuItems = vi.fn()

const mockDbFindFirst = vi.fn()
const mockDbTransaction = vi.fn()

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: () => mockGetSession(),
    },
  },
}))

vi.mock("@/db/queries/merchants", () => ({
  getMerchantByOwnerId: (id: string) => mockGetMerchantByOwnerId(id),
}))

vi.mock("@/db/queries/navigation", () => ({
  createMenu: (data: any) => mockCreateMenu(data),
  updateMenu: (merchantId: string, id: string, data: any) => mockUpdateMenu(merchantId, id, data),
  deleteMenu: (merchantId: string, id: string) => mockDeleteMenu(merchantId, id),
  saveMenuItems: (merchantId: string, menuId: string, items: any[]) => mockSaveMenuItems(merchantId, menuId, items),
}))

vi.mock("@/db", () => ({
  db: {
    query: {
      menus: {
        findFirst: () => mockDbFindFirst(),
      },
    },
    transaction: (cb: any) => mockDbTransaction(cb),
  },
}))

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve({ get: () => "mock-header" }),
}))

describe("Navigation Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mockTxBuilder = {
      where: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    }
    mockDbTransaction.mockImplementation((cb) => cb({
      delete: vi.fn().mockReturnValue(mockTxBuilder),
      insert: vi.fn().mockReturnValue(mockTxBuilder),
    }))
  })

  describe("createMenuAction", () => {
    it("should reject unauthorized request", async () => {
      mockGetSession.mockResolvedValue(null)
      const res = await createMenuAction({ name: "Header Menu", slug: "header-menu" })
      expect(res.success).toBe(false)
      expect(res.error).toContain("Unauthorized")
    })

    it("should reject invalid schema inputs (e.g. invalid slug format)", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-123" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-123" })

      const res = await createMenuAction({ name: "Header Menu", slug: "Invalid Slug!" })
      expect(res.success).toBe(false)
      expect(res.error).toContain("Slug must only contain lowercase letters, numbers, and hyphens")
    })

    it("should create menu with valid inputs", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-123" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-123" })
      mockCreateMenu.mockResolvedValue({ id: "menu-123", name: "Header Menu", slug: "header-menu" })

      const res = await createMenuAction({ name: "Header Menu", slug: "header-menu" })
      expect(res.success).toBe(true)
      expect(res.menu?.id).toBe("menu-123")
    })
  })

  describe("deleteMenuAction", () => {
    it("should prevent deletion of standard menus (main-menu / footer-menu)", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-123" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-123" })
      mockDbFindFirst.mockResolvedValue({ id: "menu-main", slug: "main-menu" })

      const res = await deleteMenuAction("menu-main")
      expect(res.success).toBe(false)
      expect(res.error).toContain("Standard menus cannot be deleted")
      expect(mockDeleteMenu).not.toHaveBeenCalled()
    })

    it("should allow deletion of custom menus", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-123" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-123" })
      mockDbFindFirst.mockResolvedValue({ id: "menu-custom", slug: "custom-menu" })

      const res = await deleteMenuAction("menu-custom")
      expect(res.success).toBe(true)
      expect(mockDeleteMenu).toHaveBeenCalledWith("merchant-123", "menu-custom")
    })
  })

  describe("resetMenuToDefaultsAction", () => {
    it("should reset main-menu items to default values", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-123" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-123" })
      mockDbFindFirst.mockResolvedValue({ id: "menu-main", slug: "main-menu" })

      const res = await resetMenuToDefaultsAction("menu-main")
      expect(res.success).toBe(true)
      expect(mockDbTransaction).toHaveBeenCalled()
    })

    it("should reject reset for custom menus", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-123" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-123" })
      mockDbFindFirst.mockResolvedValue({ id: "menu-custom", slug: "custom-menu" })

      const res = await resetMenuToDefaultsAction("menu-custom")
      expect(res.success).toBe(false)
      expect(res.error).toContain("Only standard menus can be reset to defaults")
    })
  })

  describe("saveMenuItemsAction", () => {
    it("should reject menu items validation if label is too long (over 30 chars)", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-123" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-123" })

      const longLabelItem = {
        id: "d3b07384-d113-4ec5-a5fb-10610c1bb0d0",
        label: "This label is definitely longer than thirty characters",
        type: "url" as const,
        url: "https://google.com",
        position: 0,
      }

      const res = await saveMenuItemsAction("menu-123", [longLabelItem])
      expect(res.success).toBe(false)
      expect(res.error).toContain("Label must be 30 characters or less")
    })

    it("should save valid menu items list", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-123" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-123" })
      mockSaveMenuItems.mockResolvedValue([{ id: "item-123" }])

      const validItem = {
        id: "d3b07384-d113-4ec5-a5fb-10610c1bb0d0",
        label: "About Us",
        type: "url" as const,
        url: "/about",
        position: 0,
      }

      const res = await saveMenuItemsAction("menu-123", [validItem])
      expect(res.success).toBe(true)
      expect(mockSaveMenuItems).toHaveBeenCalledWith("merchant-123", "menu-123", expect.any(Array))
    })
  })
})
