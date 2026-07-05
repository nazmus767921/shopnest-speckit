import { describe, it, expect, vi, afterEach } from "vitest"
import { render, fireEvent, cleanup } from "@testing-library/react"
import * as React from "react"
import { VariantSelector } from "@/components/storefront/variant-selector/VariantSelector"
import type { AttributeInfo, VariantOption } from "@/components/storefront/variant-selector/VariantSelector"

afterEach(() => {
  cleanup()
})

const mockAttributes: AttributeInfo[] = [
  {
    name: "Color",
    displayType: "swatch",
    options: [
      { value: "red", label: "Red", swatchColor: "#FF0000" },
      { value: "blue", label: "Blue", swatchColor: "#0000FF" },
    ],
  },
  {
    name: "Size",
    displayType: "radio",
    options: [
      { value: "sm", label: "Small" },
      { value: "md", label: "Medium" },
    ],
  },
]

const mockVariants: VariantOption[] = [
  {
    id: "v-red-sm",
    sku: "SKU-RED-SM",
    pricePaisa: 100000, // ৳1000.00
    stockCount: 10,
    isActive: true,
    attributeCombination: { Color: "red", Size: "sm" },
  },
  {
    id: "v-red-md",
    sku: "SKU-RED-MD",
    pricePaisa: 120000, // ৳1200.00
    stockCount: 5,
    isActive: true,
    attributeCombination: { Color: "red", Size: "md" },
  },
]

describe("VariantSelector Component - Storefront Custom Themes", () => {
  it("renders color options as circular swatches with checkmarks when active", () => {
    const handleSelect = vi.fn()
    const { getByRole, container } = render(
      <VariantSelector
        attributes={mockAttributes}
        variants={mockVariants}
        basePricePaisa={90000}
        onVariantSelect={handleSelect}
      />
    )

    // Click Red color button
    const redButton = getByRole("button", { name: /Red/i })
    expect(redButton).toBeTruthy()

    // Before selection, checkmark shouldn't be visible (or active swatch state)
    // Click to select
    fireEvent.click(redButton)

    // Verify swatch checkmark indicator is rendered in the active swatch
    // Let's assert that there is a checkmark svg/icon inside or adjacent to the active swatch button
    const checkmark = container.querySelector(".swatch-checkmark")
    expect(checkmark).toBeTruthy()
  })

  it("renders size options as pill-shaped buttons that reverse colors when active", () => {
    const handleSelect = vi.fn()
    const { getByRole } = render(
      <VariantSelector
        attributes={mockAttributes}
        variants={mockVariants}
        basePricePaisa={90000}
        onVariantSelect={handleSelect}
      />
    )

    // Click Small size button
    const smallButton = getByRole("button", { name: /Small/i })
    expect(smallButton).toBeTruthy()

    // Click to select
    fireEvent.click(smallButton)

    // Assert that the active size button gets reversed style (black bg, white text)
    // We expect class names like "bg-primary text-on-primary" or active-pill states
    expect(smallButton.className).toContain("bg-primary")
    expect(smallButton.className).toContain("text-on-primary")
  })
})
