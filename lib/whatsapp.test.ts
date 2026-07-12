import { describe, it, expect } from "vitest";
import { parseWhatsAppUrl } from "./utils";

describe("parseWhatsAppUrl", () => {
  it("should return empty string for empty input", () => {
    expect(parseWhatsAppUrl("")).toBe("");
    expect(parseWhatsAppUrl(undefined as any)).toBe("");
  });

  it("should correctly handle full URLs", () => {
    expect(parseWhatsAppUrl("https://wa.me/123456789")).toBe("https://wa.me/123456789");
    expect(parseWhatsAppUrl("http://wa.me/123456789")).toBe("http://wa.me/123456789");
    expect(parseWhatsAppUrl("https://api.whatsapp.com/send?phone=123456789")).toBe("https://api.whatsapp.com/send?phone=123456789");
    expect(parseWhatsAppUrl("https://example.com/wa")).toBe("https://example.com/wa");
  });

  it("should strip non-numeric characters and format as a wa.me link for raw phone numbers", () => {
    expect(parseWhatsAppUrl("+1 (555) 123-4567")).toBe("https://wa.me/15551234567");
    expect(parseWhatsAppUrl("01712-345678")).toBe("https://wa.me/01712345678");
    expect(parseWhatsAppUrl("880 1712 345678")).toBe("https://wa.me/8801712345678");
  });
});
