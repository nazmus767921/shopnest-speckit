"use client";

import { useCallback, useState, useId, useMemo } from "react";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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

export type FilterCriteria = {
  skuQuery: string;
  stockFilter: "all" | "in_stock" | "out_of_stock" | "low_stock";
  statusFilter: "all" | "active" | "inactive";
  attributeFilters: Record<string, string>;
};

interface VariantFilterBarProps {
  attributes: Array<{ name: string; options: Array<{ value: string; label: string }> }>;
  onFilterChange: (filters: FilterCriteria) => void;
  disabled?: boolean;
}

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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-foreground">
      {/* SKU Search */}
      <div className="relative flex-1 w-full sm:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          type="text"
          value={skuQuery}
          onChange={(e) => handleSkuChange(e.target.value)}
          placeholder="Search SKU..."
          disabled={disabled}
          className="pl-8 pr-8 w-full"
        />
        {skuQuery && (
          <button
            type="button"
            onClick={() => handleSkuChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer border-none"
            aria-label="Clear SKU search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Stock + Status on same row on mobile */}
      <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
        <Select
          value={stockFilter}
          onValueChange={(val) => handleStockChange(val as FilterCriteria["stockFilter"])}
          disabled={disabled}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            {STOCK_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(val) => handleStatusChange(val as FilterCriteria["statusFilter"])}
          disabled={disabled}
        >
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Attribute dropdown filters */}
      {attributes.map((attr) => {
        const attrOptions = [{ value: "all", label: `All ${attr.name}` }, ...attr.options]
        const currentVal = attributeFilters[attr.name] || "all"
        return (
          <Select
            key={attr.name}
            value={currentVal}
            onValueChange={(val) => handleAttributeFilter(attr.name, val === "all" ? "" : val)}
            disabled={disabled}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder={`All ${attr.name}`} />
            </SelectTrigger>
            <SelectContent>
              {attrOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      })}

      {/* Clear button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-1 rounded-md bg-muted border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors shrink-0 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
}
