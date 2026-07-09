"use client";

import { useCallback, useState, useId } from "react";
import { CheckSquare, Square, X, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div className="rounded-xl bg-muted/40 text-foreground">
      {/* Undo banner */}
      {undoSnapshot && onUndo && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-emerald-500/10 border-b border-border text-sm">
          <span className="text-emerald-700 dark:text-emerald-350 font-medium">
            Bulk update applied.
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
      <div className="flex items-center gap-2 px-3 py-2">
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

          <span className="text-sm text-muted-foreground truncate font-medium">
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
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer border-none"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Expanded bulk editor */}
      {expanded && hasSelection && (
        <div className="border-t border-border px-4 py-4 space-y-4">
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
                className="text-muted-foreground hover:text-foreground cursor-pointer border-none"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Price Adjustment */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Price Adjustment
              </label>
              <div className="flex gap-1.5">
                <Select
                  value={priceType}
                  onValueChange={(val) => setPriceType(val as PriceAdjustmentType)}
                  disabled={disabled || saving}
                >
                  <SelectTrigger className="w-28 shrink-0">
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
                <Input
                  type="number"
                  value={priceValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPriceValue(e.target.value)}
                  placeholder={priceType === "percent" ? "+10" : "100"}
                  disabled={disabled || saving}
                  min={0}
                  className="min-h-9 text-sm flex-1"
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground leading-normal">
                {priceType === "fixed"
                  ? "Set exact price in ৳"
                  : priceType === "percent"
                    ? "Adjust by % (use negative for discount)"
                    : "Add/subtract in ৳ (use - for subtract)"}
              </p>
            </div>

            {/* Old Price Adjustment */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Old Price Adjustment
              </label>
              <div className="flex gap-1.5">
                <Select
                  value={compareAtPriceType}
                  onValueChange={(val) => setCompareAtPriceType(val as any)}
                  disabled={disabled || saving}
                >
                  <SelectTrigger className="w-28 shrink-0">
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
                  <Input
                    type="number"
                    value={compareAtPriceValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompareAtPriceValue(e.target.value)}
                    placeholder={compareAtPriceType === "percent" ? "+10" : "150"}
                    disabled={disabled || saving}
                    min={0}
                    className="min-h-9 text-sm flex-1"
                  />
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground leading-normal">
                {compareAtPriceType === "clear"
                  ? "Clear old price"
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
                className="mb-1 block text-xs font-semibold text-foreground"
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
                className="min-h-9 text-sm"
              />
            </div>

            {/* Status */}
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-foreground">
                Set Status
              </span>
              <div className="flex items-center gap-3 py-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name={`${uid}-status`}
                    checked={bulkActive === true}
                    onChange={() => setBulkActive(true)}
                    disabled={disabled || saving}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm font-medium">Active</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name={`${uid}-status`}
                    checked={bulkActive === false}
                    onChange={() => setBulkActive(false)}
                    disabled={disabled || saving}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm font-medium">Inactive</span>
                </label>
                {bulkActive !== null && (
                  <button
                    type="button"
                    onClick={() => setBulkActive(null)}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold cursor-pointer border-none bg-transparent"
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
                className="mb-1 block text-xs font-semibold text-foreground"
              >
                SKU Prefix
              </label>
              <Input
                id={`${uid}-sku`}
                type="text"
                value={skuPrefix}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSkuPrefix(e.target.value)}
                placeholder="Leave empty to keep"
                maxLength={20}
                disabled={disabled || saving}
                className="min-h-9 text-sm"
              />
              <p className="mt-1 text-[11px] text-muted-foreground leading-normal">
                Replaces first segment of SKU
              </p>
            </div>
          </div>

          {/* Apply button */}
          <div className="flex justify-end pt-1">
            <Button
              type="button"
              onClick={handleApply}
              disabled={disabled || saving}
              className="w-full sm:w-auto flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
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
