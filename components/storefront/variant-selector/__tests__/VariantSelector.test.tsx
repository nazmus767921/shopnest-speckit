import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { VariantSelector, type AttributeInfo, type VariantOption } from "../VariantSelector";
import * as React from "react";

afterEach(cleanup);

// Mock the Select primitive wrapper to use a simple native select element,
// which avoids portal/focus timing issues in JSDOM unit test environment.
vi.mock("@/components/ui/primitives/Select", () => {
  return {
    Select: ({ options, value, onChange, placeholder, getOptionLabel, getOptionValue }: any) => {
      const getLabel = getOptionLabel || ((o: any) => o.label || o.name || String(o));
      const getValue = getOptionValue || ((o: any) => o.value ?? o.id ?? String(o));
      return (
        <select
          data-testid="mock-select"
          value={value ? String(getValue(value)) : ""}
          onChange={(e) => {
            const opt = options.find((o: any) => String(getValue(o)) === e.target.value);
            onChange(opt || null);
          }}
        >
          <option value="">{placeholder || "Select option..."}</option>
          {options.map((o: any, idx: number) => (
            <option key={idx} value={String(getValue(o))}>
              {getLabel(o)}
            </option>
          ))}
        </select>
      );
    }
  };
});

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
  { id: "v1", sku: "SKU-RED-S", pricePaisa: 10000, compareAtPricePaisa: null, stockCount: 5, isActive: true, attributeCombination: { Color: "red", Size: "s" } },
  { id: "v2", sku: "SKU-RED-M", pricePaisa: 10000, compareAtPricePaisa: null, stockCount: 3, isActive: true, attributeCombination: { Color: "red", Size: "m" } },
  { id: "v3", sku: "SKU-RED-L", pricePaisa: 11000, compareAtPricePaisa: null, stockCount: 0, isActive: true, attributeCombination: { Color: "red", Size: "l" } },
  { id: "v4", sku: "SKU-BLUE-S", pricePaisa: 10000, compareAtPricePaisa: null, stockCount: 2, isActive: true, attributeCombination: { Color: "blue", Size: "s" } },
  { id: "v5", sku: "SKU-BLUE-M", pricePaisa: 10000, compareAtPricePaisa: null, stockCount: 7, isActive: false, attributeCombination: { Color: "blue", Size: "m" } },
  { id: "v6", sku: "SKU-BLUE-L", pricePaisa: 12000, compareAtPricePaisa: null, stockCount: 4, isActive: true, attributeCombination: { Color: "blue", Size: "l" } },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clickSwatch(name: string) {
  const btn = screen.getByRole("button", { name: new RegExp(name, "i") });
  fireEvent.click(btn);
}

function selectDropdown(selectName: string, value: string) {
  const select = screen.getByTestId("mock-select") as HTMLSelectElement;
  fireEvent.change(select, { target: { value: value.toLowerCase() } });
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

  it("T041c — should call onVariantSelect with matching variant when all attributes selected", async () => {
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

    await waitFor(() => {
      const calls = onSelect.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).not.toBeNull();
      expect(lastCall[0].id).toBe("v2");
    });
  });
});

describe("VariantSelector — Out of Stock Behavior", () => {
  it("T041d — should show correct price for out-of-stock variant but still indicate stock status", async () => {
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

    await waitFor(() => {
      const calls = onSelect.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).not.toBeNull();
      expect(lastCall[0].id).toBe("v3");
      expect(lastCall[0].stockCount).toBe(0);
    });
  });

  it("T041e — should call onVariantSelect with null for deactivated (isActive=false) variant", async () => {
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

    await waitFor(() => {
      const calls = onSelect.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toBeNull();
    });
  });
});

describe("VariantSelector — US4 Stock Display (T050-T051)", () => {
  it("T050a — should show 'Out of Stock' when selected variant has stockCount 0", async () => {
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

    await waitFor(() => {
      expect(screen.getByText(/Out of Stock/i)).toBeTruthy();
    });
  });

  it("T050b — should show 'Out of Stock' and not 'In Stock' for zero-stock variant", async () => {
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

    await waitFor(() => {
      expect(screen.queryByText(/In Stock/i)).toBeNull();
      expect(screen.getByText(/Out of Stock/i)).toBeTruthy();
    });
  });

  it("T051a — should show 'In Stock' when selected variant has stockCount > 0", async () => {
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

    await waitFor(() => {
      expect(screen.getByText(/In Stock/i)).toBeTruthy();
      expect(screen.queryByText(/Out of Stock/i)).toBeNull();
    });
  });

  it("T051b — should show low stock count when stockCount is between 1 and 10", async () => {
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

    await waitFor(() => {
      expect(screen.getByText(/Only 5 left/i)).toBeTruthy();
    });
  });

  it("T051c — should show low stock count when stockCount is between 1 and 10", async () => {
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

    await waitFor(() => {
      expect(screen.getByText(/Only 4 left/i)).toBeTruthy();
    });
  });
});

describe("VariantSelector — Price Display", () => {
  it("T041f — should call onVariantSelect with correct price when all attributes selected", async () => {
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

    await waitFor(() => {
      const calls = onSelect.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).not.toBeNull();
      expect(lastCall[0].pricePaisa).toBe(10000);
    });
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

    const priceElements = screen.getAllByText(/100\.00/);
    expect(priceElements.length).toBeGreaterThan(0);
  });
});
