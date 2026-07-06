"use client";

import { useCallback, useState, useId } from "react";
import { CheckSquare, Square, X, Percent, Plus, Minus, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/primitives/Input";
import { Select } from "@/components/ui/primitives/Select";

// ─── Types ───────────────────────────────────────────────────────────────────

type PriceAdjustmentType = "fixed" | "percent" | "add_amount";

const PRICE_ADJUSTMENT_OPTIONS = [
  { value: "fixed", label: "Fixed (৳)" },
  { value: "percent", label: "%" },
  { value: "add_amount", label: "+/- ৳" },
]

const COMPARE_AT_OPTIONS = [
  { value: "fixed", label: "Fixed (৳)" },
  { value: "percent", label: "%" },
  { value: "add_amount", label: "+/- ৳" },
  { value: "clear", label: "Clear Old Price" },
]

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

// ─── Component ───────────────────────────────────────────────────────────────

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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Price adjustment
  const [priceType, setPriceType] = useState<PriceAdjustmentType>("fixed");
  const [priceValue, setPriceValue] = useState("");

  // Compare-at price adjustment
  const [compareAtPriceType, setCompareAtPriceType] = useState<PriceAdjustmentType | "clear">("fixed");
  const [compareAtPriceValue, setCompareAtPriceValue] = useState("");

  // Stock
  const [stockValue, setStockValue] = useState("");

  // Status
  const [bulkActive, setBulkActive] = useState<boolean | null>(null);

  // SKU prefix
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

      if (priceValue) {
        let value = parseFloat(priceValue);
        // Convert taka inputs to paisa for DB (fixed and add_amount types only)
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

      if (stockValue) {
        data.stockCount = parseInt(stockValue, 10);
      }

      if (bulkActive !== null) {
        data.isActive = bulkActive;
      }

      if (skuPrefix.trim()) {
        data.skuPrefix = skuPrefix.trim();
      }

      if (Object.keys(data).length === 0) {
        setMessage({ type: "error", text: "No changes to apply." });
        return;
      }

      // We pass variantIds via a hidden trick — the parent handles ID resolution
      await onBulkUpdate(data as any);
      setMessage({ type: "success", text: "Updated successfully." });
      setExpanded(false);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to apply changes.",
      });
    } finally {
      setSaving(false);
    }
  }, [hasSelection, priceValue, priceType, compareAtPriceValue, compareAtPriceType, stockValue, bulkActive, skuPrefix, onBulkUpdate]);

  if (totalCount === 0) return null;

  return (
    <div className="rounded-lg bg-canvas-cream/60">
      {/* Undo toast */}
      {undoSnapshot && onUndo && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-aloe-10/30 border-b border-aloe-10/40">
          <span className="text-caption text-shade-70">
            Bulk update applied.
          </span>
          <button
            type="button"
            onClick={onUndo}
            className="rounded-md bg-ink px-3 py-1 text-micro text-on-primary hover:bg-shade-70 transition-colors shrink-0"
          >
            Undo
          </button>
        </div>
      )}

      {/* Selection bar */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Left side — grows to push right side to the end */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            type="button"
            onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
            disabled={disabled}
            className="rounded-full p-1 text-shade-40 hover:bg-canvas-cream transition-colors shrink-0"
            aria-label={
              selectedCount === totalCount ? "Deselect all variants" : "Select all variants"
            }
          >
            {selectedCount === totalCount ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>

          <span className="text-caption text-shade-50 truncate">
            {selectedCount > 0
              ? `${selectedCount} of ${totalCount} selected`
              : `${totalCount} variant${totalCount !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Right side — pushed to the end, does not shrink */}
        {hasSelection && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="h-4 w-px bg-shade-30" aria-hidden="true" />

            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              disabled={disabled}
              className="rounded-full bg-primary px-3 py-1 text-micro text-on-primary hover:bg-shade-70 transition-colors shrink-0"
            >
              <span>{expanded ? "Cancel" : "Bulk Edit"}</span>
            </button>

            <button
              type="button"
              onClick={onDeselectAll}
              disabled={disabled}
              className="rounded-full p-1 text-shade-40 hover:bg-canvas-cream transition-colors shrink-0"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded bulk editor */}
      {expanded && hasSelection && (
        <div className="border-t border-hairline-light/60 px-3 py-4 space-y-4">
          {message && (
            <div
              className={`rounded-lg px-3 py-2 text-caption ${
                message.type === "success"
                  ? "bg-aloe-10/60 text-shade-70"
                  : "bg-red-50 text-red-600"
              }`}
              role="alert"
            >
              {message.text}
              <button
                type="button"
                onClick={clearMessage}
                className="ml-2 text-shade-40 hover:text-ink"
                aria-label="Dismiss"
              >
                <X className="inline h-3 w-3" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Price Adjustment */}
            <div>
              <label className="mb-1 block text-micro font-medium text-ink">
                Price Adjustment
              </label>
              <div className="grid grid-cols-2 sm:flex gap-1.5">
                <Select<(typeof PRICE_ADJUSTMENT_OPTIONS)[number]>
                  options={PRICE_ADJUSTMENT_OPTIONS}
                  value={PRICE_ADJUSTMENT_OPTIONS.find((o) => o.value === priceType) ?? null}
                  onChange={(opt) => opt && setPriceType(opt.value as PriceAdjustmentType)}
                  disabled={disabled || saving}
                  getOptionLabel={(o) => o.label}
                  getOptionValue={(o) => o.value}
                  className="w-full sm:w-24"
                />
                <Input
                  type="number"
                  value={priceValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPriceValue(e.target.value)}
                  placeholder={priceType === "percent" ? "+10" : "100"}
                  disabled={disabled || saving}
                  min={0}
                  className="min-h-9 text-micro"
                />
              </div>
              <p className="mt-0.5 text-micro text-shade-40">
                {priceType === "fixed"
                  ? "Set exact price in ৳"
                  : priceType === "percent"
                    ? "Adjust by % (use negative for discount)"
                    : "Add/subtract in ৳ (use - for subtract)"}
              </p>
            </div>

            {/* Old Price Adjustment */}
            <div>
              <label className="mb-1 block text-micro font-medium text-ink">
                Old Price Adjustment
              </label>
              <div className="grid grid-cols-2 sm:flex gap-1.5">
                <Select<(typeof COMPARE_AT_OPTIONS)[number]>
                  options={COMPARE_AT_OPTIONS}
                  value={COMPARE_AT_OPTIONS.find((o) => o.value === compareAtPriceType) ?? null}
                  onChange={(opt) => opt && setCompareAtPriceType(opt.value as any)}
                  disabled={disabled || saving}
                  getOptionLabel={(o) => o.label}
                  getOptionValue={(o) => o.value}
                  className="w-full sm:w-24"
                />
                {compareAtPriceType !== "clear" && (
                  <Input
                    type="number"
                    value={compareAtPriceValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompareAtPriceValue(e.target.value)}
                    placeholder={compareAtPriceType === "percent" ? "+10" : "150"}
                    disabled={disabled || saving}
                    min={0}
                    className="min-h-9 text-micro"
                  />
                )}
              </div>
              <p className="mt-0.5 text-micro text-shade-40">
                {compareAtPriceType === "clear"
                  ? "Clear compare-at price"
                  : compareAtPriceType === "fixed"
                    ? "Set exact old price in ৳"
                    : compareAtPriceType === "percent"
                      ? "Adjust old price by %"
                      : "Add/subtract old price in ৳"}
              </p>
            </div>

            {/* Stock Count */}
            <div>
              <label
                htmlFor={`${uid}-stock`}
                className="mb-1 block text-micro font-medium text-ink"
              >
                Set Stock Count
              </label>
              <Input
                id={`${uid}-stock`}
                type="number"
                value={stockValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStockValue(e.target.value)}
                placeholder="Leave empty to keep"
                min={0}
                disabled={disabled || saving}
                className="min-h-9 text-micro"
              />
            </div>

            {/* Status */}
            <div>
              <span className="mb-1 block text-micro font-medium text-ink">
                Set Status
              </span>
              <div className="flex gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name={`${uid}-status`}
                    checked={bulkActive === true}
                    onChange={() => setBulkActive(true)}
                    disabled={disabled || saving}
                    className="h-3.5 w-3.5 accent-ink"
                  />
                  <span className="text-micro text-ink">Active</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name={`${uid}-status`}
                    checked={bulkActive === false}
                    onChange={() => setBulkActive(false)}
                    disabled={disabled || saving}
                    className="h-3.5 w-3.5 accent-ink"
                  />
                  <span className="text-micro text-ink">Inactive</span>
                </label>
                {bulkActive !== null && (
                  <button
                    type="button"
                    onClick={() => setBulkActive(null)}
                    className="text-micro text-shade-40 hover:text-ink"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* SKU Prefix */}
            <div>
              <label
                htmlFor={`${uid}-sku`}
                className="mb-1 block text-micro font-medium text-ink"
              >
                SKU Prefix
              </label>
              <input
                id={`${uid}-sku`}
                type="text"
                value={skuPrefix}
                onChange={(e) => setSkuPrefix(e.target.value)}
                placeholder="Leave empty to keep"
                maxLength={20}
                disabled={disabled || saving}
                className="w-full rounded-md border border-hairline-light bg-canvas-light px-3 py-2 text-micro text-ink placeholder:text-shade-40 focus:border-ink focus:outline-none"
              />
              <p className="mt-0.5 text-micro text-shade-40">
                Replaces first segment of SKU
              </p>
            </div>
          </div>

          {/* Apply button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleApply}
              disabled={disabled || saving}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2 text-caption text-on-primary hover:bg-shade-70 transition-colors disabled:opacity-50 w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Applying...</span>
                </>
              ) : (
                <span>Apply to {selectedCount} variant{selectedCount !== 1 ? "s" : ""}</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
