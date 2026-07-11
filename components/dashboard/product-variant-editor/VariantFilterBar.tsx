"use client";

import { useCallback, useState, useId, useMemo } from "react";
import { SearchIcon, XIcon, FilterIcon } from "@/lib/icons";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const STOCK_OPTIONS = [
  { value: "all", label: "All Stock" },
  { value: "in_stock", label: "In Stock (>0)" },
  { value: "out_of_stock", label: "Out of Stock (0)" },
  { value: "low_stock", label: "Low Stock (≤10)" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

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

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (stockFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    count += Object.keys(attributeFilters).length;
    return count;
  }, [stockFilter, statusFilter, attributeFilters]);

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

  const getStockLabel = (val: string) => {
    return STOCK_OPTIONS.find((o) => o.value === val)?.label || val;
  };

  const getStatusLabel = (val: string) => {
    return STATUS_OPTIONS.find((o) => o.value === val)?.label || val;
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2 text-foreground w-full">
        {/* SKU SearchIcon */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            type="text"
            value={skuQuery}
            onChange={(e) => handleSkuChange(e.target.value)}
            placeholder="SearchIcon SKU..."
            disabled={disabled}
            className="pl-8 pr-8 h-9"
          />
          {skuQuery && (
            <button
              type="button"
              onClick={() => handleSkuChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
              aria-label="Clear SKU search"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* FilterIcon Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              className="gap-2 shrink-0 h-9"
            >
              <FilterIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-xs flex flex-col h-full p-0">
            <SheetHeader className="px-6 py-5 border-b border-border">
              <SheetTitle>FilterIcon Variants</SheetTitle>
              <SheetDescription>
                Narrow down the variants list using the options below.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Stock status */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Stock Status
                </label>
                <Select
                  value={stockFilter}
                  onValueChange={(val) => handleStockChange(val as FilterCriteria["stockFilter"])}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-full h-9">
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
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(val) => handleStatusChange(val as FilterCriteria["statusFilter"])}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-full h-9">
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

              {/* Attribute filters */}
              {attributes.map((attr) => {
                const attrOptions = [{ value: "all", label: `All ${attr.name}` }, ...attr.options];
                const currentVal = attributeFilters[attr.name] || "all";
                return (
                  <div key={attr.name} className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      {attr.name}
                    </label>
                    <Select
                      value={currentVal}
                      onValueChange={(val) => handleAttributeFilter(attr.name, val === "all" ? "" : val)}
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full h-9">
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
                  </div>
                );
              })}
            </div>

            {hasActiveFilters && (
              <div className="p-6 border-t border-border bg-muted/10">
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={disabled}
                  className="w-full gap-2 h-9"
                >
                  <XIcon className="h-4 w-4" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Active FilterIcon Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-foreground mt-0.5 animate-in fade-in-50 duration-200">
          {skuQuery && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground">
              <span>SKU: "{skuQuery}"</span>
              <button
                type="button"
                onClick={() => handleSkuChange("")}
                className="text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent p-0 flex items-center"
                aria-label="Remove SKU filter"
              >
                <XIcon className="h-3 w-3 ml-1" />
              </button>
            </span>
          )}

          {stockFilter !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground">
              <span>Stock: {getStockLabel(stockFilter)}</span>
              <button
                type="button"
                onClick={() => handleStockChange("all")}
                className="text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent p-0 flex items-center"
                aria-label="Remove stock filter"
              >
                <XIcon className="h-3 w-3 ml-1" />
              </button>
            </span>
          )}

          {statusFilter !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground">
              <span>Status: {getStatusLabel(statusFilter)}</span>
              <button
                type="button"
                onClick={() => handleStatusChange("all")}
                className="text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent p-0 flex items-center"
                aria-label="Remove status filter"
              >
                <XIcon className="h-3 w-3 ml-1" />
              </button>
            </span>
          )}

          {Object.entries(attributeFilters).map(([name, val]) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
            >
              <span>
                {name}: {val}
              </span>
              <button
                type="button"
                onClick={() => handleAttributeFilter(name, "")}
                className="text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent p-0 flex items-center"
                aria-label={`Remove ${name} filter`}
              >
                <XIcon className="h-3 w-3 ml-1" />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-bold text-primary hover:underline cursor-pointer border-none bg-transparent px-1.5 py-0.5"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
