"use client";

import { useState, useMemo, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type VariantOption = {
  id: string;
  sku: string;
  pricePaisa: number | null;
  stockCount: number;
  isActive: boolean;
  attributeCombination: Record<string, string>;
};

export type AttributeInfo = {
  name: string;
  displayType: "swatch" | "dropdown" | "radio";
  options: Array<{
    value: string;
    label: string;
    swatchColor?: string;
  }>;
};

interface VariantSelectorProps {
  attributes: AttributeInfo[];
  variants: VariantOption[];
  basePricePaisa: number;
  onVariantSelect: (variant: VariantOption | null) => void;
  disabled?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VariantSelector({
  attributes,
  variants,
  basePricePaisa,
  onVariantSelect,
  disabled = false,
}: VariantSelectorProps) {
  const instanceId = `vs-${Math.random().toString(36).slice(2, 8)}`;
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  // Determine which attribute values are available (have stock + active variants)
  const availableOptions = useMemo(() => {
    const availability: Record<string, Set<string>> = {};
    const activeVariants = variants.filter((v) => v.isActive);

    for (const attr of attributes) {
      availability[attr.name] = new Set<string>();

      for (const opt of attr.options) {
        const hasAvailable = activeVariants.some(
          (v) =>
            v.attributeCombination[attr.name] === opt.value &&
            v.stockCount > 0,
        );
        if (hasAvailable) {
          availability[attr.name].add(opt.value);
        }
      }
    }

    return availability;
  }, [attributes, variants]);

  // Find the currently selected variant
  const selectedVariant = useMemo(() => {
    const keys = Object.keys(selectedOptions);
    if (keys.length !== attributes.length) return null;

    return (
      variants.find(
        (v) =>
          v.isActive &&
          keys.every((key) => v.attributeCombination[key] === selectedOptions[key]),
      ) ?? null
    );
  }, [selectedOptions, variants, attributes.length]);

  // Whether all attributes are selected
  const allSelected = useMemo(
    () => Object.keys(selectedOptions).length === attributes.length,
    [selectedOptions, attributes.length],
  );

  const handleOptionSelect = useCallback(
    (attributeName: string, optionValue: string) => {
      const next = { ...selectedOptions, [attributeName]: optionValue };

      // Deselect if already selected
      if (selectedOptions[attributeName] === optionValue) {
        delete next[attributeName];
      }

      setSelectedOptions(next);

      // Check if full selection is made
      if (Object.keys(next).length === attributes.length) {
        const matched = variants.find(
          (v) =>
            v.isActive &&
            Object.keys(next).every(
              (key) => v.attributeCombination[key] === next[key],
            ),
        );
        onVariantSelect(matched ?? null);
      } else {
        onVariantSelect(null);
      }
    },
    [selectedOptions, attributes.length, variants, onVariantSelect],
  );

  // Price to display
  const displayPrice =
    selectedVariant?.pricePaisa !== null && selectedVariant?.pricePaisa !== undefined
      ? selectedVariant.pricePaisa
      : basePricePaisa;

  return (
    <div className="space-y-4">
      {attributes.map((attr) => (
        <div key={attr.name}>
          <label htmlFor={`${instanceId}-${attr.name}`} className="mb-1.5 block text-sm font-medium text-ink">
            {attr.name}
          </label>

          {attr.displayType === "swatch" && attr.options.length <= 5 ? (
            <div className="flex flex-wrap gap-2">
              {attr.options.map((opt) => {
                const isSelected = selectedOptions[attr.name] === opt.value;
                const isAvailable = availableOptions[attr.name]?.has(opt.value) ?? true;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleOptionSelect(attr.name, opt.value)}
                    disabled={disabled || (!isAvailable && !isSelected)}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all ${
                      isSelected
                        ? "bg-primary text-on-primary"
                        : isAvailable
                          ? "border-hairline-light bg-canvas-light text-ink hover:border-shade-40"
                          : "cursor-not-allowed border-hairline-light bg-canvas-cream text-shade-40 line-through"
                    }`}
                    title={
                      !isAvailable
                        ? `"${opt.label}" is currently unavailable`
                        : opt.label
                    }
                  >
                    {attr.displayType === "swatch" && opt.swatchColor && (
                      <span
                        className="inline-block h-4 w-4 rounded-full border border-hairline-light"
                        style={{ backgroundColor: opt.swatchColor }}
                      />
                    )}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <select
              id={`${instanceId}-${attr.name}`}
              value={selectedOptions[attr.name] ?? ""}
              onChange={(e) => handleOptionSelect(attr.name, e.target.value)}
              disabled={disabled}
              className="w-full rounded-md border border-hairline-light bg-canvas-light px-4 py-2.5 text-sm text-ink focus:border-shade-40 focus:outline-none"
            >
              <option value="">Select {attr.name}...</option>
              {attr.options.map((opt) => {
                const isAvailable =
                  availableOptions[attr.name]?.has(opt.value) ?? true;

                return (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={!isAvailable}
                  >
                    {opt.label}
                    {!isAvailable ? " (Unavailable)" : ""}
                  </option>
                );
              })}
            </select>
          )}
        </div>
      ))}

      {/* Price display */}
      <div className="border-t border-hairline-light pt-3">
        <span className="text-2xl font-bold">
          ৳{(displayPrice / 100).toFixed(2)}
        </span>
        {selectedVariant?.pricePaisa === null && (
          <span className="ml-2 text-xs text-shade-40">(from base price)</span>
        )}
      </div>

      {/* Stock indicator */}
      {selectedVariant && (
        <div className="text-sm">
          {selectedVariant.stockCount > 0 ? (
            <span className="text-green-600">
              In Stock
              {selectedVariant.stockCount <= 10 &&
                ` (Only ${selectedVariant.stockCount} left)`}
            </span>
          ) : (
            <span className="text-red-500">Out of Stock</span>
          )}
          <span className="ml-2 text-xs text-shade-40">
            SKU: {selectedVariant.sku}
          </span>
        </div>
      )}

      {!allSelected && attributes.length > 0 && (
        <p className="text-sm text-amber-600">
          Select all options to add to cart
        </p>
      )}
    </div>
  );
}
