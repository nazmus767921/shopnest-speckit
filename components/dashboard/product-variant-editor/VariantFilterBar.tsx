"use client";

import { useCallback, useState, useId, useMemo } from "react";
import { Search, X } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type FilterCriteria = {
  skuQuery: string;
  stockFilter: "all" | "in_stock" | "out_of_stock" | "low_stock";
  statusFilter: "all" | "active" | "inactive";
  attributeFilters: Record<string, string>; // attribute name → option value
};

interface VariantFilterBarProps {
  attributes: Array<{ name: string; options: Array<{ value: string; label: string }> }>;
  onFilterChange: (filters: FilterCriteria) => void;
  disabled?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VariantFilterBar({
  attributes,
  onFilterChange,
  disabled = false,
}: VariantFilterBarProps) {
  const uid = useId();
  const [skuQuery, setSkuQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<FilterCriteria["stockFilter"]>("all");
  const [statusFilter, setStatusFilter] = useState<FilterCriteria["statusFilter"]>("all");
  const [attributeFilters, setAttributeFilters] = useState<Record<string, string>>({});

  // Debounce SKU search
  const notifyFilterChange = useCallback(
    (overrides: Partial<{
      sku: string;
      stock: FilterCriteria["stockFilter"];
      status: FilterCriteria["statusFilter"];
      attrs: Record<string, string>;
    }>) => {
      onFilterChange({
        skuQuery: overrides.sku ?? skuQuery,
        stockFilter: overrides.stock ?? stockFilter,
        statusFilter: overrides.status ?? statusFilter,
        attributeFilters: overrides.attrs ?? attributeFilters,
      });
    },
    [skuQuery, stockFilter, statusFilter, attributeFilters, onFilterChange],
  );

  const handleSkuChange = useCallback(
    (value: string) => {
      setSkuQuery(value);
      notifyFilterChange({ sku: value });
    },
    [notifyFilterChange],
  );

  const handleStockChange = useCallback(
    (value: FilterCriteria["stockFilter"]) => {
      setStockFilter(value);
      notifyFilterChange({ stock: value });
    },
    [notifyFilterChange],
  );

  const handleStatusChange = useCallback(
    (value: FilterCriteria["statusFilter"]) => {
      setStatusFilter(value);
      notifyFilterChange({ status: value });
    },
    [notifyFilterChange],
  );

  const handleAttributeFilter = useCallback(
    (attrName: string, optionValue: string) => {
      const updated = { ...attributeFilters };
      if (optionValue === "") {
        delete updated[attrName];
      } else {
        updated[attrName] = optionValue;
      }
      setAttributeFilters(updated);
      notifyFilterChange({ attrs: updated });
    },
    [attributeFilters, notifyFilterChange],
  );

  const hasActiveFilters = useMemo(
    () =>
      skuQuery !== "" ||
      stockFilter !== "all" ||
      statusFilter !== "all" ||
      Object.keys(attributeFilters).length > 0,
    [skuQuery, stockFilter, statusFilter, attributeFilters],
  );

  const handleClear = useCallback(() => {
    setSkuQuery("");
    setStockFilter("all");
    setStatusFilter("all");
    setAttributeFilters({});
    onFilterChange({
      skuQuery: "",
      stockFilter: "all",
      statusFilter: "all",
      attributeFilters: {},
    });
  }, [onFilterChange]);

  return (
    <div className="rounded-lg border border-hairline-light bg-canvas-light">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-3 py-2">
        {/* SKU Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-shade-40" />
          <input
            type="text"
            value={skuQuery}
            onChange={(e) => handleSkuChange(e.target.value)}
            placeholder="Search SKU..."
            disabled={disabled}
            className="w-full rounded-md border border-hairline-light bg-canvas-light py-1.5 pl-8 pr-3 text-micro text-ink placeholder:text-shade-40 focus:border-ink focus:outline-none"
          />
          {skuQuery && (
            <button
              type="button"
              onClick={() => handleSkuChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-shade-40 hover:text-ink"
              aria-label="Clear SKU search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Stock + Status on same row on mobile */}
        <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
          <select
            value={stockFilter}
            onChange={(e) => handleStockChange(e.target.value as FilterCriteria["stockFilter"])}
            disabled={disabled}
            className="rounded-md border border-hairline-light bg-canvas-light px-2.5 py-1.5 text-micro text-ink focus:border-ink focus:outline-none w-full sm:w-auto"
          >
            <option value="all">All Stock</option>
            <option value="in_stock">In Stock (&gt;0)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
            <option value="low_stock">Low Stock (≤10)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value as FilterCriteria["statusFilter"])}
            disabled={disabled}
            className="rounded-md border border-hairline-light bg-canvas-light px-2.5 py-1.5 text-micro text-ink focus:border-ink focus:outline-none w-full sm:w-auto"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Attribute dropdown filters */}
        {attributes.map((attr) => (
          <select
            key={attr.name}
            value={attributeFilters[attr.name] ?? ""}
            onChange={(e) => handleAttributeFilter(attr.name, e.target.value)}
            disabled={disabled}
            className="rounded-md border border-hairline-light bg-canvas-light px-2.5 py-1.5 text-micro text-ink focus:border-ink focus:outline-none"
          >
            <option value="">All {attr.name}</option>
            {attr.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}

        {/* Clear button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-full border border-hairline-light px-3 py-1.5 text-micro text-shade-50 hover:bg-canvas-cream transition-colors shrink-0"
          >
            <X className="h-3 w-3" />
            <span>Clear</span>
          </button>
        )}
      </div>
    </div>
  );
}
