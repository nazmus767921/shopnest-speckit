import { describe, it, expect, vi, beforeEach } from "vitest"
import { applyTemplateAction, getAvailableTemplatesAction } from "@/app/actions/settings"
import { updateTemplateAction, toggleTemplateActiveAction } from "@/app/actions/admin"
import { resolveAndAssignTemplate } from "@/app/(auth)/onboarding/actions"

// Mock the dependencies
const mockGetActiveTemplates = vi.fn()
const mockGetTemplateBySlug = vi.fn()
const mockResolveTemplateForBusinessType = vi.fn()
const mockGetMerchantPlan = vi.fn()
const mockGetMerchantByOwnerId = vi.fn()
const mockUpdateStorefrontLayout = vi.fn()
const mockGetSession = vi.fn()

const mockDbFindFirst = vi.fn()
const mockDbUpdate = vi.fn()
const mockDbTransaction = vi.fn()

const mockBuilder = {
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([{ id: "mock-id" }]),
}

vi.mock("@/db/queries/templates", () => ({
  getActiveTemplates: () => mockGetActiveTemplates(),
  getTemplateBySlug: (slug: string) => mockGetTemplateBySlug(slug),
  resolveTemplateForBusinessType: (biz: string, tier: string) => mockResolveTemplateForBusinessType(biz, tier),
}))

vi.mock("@/lib/plans/getPlan", () => ({
  getMerchantPlan: (id: string) => mockGetMerchantPlan(id),
}))

vi.mock("@/db/queries/merchants", () => ({
  getMerchantByOwnerId: (id: string) => mockGetMerchantByOwnerId(id),
  updateStorefrontLayout: (id: string, data: any) => mockUpdateStorefrontLayout(id, data),
}))

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: () => mockGetSession(),
    },
  },
}))

vi.mock("@/db", () => ({
  db: {
    query: {
      storeTemplates: {
        findFirst: () => mockDbFindFirst(),
      },
      merchants: {
        findFirst: () => mockDbFindFirst(),
      },
    },
    update: () => mockDbUpdate(),
    transaction: (cb: any) => mockDbTransaction(cb),
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve({ get: () => "mock-header" }),
}))

describe("Templates Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDbUpdate.mockReturnValue(mockBuilder)
    mockDbTransaction.mockImplementation((cb) => cb({ update: () => mockBuilder }))
  })

  describe("getAvailableTemplatesAction", () => {
    it("should return active templates with lock status based on merchant tier", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-123" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-123", plan: "starter" })
      mockGetMerchantPlan.mockResolvedValue({ slug: "starter" })
      mockGetActiveTemplates.mockResolvedValue([
        { id: "general", slug: "general", allowedTiers: ["starter", "growth", "pro"] },
        { id: "fashion", slug: "fashion", allowedTiers: ["growth", "pro"] }
      ])

      const res = await getAvailableTemplatesAction()
      expect(res.success).toBe(true)
      expect(res.templates).toHaveLength(2)
      expect(res.templates![0].isLocked).toBe(false) // general
      expect(res.templates![1].isLocked).toBe(true)  // fashion is locked for starter
    })
  })

  describe("applyTemplateAction", () => {
    it("should allow applying template if merchant plan is in allowedTiers", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-123" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-123", plan: "growth" })
      mockGetMerchantPlan.mockResolvedValue({ slug: "growth" })
      mockGetTemplateBySlug.mockResolvedValue({
        id: "fashion",
        slug: "fashion",
        name: "Fashion",
        allowedTiers: ["growth", "pro"],
        isActive: true,
      })
      mockUpdateStorefrontLayout.mockResolvedValue({ id: "merchant-123", template: "fashion" })

      const res = await applyTemplateAction("fashion")
      expect(res.success).toBe(true)
      expect(mockUpdateStorefrontLayout).toHaveBeenCalled()
    })

    it("should reject applying template if merchant plan is not in allowedTiers", async () => {
      mockGetSession.mockResolvedValue({ user: { id: "user-123" } })
      mockGetMerchantByOwnerId.mockResolvedValue({ id: "merchant-123", plan: "starter" })
      mockGetMerchantPlan.mockResolvedValue({ slug: "starter" })
      mockGetTemplateBySlug.mockResolvedValue({
        id: "fashion",
        slug: "fashion",
        name: "Fashion",
        allowedTiers: ["growth", "pro"],
        isActive: true,
      })

      const res = await applyTemplateAction("fashion")
      expect(res.success).toBe(false)
      expect(res.error).toContain("does not support")
      expect(mockUpdateStorefrontLayout).not.toHaveBeenCalled()
    })
  })

  describe("Superadmin updateTemplateAction", () => {
    it("should allow updating template if user is admin", async () => {
      mockGetSession.mockResolvedValue({ user: { role: "admin", email: "admin@shopnest.com.bd" } })
      mockDbFindFirst.mockResolvedValue({ id: "fashion", isDefault: false })

      const res = await updateTemplateAction({
        id: "fashion",
        name: "New Fashion",
        businessTypes: ["clothing"],
        allowedTiers: ["growth"],
        isActive: true,
        isDefault: false,
      })

      expect(res.success).toBe(true)
    })

    it("should reject if default template is set to inactive", async () => {
      mockGetSession.mockResolvedValue({ user: { role: "admin" } })

      const res = await updateTemplateAction({
        id: "fashion",
        name: "New Fashion",
        businessTypes: ["clothing"],
        allowedTiers: ["growth"],
        isActive: false,
        isDefault: true,
      })

      expect(res.success).toBe(false)
      expect(res.error).toContain("must be active")
    })

    it("should reject if user is not admin", async () => {
      mockGetSession.mockResolvedValue({ user: { role: "merchant" } })

      const res = await updateTemplateAction({
        id: "fashion",
        name: "New Fashion",
        businessTypes: ["clothing"],
        allowedTiers: ["growth"],
        isActive: true,
        isDefault: false,
      })

      expect(res.success).toBe(false)
      expect(res.error).toContain("restricted to platform admins")
    })
  })

  describe("Superadmin toggleTemplateActiveAction", () => {
    it("should reject deactivating default template", async () => {
      mockGetSession.mockResolvedValue({ user: { role: "admin" } })
      mockDbFindFirst.mockResolvedValue({ id: "general", isDefault: true })

      const res = await toggleTemplateActiveAction({
        id: "general",
        isActive: false,
      })

      expect(res.success).toBe(false)
      expect(res.error).toContain("Cannot deactivate the default template")
    })
  })

  describe("resolveAndAssignTemplate Action", () => {
    it("should successfully resolve and assign template based on business type and tier", async () => {
      // Mock db findFirst to return the merchant
      mockDbFindFirst.mockResolvedValueOnce({
        id: "merchant-123",
        plan: "growth"
      })

      mockResolveTemplateForBusinessType.mockResolvedValueOnce({
        id: "fashion",
        slug: "fashion",
        isActive: true,
      })

      const res = await resolveAndAssignTemplate("merchant-123", "clothing")
      expect(res.success).toBe(true)
      expect(res.template).toBe("fashion")
    })

    it("should fail if merchant does not exist", async () => {
      mockDbFindFirst.mockResolvedValueOnce(null)

      const res = await resolveAndAssignTemplate("non-existent", "clothing")
      expect(res.success).toBe(false)
      expect(res.error).toContain("Merchant not found")
    })
  })
})
