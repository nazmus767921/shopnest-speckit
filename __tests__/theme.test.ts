import { describe, it, expect } from "vitest"
import { getThemeVariables } from "@/lib/theme"

describe("Theme Variables Generation", () => {
  it("should generate correct CSS variables from theme settings", () => {
    const settings = {
      colors: {
        primary: "#ff0000",
        background: "#000000",
      },
      layout: {
        borderRadius: "md" as const,
      }
    }

    const style = getThemeVariables(settings)
    expect(style).toHaveProperty("--color-primary", "#ff0000")
    expect(style).toHaveProperty("--color-background", "#000000")
    expect(style).toHaveProperty("--radius", "0.5rem")
  })

  it("should return empty object if no settings provided", () => {
    const style = getThemeVariables(null)
    expect(style).toEqual({})
  })
})
