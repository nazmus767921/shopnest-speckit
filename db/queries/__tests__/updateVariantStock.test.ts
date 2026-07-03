/**
 * US4 — Variant Stock Tracking Tests
 *
 * T048–T049: updateVariantStock atomic decrement
 *
 * @see specs/20-product-variants-metadata/spec.md#US4
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB: chainable Drizzle API ──────────────────────────────────────────
// vi.hoisted() ensures mock functions are created before vi.mock factory runs.

const { mockReturning, mockWhere, mockSet, mockUpdate } = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockWhere = vi.fn(() => ({ returning: mockReturning }));
  const mockSet = vi.fn(() => ({ where: mockWhere }));
  const mockUpdate = vi.fn(() => ({ set: mockSet }));
  return { mockReturning, mockWhere, mockSet, mockUpdate };
});

vi.mock("@/db", () => ({
  db: { update: mockUpdate },
}));

import { updateVariantStock } from "@/db/queries/variants";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateVariantStock — T048/T049", () => {
  it("T048 — should return true when sufficient stock exists", async () => {
    mockReturning.mockResolvedValueOnce([{ id: "v1" }]);

    const result = await updateVariantStock("v1", 3);

    expect(result).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });

  it("T049 — should return false when insufficient stock", async () => {
    mockReturning.mockResolvedValueOnce([]);

    const result = await updateVariantStock("v1", 999);

    expect(result).toBe(false);
  });

  it("should return false when variant does not exist", async () => {
    mockReturning.mockResolvedValueOnce([]);

    const result = await updateVariantStock("nonexistent", 1);

    expect(result).toBe(false);
  });
});
