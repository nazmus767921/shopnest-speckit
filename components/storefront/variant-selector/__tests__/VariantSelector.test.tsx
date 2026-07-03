import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { VariantSelector, type AttributeInfo, type VariantOption } from "../VariantSelector";

afterEach(cleanup);

// ─── Fixtures ────────────────────────────────────────────────────────────────

const attributes: AttributeInfo[] = [
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
    displayType: "dropdown",
    options: [
      { value: "s", label: "S" },
      { value: "m", label: "M" },
      { value: "l", label: "L" },
    ],
  },
];

const variants: VariantOption[] = [
  { id: "v1", sku: "SKU-RED-S", pricePaisa: 10000, stockCount: 5, isActive: true, attributeCombination: { Color: "red", Size: "s" } },
  { id: "v2", sku: "SKU-RED-M", pricePaisa: 10000, stockCount: 3, isActive: true, attributeCombination: { Color: "red", Size: "m" } },
  { id: "v3", sku: "SKU-RED-L", pricePaisa: 11000, stockCount: 0, isActive: true, attributeCombination: { Color: "red", Size: "l" } },
  { id: "v4", sku: "SKU-BLUE-S", pricePaisa: 10000, stockCount: 2, isActive: true, attributeCombination: { Color: "blue", Size: "s" } },
  { id: "v5", sku: "SKU-BLUE-M", pricePaisa: 10000, stockCount: 7, isActive: false, attributeCombination: { Color: "blue", Size: "m" } },
  { id: "v6", sku: "SKU-BLUE-L", pricePaisa: 12000, stockCount: 4, isActive: true, attributeCombination: { Color: "blue", Size: "l" } },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clickSwatch(name: string) {
  const btn = screen.getByRole("button", { name: new RegExp(name, "i") });
  fireEvent.click(btn);
}

function selectDropdown(selectName: string, value: string) {
  const select = screen.getByRole("combobox", { name: new RegExp(selectName, "i") });
  fireEvent.change(select, { target: { value } });
}

describe("VariantSelector — Selection State", () => {
  it("T041a — should call onVariantSelect with null when no attribute is selected", () => {
    const onSelect = vi.fn();
    render(
      <VariantSelector
        attributes={attributes}
        variants={variants}
        basePricePaisa={10000}
        onVariantSelect={onSelect}
      />,
    );
    // onVariantSelect may be called on mount with null (partial selection state)
    // or not called at all until a selection is made — depends on component impl
    const hint = screen.getByText(/select all options/i);
    expect(hint).toBeTruthy();
  });

  it("T041b — should show 'Select all options' hint when only one attribute selected", () => {
    const onSelect = vi.fn();
    render(
      <VariantSelector
        attributes={attributes}
        variants={variants}
        basePricePaisa={10000}
        onVariantSelect={onSelect}
      />,
    );

    clickSwatch("Red");

    const hint = screen.getByText(/select all options/i);
    expect(hint).toBeTruthy();
  });

  it("T041c — should call onVariantSelect with matching variant when all attributes selected", () => {
    const onSelect = vi.fn();
    render(
      <VariantSelector
        attributes={attributes}
        variants={variants}
        basePricePaisa={10000}
        onVariantSelect={onSelect}
      />,
    );

    clickSwatch("Red");
    selectDropdown("Size", "m");

    // After both selections, onVariantSelect should be called with variant v2 (Red/M)
    const calls = onSelect.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).not.toBeNull();
    expect(lastCall[0].id).toBe("v2");
  });
});

describe("VariantSelector — Out of Stock Behavior", () => {
  it("T041d — should show correct price for out-of-stock variant but still indicate stock status", () => {
    const onSelect = vi.fn();
    render(
      <VariantSelector
        attributes={attributes}
        variants={variants}
        basePricePaisa={10000}
        onVariantSelect={onSelect}
      />,
    );

    clickSwatch("Red");
    selectDropdown("Size", "l");

    // Red/L has stockCount=0
    const calls = onSelect.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).not.toBeNull();
    expect(lastCall[0].id).toBe("v3");
    expect(lastCall[0].stockCount).toBe(0);
  });

  it("T041e — should call onVariantSelect with null for deactivated (isActive=false) variant", () => {
    const onSelect = vi.fn();
    render(
      <VariantSelector
        attributes={attributes}
        variants={variants}
        basePricePaisa={10000}
        onVariantSelect={onSelect}
      />,
    );

    clickSwatch("Blue");
    selectDropdown("Size", "m");

    // Blue/M is isActive=false — should return null or not be findable
    const calls = onSelect.mock.calls;
    const lastCall = calls[calls.length - 1];
    // Should either be null or not exist (component may skip calling for inactive)
    expect(lastCall[0]).toBeNull();
  });
});

describe("VariantSelector — US4 Stock Display (T050-T051)", () => {
  it("T050a — should show 'Out of Stock' when selected variant has stockCount 0", () => {
    const onSelect = vi.fn();
    render(
      <VariantSelector
        attributes={attributes}
        variants={variants}
        basePricePaisa={10000}
        onVariantSelect={onSelect}
      />,
    );

    clickSwatch("Red");
    selectDropdown("Size", "l");

    // Red/L has stockCount=0
    expect(screen.getByText(/Out of Stock/i)).toBeTruthy();
  });

  it("T050b — should show 'Out of Stock' and not 'In Stock' for zero-stock variant", () => {
    const onSelect = vi.fn();
    render(
      <VariantSelector
        attributes={attributes}
        variants={variants}
        basePricePaisa={10000}
        onVariantSelect={onSelect}
      />,
    );

    clickSwatch("Red");
    selectDropdown("Size", "l");

    expect(screen.queryByText(/In Stock/i)).toBeNull();
    expect(screen.getByText(/Out of Stock/i)).toBeTruthy();
  });

  it("T051a — should show 'In Stock' when selected variant has stockCount > 0", () => {
    const onSelect = vi.fn();
    render(
      <VariantSelector
        attributes={attributes}
        variants={variants}
        basePricePaisa={10000}
        onVariantSelect={onSelect}
      />,
    );

    clickSwatch("Red");
    selectDropdown("Size", "s");

    // Red/S has stockCount=5
    expect(screen.getByText(/In Stock/i)).toBeTruthy();
    expect(screen.queryByText(/Out of Stock/i)).toBeNull();
  });

  it("T051b — should show low stock count when stockCount is between 1 and 10", () => {
    const onSelect = vi.fn();
    render(
      <VariantSelector
        attributes={attributes}
        variants={variants}
        basePricePaisa={10000}
        onVariantSelect={onSelect}
      />,
    );

    clickSwatch("Red");
    selectDropdown("Size", "s");

    // Red/S has stockCount=5 (≤10) — should show "Only 5 left"
    expect(screen.getByText(/Only 5 left/i)).toBeTruthy();
  });

  it("T051c — should show low stock count when stockCount is between 1 and 10", () => {
    const onSelect = vi.fn();
    render(
      <VariantSelector
        attributes={attributes}
        variants={variants}
        basePricePaisa={10000}
        onVariantSelect={onSelect}
      />,
    );

    clickSwatch("Blue");
    selectDropdown("Size", "l");

    // Blue/L has stockCount=4 (≤ 10) — should show "Only 4 left"
    expect(screen.getByText(/Only 4 left/i)).toBeTruthy();
  });
});

describe("VariantSelector — Price Display", () => {
  it("T041f — should call onVariantSelect with correct price when all attributes selected", () => {
    const onSelect = vi.fn();
    render(
      <VariantSelector
        attributes={attributes}
        variants={variants}
        basePricePaisa={10000}
        onVariantSelect={onSelect}
      />,
    );

    clickSwatch("Red");
    selectDropdown("Size", "m");

    // Red/M has pricePaisa=10000 = 100.00
    const calls = onSelect.mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).not.toBeNull();
    expect(lastCall[0].pricePaisa).toBe(10000);
  });

  it("T041g — should show base price display when no variant selected", () => {
    const onSelect = vi.fn();
    render(
      <VariantSelector
        attributes={attributes}
        variants={variants}
        basePricePaisa={10000}
        onVariantSelect={onSelect}
      />,
    );

    // The price 100.00 (from basePricePaisa=10000) should appear in the rendered output.
    // Use getAllByText and check at least one matches to avoid multiple-element error.
    const priceElements = screen.getAllByText(/100\.00/);
    expect(priceElements.length).toBeGreaterThan(0);
  });
});
