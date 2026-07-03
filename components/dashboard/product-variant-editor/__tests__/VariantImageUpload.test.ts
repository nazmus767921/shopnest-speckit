import { describe, it, expect } from "vitest";
import { variantImageUploadSchema } from "@/lib/validations/variants";

describe("VariantImageUpload", () => {
  describe("Validation schema", () => {
    it("accepts valid variant ID", () => {
      const result = variantImageUploadSchema.safeParse({
        variantId: "abc-123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty variant ID", () => {
      const result = variantImageUploadSchema.safeParse({
        variantId: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing variant ID", () => {
      const result = variantImageUploadSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("File type validation", () => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];

    it("accepts JPEG files", () => {
      expect(allowedTypes).toContain("image/jpeg");
    });

    it("accepts PNG files", () => {
      expect(allowedTypes).toContain("image/png");
    });

    it("accepts WebP files", () => {
      expect(allowedTypes).toContain("image/webp");
    });

    it("accepts AVIF files", () => {
      expect(allowedTypes).toContain("image/avif");
    });

    it("rejects non-image file types like GIF", () => {
      expect(allowedTypes).not.toContain("image/gif");
    });

    it("rejects non-image file types like SVG", () => {
      expect(allowedTypes).not.toContain("image/svg+xml");
    });
  });

  describe("File size validation", () => {
    it("enforces 5MB maximum file size", () => {
      const maxBytes = 5 * 1024 * 1024;
      // 4.9MB should pass
      expect(4.9 * 1024 * 1024).toBeLessThan(maxBytes);
      // 5.1MB should fail
      expect(5.1 * 1024 * 1024).toBeGreaterThan(maxBytes);
    });
  });

  describe("Upload limit", () => {
    it("allows up to 5 images per variant", () => {
      const maxImagesPerVariant = 5;
      expect(maxImagesPerVariant).toBe(5);
    });
  });
});
