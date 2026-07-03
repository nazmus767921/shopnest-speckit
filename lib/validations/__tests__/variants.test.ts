import { describe, it, expect } from "vitest";
import {
  attributeSchema,
  saveAttributesSchema,
  metadataEntrySchema,
  saveMetadataSchema,
} from "../variants";

// ─── attributeSchema ─────────────────────────────────────────────────────────

describe("attributeSchema", () => {
  it("should accept valid attribute with options (T015)", () => {
    const result = attributeSchema.safeParse({
      name: "Color",
      displayType: "swatch",
      options: [
        { label: "Red", value: "red", swatchColor: "#FF0000" },
        { label: "Blue", value: "blue" },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("should reject empty attribute name", () => {
    const result = attributeSchema.safeParse({
      name: "",
      options: [{ label: "Red", value: "red" }],
    });

    expect(result.success).toBe(false);
  });

  it("should reject more than 10 options (T016)", () => {
    const options = Array.from({ length: 11 }, (_, i) => ({
      label: `Option ${i}`,
      value: `option-${i}`,
    }));

    const result = attributeSchema.safeParse({
      name: "Color",
      options,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("10");
    }
  });

  it("should default displayType to dropdown", () => {
    const result = attributeSchema.safeParse({
      name: "Size",
      options: [{ label: "S", value: "s" }],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayType).toBe("dropdown");
    }
  });

  it("should reject invalid displayType", () => {
    const result = attributeSchema.safeParse({
      name: "Size",
      displayType: "checkbox",
      options: [{ label: "S", value: "s" }],
    });

    expect(result.success).toBe(false);
  });
});

// ─── saveAttributesSchema ────────────────────────────────────────────────────

describe("saveAttributesSchema", () => {
  it("should reject more than 3 attributes", () => {
    const attributes = Array.from({ length: 4 }, (_, i) => ({
      name: `Attr ${i}`,
      options: [{ label: "Default", value: "default" }],
    }));

    const result = saveAttributesSchema.safeParse({
      productId: "prod-1",
      attributes,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("3");
    }
  });

  it("should reject empty attributes array", () => {
    const result = saveAttributesSchema.safeParse({
      productId: "prod-1",
      attributes: [],
    });

    expect(result.success).toBe(false);
  });
});

// ─── metadataEntrySchema ─────────────────────────────────────────────────────

describe("metadataEntrySchema", () => {
  it("should accept valid metadata entry", () => {
    const result = metadataEntrySchema.safeParse({
      key: "Fabric",
      value: "Cotton",
    });

    expect(result.success).toBe(true);
  });

  it("should reject empty key (T029)", () => {
    const result = metadataEntrySchema.safeParse({
      key: "",
      value: "Cotton",
    });

    expect(result.success).toBe(false);
  });

  it("should reject empty value (T029)", () => {
    const result = metadataEntrySchema.safeParse({
      key: "Fabric",
      value: "",
    });

    expect(result.success).toBe(false);
  });
});

// ─── saveMetadataSchema ──────────────────────────────────────────────────────

describe("saveMetadataSchema", () => {
  it("should reject more than 20 entries (T028)", () => {
    const metadata = Array.from({ length: 21 }, (_, i) => ({
      key: `key-${i}`,
      value: `value-${i}`,
    }));

    const result = saveMetadataSchema.safeParse({
      productId: "prod-1",
      metadata,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("20");
    }
  });
});
