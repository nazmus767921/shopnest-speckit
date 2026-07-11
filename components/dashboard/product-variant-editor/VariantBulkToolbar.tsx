"use client";

import { useCallback, useState, useId } from "react";
import { CheckSquareIcon, SquareIcon, XIcon, RefreshCwIcon, DollarSignIcon, LayersIcon, TagIcon } from "@/lib/icons";

import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type PriceAdjustmentType = "fixed" | "percent" | "add_amount";

const PRICE_ADJUSTMENT_OPTIONS = [
  { value: "fixed", label: "Fixed (৳)" },
  { value: "percent", label: "%" },
  { value: "add_amount", label: "+/- ৳" },
];

const COMPARE_AT_OPTIONS = [
  { value: "fixed", label: "Fixed (৳)" },
  { value: "percent", label: "%" },
  { value: "add_amount", label: "+/- ৳" },
  { value: "clear", label: "Clear Old Price" },
];

interface UndoSnapshot {
  variants: Array<{ id: string; pricePaisa: number | null; stockCount: number; isActive: boolean; sku: string }>;
  appliedData: any;
}

interface BulkToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkUpdate: (data: {
    variantIds: string[];
    priceAdjustment?: { type: PriceAdjustmentType; value: number };
    compareAtPriceAdjustment?: { type: PriceAdjustmentType; value: number } | null;
    stockCount?: number;
    isActive?: boolean;
    skuPrefix?: string;
  }) => Promise<void>;
  disabled?: boolean;
  undoSnapshot?: UndoSnapshot | null;
  onUndo?: () => Promise<void>;
}

export function VariantBulkToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkUpdate,
  disabled = false,
  undoSnapshot,
  onUndo,
}: BulkToolbarProps) {
  const uid = useId();
  const [expanded, setExpanded] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"price" | "stock" | "status">("price");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [priceType, setPriceType] = useState<PriceAdjustmentType>("fixed");
  const [priceValue, setPriceValue] = useState("");

  const [compareAtPriceType, setCompareAtPriceType] = useState<PriceAdjustmentType | "clear">("fixed");
  const [compareAtPriceValue, setCompareAtPriceValue] = useState("");

  const [stockValue, setStockValue] = useState("");

  const [bulkActive, setBulkActive] = useState<boolean | null>(null);

  const [skuPrefix, setSkuPrefix] = useState("");

  const hasSelection = selectedCount > 0;

  const clearMessage = useCallback(() => setMessage(null), []);

  const handleApply = useCallback(async () => {
    if (!hasSelection) return;

    setSaving(true);
    setMessage(null);

    try {
      const data: {
        variantIds?: string[];
        priceAdjustment?: { type: PriceAdjustmentType; value: number };
        compareAtPriceAdjustment?: { type: PriceAdjustmentType; value: number } | null;
        stockCount?: number;
        isActive?: boolean;
        skuPrefix?: string;
      } = {};

      if (activeSubTab === "price") {
        if (priceValue) {
          let value = parseFloat(priceValue);
          if (priceType === "fixed" || priceType === "add_amount") {
            value = Math.round(value * 100);
          }
          data.priceAdjustment = { type: priceType, value };
        }

        if (compareAtPriceType === "clear") {
          data.compareAtPriceAdjustment = null;
        } else if (compareAtPriceValue) {
          let value = parseFloat(compareAtPriceValue);
          if (compareAtPriceType === "fixed" || compareAtPriceType === "add_amount") {
            value = Math.round(value * 100);
          }
          data.compareAtPriceAdjustment = { type: compareAtPriceType, value };
        }
      }

      if (activeSubTab === "stock") {
        if (stockValue) {
          data.stockCount = parseInt(stockValue, 10);
        }
      }

      if (activeSubTab === "status") {
        if (bulkActive !== null) {
          data.isActive = bulkActive;
        }
        if (skuPrefix.trim()) {
          data.skuPrefix = skuPrefix.trim();
        }
      }

      if (Object.keys(data).length === 0) {
        setMessage({ type: "error", text: "No changes to apply. Please adjust the fields first." });
        setSaving(false);
        return;
      }

      await onBulkUpdate(data as any);
      setMessage({ type: "success", text: "Updated successfully." });
      
      // Reset active tab fields
      if (activeSubTab === "price") {
        setPriceValue("");
        setCompareAtPriceValue("");
      } else if (activeSubTab === "stock") {
        setStockValue("");
      } else if (activeSubTab === "status") {
        setBulkActive(null);
        setSkuPrefix("");
      }
      
      // Auto close after 1.5s on success
      setTimeout(() => {
        setExpanded(false);
        setMessage(null);
      }, 1500);

    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to apply changes.",
      });
    } finally {
      setSaving(false);
    }
  }, [hasSelection, activeSubTab, priceValue, priceType, compareAtPriceValue, compareAtPriceType, stockValue, bulkActive, skuPrefix, onBulkUpdate]);

  if (totalCount === 0) return null;

  return (
    <div className="rounded-xl bg-muted/40 text-foreground border border-border/50">
      {/* Undo banner */}
      {undoSnapshot && onUndo && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-emerald-500/10 border-b border-border text-sm">
          <span className="text-emerald-700 dark:text-emerald-350 font-medium">
            Bulk update applied successfully.
          </span>
          <Button
            variant="default"
            size="sm"
            onClick={onUndo}
            className="h-7 px-3"
          >
            Undo
          </Button>
        </div>
      )}

      {/* Selection bar */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Checkbox
            checked={selectedCount === totalCount && totalCount > 0}
            onCheckedChange={(checked) => {
              if (checked) onSelectAll();
              else onDeselectAll();
            }}
            disabled={disabled}
            aria-label={
              selectedCount === totalCount ? "Deselect all variants" : "Select all variants"
            }
          />

          <span className="text-sm text-muted-foreground truncate font-semibold">
            {selectedCount > 0
              ? `${selectedCount} of ${totalCount} selected`
              : `${totalCount} variant${totalCount !== 1 ? "s" : ""}`}
          </span>
        </div>

        {hasSelection && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="h-4 w-px bg-border" aria-hidden="true" />

            <Button
              size="sm"
              onClick={() => setExpanded(!expanded)}
              disabled={disabled}
              className="h-8 px-3 rounded-full"
            >
              {expanded ? "Cancel" : "Bulk Edit"}
            </Button>

            <button
              type="button"
              onClick={onDeselectAll}
              disabled={disabled}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer border-none bg-transparent"
              aria-label="Clear selection"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded bulk editor */}
      {expanded && hasSelection && (
        <div className="border-t border-border px-4 py-4 space-y-4 bg-background rounded-b-xl animate-in slide-in-from-top-2 duration-200">
          {message && (
            <div
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-semibold flex items-center justify-between",
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-350"
                  : "bg-destructive/10 text-destructive"
              )}
              role="alert"
            >
              <span>{message.text}</span>
              <button
                type="button"
                onClick={clearMessage}
                className="text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent"
                aria-label="Dismiss"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Sub-tabs Header */}
          <div className="flex border-b border-border gap-1" role="tablist">
            {[
              { id: "price" as const, label: "Price & Discounts", icon: DollarSignIcon },
              { id: "stock" as const, label: "Stock Inventory", icon: LayersIcon },
              { id: "status" as const, label: "Status & SKU", icon: TagIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveSubTab(tab.id);
                    clearMessage();
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-all cursor-pointer bg-transparent border-none",
                    isActive
                      ? "border-primary text-foreground font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panels */}
          <div className="pt-2">
            {activeSubTab === "price" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Price */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Price Adjustment
                    </label>
                    <div className="flex gap-1.5">
                      <Select
                        value={priceType}
                        onValueChange={(val) => setPriceType(val as PriceAdjustmentType)}
                        disabled={disabled || saving}
                      >
                        <SelectTrigger className="w-28 shrink-0 h-9">
                          <SelectValue placeholder="Price Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRICE_ADJUSTMENT_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <NumberInput
                        value={priceValue ? parseFloat(priceValue) : undefined}
                        onChange={(val) => setPriceValue(val !== undefined && !isNaN(val) ? val.toString() : "")}
                        placeholder={priceType === "percent" ? "+10" : "100"}
                        disabled={disabled || saving}
                        minValue={priceType === "fixed" ? 0 : priceType === "percent" ? -100 : undefined}
                        className="h-9 text-sm flex-1"
                      />
                    </div>
                  </div>

                  {/* Old Price / Compare At */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Old Price Adjustment
                    </label>
                    <div className="flex gap-1.5">
                      <Select
                        value={compareAtPriceType}
                        onValueChange={(val) => setCompareAtPriceType(val as any)}
                        disabled={disabled || saving}
                      >
                        <SelectTrigger className="w-28 shrink-0 h-9">
                          <SelectValue placeholder="Old Price Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPARE_AT_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {compareAtPriceType !== "clear" && (
                        <NumberInput
                          value={compareAtPriceValue ? parseFloat(compareAtPriceValue) : undefined}
                          onChange={(val) => setCompareAtPriceValue(val !== undefined && !isNaN(val) ? val.toString() : "")}
                          placeholder={compareAtPriceType === "percent" ? "+10" : "150"}
                          disabled={disabled || saving}
                          minValue={compareAtPriceType === "fixed" ? 0 : compareAtPriceType === "percent" ? -100 : undefined}
                          className="h-9 text-sm flex-1"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Price Presets */}
                <div className="space-y-2 bg-muted/20 p-3 rounded-lg border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Quick Price Presets
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPriceType("percent");
                        setPriceValue("-10");
                      }}
                      disabled={disabled || saving}
                      className="px-2.5 py-1 text-xs rounded-full border border-border bg-background text-foreground hover:bg-muted transition-colors cursor-pointer select-none"
                    >
                      10% Discount
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPriceType("percent");
                        setPriceValue("-20");
                      }}
                      disabled={disabled || saving}
                      className="px-2.5 py-1 text-xs rounded-full border border-border bg-background text-foreground hover:bg-muted transition-colors cursor-pointer select-none"
                    >
                      20% Discount
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCompareAtPriceType("clear");
                      }}
                      disabled={disabled || saving}
                      className="px-2.5 py-1 text-xs rounded-full border border-border bg-background text-foreground hover:bg-muted transition-colors cursor-pointer select-none"
                    >
                      Clear Compare Prices
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === "stock" && (
              <div className="space-y-4">
                <div className="max-w-xs space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Set Stock Count
                  </label>
                  <NumberInput
                    value={stockValue ? parseFloat(stockValue) : undefined}
                    onChange={(val) => setStockValue(val !== undefined && !isNaN(val) ? val.toString() : "")}
                    placeholder="e.g. 50"
                    disabled={disabled || saving}
                    minValue={0}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Stock Presets */}
                <div className="space-y-2 bg-muted/20 p-3 rounded-lg border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Quick Inventory Presets
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setStockValue("0")}
                      disabled={disabled || saving}
                      className="px-2.5 py-1 text-xs rounded-full border border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 hover:bg-red-100/70 dark:hover:bg-red-950/40 transition-colors cursor-pointer select-none font-medium"
                    >
                      Out of Stock (0)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockValue("5")}
                      disabled={disabled || saving}
                      className="px-2.5 py-1 text-xs rounded-full border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400 hover:bg-amber-100/70 dark:hover:bg-amber-950/40 transition-colors cursor-pointer select-none font-medium"
                    >
                      Low Stock (5)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockValue("50")}
                      disabled={disabled || saving}
                      className="px-2.5 py-1 text-xs rounded-full border border-emerald-250 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-350 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer select-none font-medium"
                    >
                      Standard (50)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockValue("100")}
                      disabled={disabled || saving}
                      className="px-2.5 py-1 text-xs rounded-full border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400 hover:bg-blue-100/70 dark:hover:bg-blue-950/40 transition-colors cursor-pointer select-none font-medium"
                    >
                      High Stock (100)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === "status" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Chips */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Active Status
                    </span>
                    <div className="flex flex-wrap gap-2 py-1">
                      <button
                        type="button"
                        onClick={() => setBulkActive(null)}
                        disabled={disabled || saving}
                        className={cn(
                          "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer select-none",
                          bulkActive === null
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                        )}
                      >
                        Keep Current
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkActive(true)}
                        disabled={disabled || saving}
                        className={cn(
                          "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer select-none",
                          bulkActive === true
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm dark:bg-emerald-600 dark:border-emerald-600 font-bold"
                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                        )}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkActive(false)}
                        disabled={disabled || saving}
                        className={cn(
                          "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer select-none",
                          bulkActive === false
                            ? "bg-red-500 text-white border-red-500 shadow-sm dark:bg-red-600 dark:border-red-600 font-bold"
                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                        )}
                      >
                        Inactive
                      </button>
                    </div>
                  </div>

                  {/* SKU Prefix */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                      SKU Prefix
                    </label>
                    <Input
                      type="text"
                      value={skuPrefix}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSkuPrefix(e.target.value)}
                      placeholder="e.g. BOUTIQUE-"
                      maxLength={20}
                      disabled={disabled || saving}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex justify-end pt-3 border-t border-border/60">
            <Button
              type="button"
              onClick={handleApply}
              disabled={disabled || saving}
              className="w-full sm:w-auto flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <RefreshCwIcon className="h-4 w-4 animate-spin" />
                  <span>Applying...</span>
                </>
              ) : (
                <span>Apply to {selectedCount} variant{selectedCount !== 1 ? "s" : ""}</span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
