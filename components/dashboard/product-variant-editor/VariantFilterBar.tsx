"use client";

import { useCallback, useState, useId, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Select } from "@/components/ui/primitives/Select";

const STOCK_OPTIONS = [
  { value: "all", label: "All Stock" },
  { value: "in_stock", label: "In Stock (>0)" },
  { value: "out_of_stock", label: "Out of Stock (0)" },
  { value: "low_stock", label: "Low Stock (≤10)" },
]

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
]

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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
          <Select<(typeof STOCK_OPTIONS)[number]>
            options={STOCK_OPTIONS}
            value={STOCK_OPTIONS.find((o) => o.value === stockFilter) ?? null}
            onChange={(opt) => opt && handleStockChange(opt.value as FilterCriteria["stockFilter"])}
            disabled={disabled}
            getOptionLabel={(o) => o.label}
            getOptionValue={(o) => o.value}
            className="w-full sm:w-auto"
          />

          <Select<(typeof STATUS_OPTIONS)[number]>
            options={STATUS_OPTIONS}
            value={STATUS_OPTIONS.find((o) => o.value === statusFilter) ?? null}
            onChange={(opt) => opt && handleStatusChange(opt.value as FilterCriteria["statusFilter"])}
            disabled={disabled}
            getOptionLabel={(o) => o.label}
            getOptionValue={(o) => o.value}
            className="w-full sm:w-auto"
          />
        </div>

        {/* Attribute dropdown filters */}
        {attributes.map((attr) => {
          const attrOptions = [{ value: "", label: `All ${attr.name}` }, ...attr.options]
          return (
            <Select<{ value: string; label: string }>
              key={attr.name}
              options={attrOptions}
              value={attrOptions.find((o) => o.value === (attributeFilters[attr.name] ?? "")) ?? null}
              onChange={(opt) => handleAttributeFilter(attr.name, opt?.value ?? "")}
              disabled={disabled}
              getOptionLabel={(o) => o.label}
              getOptionValue={(o) => o.value}
            />
          )
        })}

        {/* Clear button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-md bg-canvas-cream border border-hairline-light px-2.5 py-1.5 text-micro text-shade-50 hover:bg-shade-30/30 hover:text-ink transition-colors shrink-0"
          >
            <X className="h-3 w-3" />
            <span>Clear</span>
          </button>
        )}
      </div>
  );
}
