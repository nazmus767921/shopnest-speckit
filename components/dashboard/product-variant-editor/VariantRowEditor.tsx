"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import type { VariantUpdateInput } from "@/lib/validations/variants";

import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type VariantRow = {
  id: string;
  sku: string;
  label: string;
  pricePaisa: number | null;
  compareAtPricePaisa: number | null;
  stockCount: number;
  isActive: boolean;
};

interface VariantRowEditorProps {
  variant: VariantRow;
  onUpdate: (variantId: string, data: VariantUpdateInput) => Promise<void>;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  disabled?: boolean;
  rowIndex?: number;
  focused?: boolean;
}

// ─── Inline Editable Cell ────────────────────────────────────────────────────

function InlineCell({
  value,
  displayValue,
  onSave,
  type = "text",
  placeholder,
  disabled,
  label,
  leftIcon,
}: {
  value: string;
  displayValue: string;
  onSave: (val: string) => Promise<void>;
  type?: "text" | "number";
  placeholder?: string;
  disabled?: boolean;
  label: string;
  leftIcon?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<"success" | "error" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing) {
      const inputEl = containerRef.current?.querySelector("input");
      inputEl?.focus();
      inputEl?.select();
    }
  }, [editing]);

  const startEdit = useCallback(() => {
    if (disabled) return;
    setInput(value);
    setEditing(true);
    setFlash(null);
  }, [disabled, value]);

  const handleSave = useCallback(async () => {
    if (input === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setFlash(null);
    try {
      await onSave(input);
      setFlash("success");
      setEditing(false);
      setTimeout(() => setFlash(null), 1500);
    } catch {
      setFlash("error");
      setTimeout(() => setFlash(null), 2000);
    } finally {
      setSaving(false);
    }
  }, [input, value, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        setInput(value);
        setEditing(false);
      }
    },
    [handleSave, value],
  );

  const flashBorderClass =
    flash === "success"
      ? "ring-2 ring-emerald-500"
      : flash === "error"
        ? "ring-2 ring-destructive"
        : "";

  return (
    <div ref={containerRef} className="relative text-foreground">
      <span className="block sm:hidden text-xs text-muted-foreground mb-1">{label}</span>

      {editing ? (
        <div className={flashBorderClass}>
          {type === "number" ? (
            <NumberInput
              value={input ? parseFloat(input) : undefined}
              onChange={(val) => setInput(val !== undefined && !isNaN(val) ? val.toString() : "")}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              disabled={disabled || saving}
              placeholder={placeholder}
              minValue={0}
              leftIcon={leftIcon}
              variant="compact"
              className="w-full text-sm"
            />
          ) : (
            <Input
              type="text"
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              disabled={disabled || saving}
              placeholder={placeholder}
              className="min-h-9 text-sm"
            />
          )}
          {saving && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          disabled={disabled}
          className={cn(
            "w-full rounded-md border border-transparent px-2.5 py-1.5 text-left text-sm transition-colors hover:border-border hover:bg-muted disabled:cursor-not-allowed cursor-pointer",
            flash === "success"
              ? "ring-2 ring-emerald-500 bg-emerald-500/10 text-emerald-700"
              : flash === "error"
                ? "ring-2 ring-destructive bg-destructive/10 text-destructive"
                : "",
            displayValue === "Inherit" || displayValue === ""
              ? "text-muted-foreground"
              : "text-foreground font-medium"
          )}
        >
          <span className="flex items-center gap-1">
            <span>{displayValue}</span>
          </span>
        </button>
      )}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VariantRowEditor({
  variant,
  onUpdate,
  selected = false,
  onSelectChange,
  disabled = false,
  rowIndex = 0,
  focused = false,
}: VariantRowEditorProps) {
  const priceDisplay =
    variant.pricePaisa != null
      ? `৳ ${(variant.pricePaisa / 100).toFixed(0)}`
      : "Inherit";

  const handleSaveSku = useCallback(
    async (val: string) => {
      const trimmed = val.trim();
      if (trimmed === variant.sku) return;
      await onUpdate(variant.id, { sku: trimmed });
    },
    [variant.id, variant.sku, onUpdate],
  );

  const handleSavePrice = useCallback(
    async (val: string) => {
      if (val === "" || val === null || val === undefined) {
        await onUpdate(variant.id, { pricePaisa: null });
        return;
      }
      const taka = parseFloat(val);
      if (isNaN(taka) || taka < 0) {
        throw new Error("Invalid price");
      }
      const paisa = Math.round(taka * 100);
      if (paisa === variant.pricePaisa) return;
      await onUpdate(variant.id, { pricePaisa: paisa });
    },
    [variant.id, variant.pricePaisa, onUpdate],
  );

  const handleSaveCompareAtPrice = useCallback(
    async (val: string) => {
      if (val === "" || val === null || val === undefined) {
        await onUpdate(variant.id, { compareAtPricePaisa: null });
        return;
      }
      const taka = parseFloat(val);
      if (isNaN(taka) || taka < 0) {
        throw new Error("Invalid old price");
      }
      const paisa = Math.round(taka * 100);
      if (paisa === variant.compareAtPricePaisa) return;
      if (variant.pricePaisa != null && paisa <= variant.pricePaisa) {
        throw new Error("Old price must be greater than current price");
      }
      await onUpdate(variant.id, { compareAtPricePaisa: paisa });
    },
    [variant.id, variant.pricePaisa, variant.compareAtPricePaisa, onUpdate],
  );

  const handleSaveStock = useCallback(
    async (val: string) => {
      const parsed = parseInt(val, 10);
      if (parsed === variant.stockCount) return;
      if (isNaN(parsed) || parsed < 0) {
        throw new Error("Invalid stock count");
      }
      await onUpdate(variant.id, { stockCount: parsed });
    },
    [variant.id, variant.stockCount, onUpdate],
  );

  const handleToggleStatus = useCallback(async () => {
    await onUpdate(variant.id, { isActive: !variant.isActive });
  }, [variant.id, variant.isActive, onUpdate]);


  return (
    <div
      className={cn(
        "rounded-lg border transition-all text-foreground",
        variant.isActive
          ? "border-border bg-card"
          : "border-border bg-muted/40 opacity-75",
        selected ? "ring-2 ring-primary/30" : "",
        focused ? "focus:ring-2 focus:ring-primary/20 focus:outline-none" : ""
      )}
      role="row"
      data-row-index={rowIndex}
      tabIndex={focused ? 0 : -1}
      aria-rowindex={rowIndex + 1}
      aria-label={`Variant: ${variant.label}`}
    >
      {/* ── Desktop: horizontal row ── */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-2">
        {/* Checkbox + Label */}
        <div className="flex items-center gap-2 w-[110px] shrink-0" role="gridcell">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectChange?.(!!checked)}
            aria-label={`Select variant ${variant.sku}`}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="min-w-0 ml-1">
            <span className="text-xs text-muted-foreground block leading-tight">Label</span>
            <span className="text-sm text-foreground font-semibold truncate block leading-7">
              {variant.label}
            </span>
          </div>
        </div>

        {/* SKU */}
        <div className="flex-1 min-w-0" role="gridcell">
          <span className="text-xs text-muted-foreground block leading-tight">SKU</span>
          <InlineCell
            value={variant.sku}
            displayValue={variant.sku}
            onSave={handleSaveSku}
            placeholder="SKU"
            disabled={disabled}
            label="SKU"
          />
        </div>

        {/* Price */}
        <div className="w-[140px] shrink-0" role="gridcell">
          <span className="text-xs text-muted-foreground block leading-tight">Price (৳)</span>
          <InlineCell
            value={variant.pricePaisa != null ? (variant.pricePaisa / 100).toFixed(0) : ""}
            displayValue={priceDisplay}
            onSave={handleSavePrice}
            type="number"
            placeholder="Inherit"
            disabled={disabled}
            label="Price (৳)"
            leftIcon={<span className="text-muted-foreground text-sm font-semibold">৳</span>}
          />
        </div>

        {/* Old Price */}
        <div className="w-[140px] shrink-0" role="gridcell">
          <span className="text-xs text-muted-foreground block leading-tight">Old Price (৳)</span>
          <InlineCell
            value={variant.compareAtPricePaisa != null ? (variant.compareAtPricePaisa / 100).toFixed(0) : ""}
            displayValue={variant.compareAtPricePaisa != null ? `৳ ${(variant.compareAtPricePaisa / 100).toFixed(0)}` : "None"}
            onSave={handleSaveCompareAtPrice}
            type="number"
            placeholder="None"
            disabled={disabled}
            label="Old Price (৳)"
            leftIcon={<span className="text-muted-foreground text-sm font-semibold">৳</span>}
          />
        </div>

        {/* Stock */}
        <div className="w-[110px] shrink-0" role="gridcell">
          <span className="text-xs text-muted-foreground block leading-tight">Stock</span>
          <InlineCell
            value={variant.stockCount.toString()}
            displayValue={variant.stockCount.toString()}
            onSave={handleSaveStock}
            type="number"
            placeholder="0"
            disabled={disabled}
            label="Stock"
          />
        </div>

        {/* Status */}
        <div className="w-[85px] shrink-0 text-right" role="gridcell">
          <span className="text-xs text-muted-foreground block leading-tight pr-2">Status</span>
          <Badge
            variant="outline"
            onClick={handleToggleStatus}
            className={cn(
              "cursor-pointer transition-colors border",
              variant.isActive
                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20 dark:text-emerald-350 dark:border-emerald-500/30"
                : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full mr-1.5",
                variant.isActive ? "bg-emerald-500" : "bg-muted-foreground"
              )}
              aria-hidden="true"
            />
            <span>{variant.isActive ? "Active" : "Inactive"}</span>
          </Badge>
        </div>
      </div>

      {/* ── Mobile: stacked card layout ── */}
      <div className="sm:hidden px-3 py-3 space-y-3" role="gridcell">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelectChange?.(!!checked)}
              aria-label={`Select variant ${variant.sku}`}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-sm font-semibold text-foreground truncate ml-1">
              {variant.label}
            </span>
          </div>
          <Badge
            variant="outline"
            onClick={handleToggleStatus}
            className={cn(
              "cursor-pointer font-semibold shrink-0 transition-colors border",
              variant.isActive
                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20 dark:text-emerald-350 dark:border-emerald-500/30"
                : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
            )}
          >
            {variant.isActive ? (
              <Check className="h-3 w-3 mr-1 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <X className="h-3 w-3 mr-1 text-muted-foreground" />
            )}
            <span>{variant.isActive ? "Active" : "Inactive"}</span>
          </Badge>
        </div>

        <InlineCell
          value={variant.sku}
          displayValue={variant.sku}
          onSave={handleSaveSku}
          placeholder="SKU"
          disabled={disabled}
          label="SKU"
        />

        <div className="grid grid-cols-3 gap-2">
          <InlineCell
            value={variant.pricePaisa != null ? (variant.pricePaisa / 100).toFixed(0) : ""}
            displayValue={priceDisplay}
            onSave={handleSavePrice}
            type="number"
            placeholder="Inherit"
            disabled={disabled}
            label="Price (৳)"
            leftIcon={<span className="text-muted-foreground text-xs font-semibold">৳</span>}
          />
          <InlineCell
            value={variant.compareAtPricePaisa != null ? (variant.compareAtPricePaisa / 100).toFixed(0) : ""}
            displayValue={variant.compareAtPricePaisa != null ? `৳ ${(variant.compareAtPricePaisa / 100).toFixed(0)}` : "None"}
            onSave={handleSaveCompareAtPrice}
            type="number"
            placeholder="None"
            disabled={disabled}
            label="Old Price"
            leftIcon={<span className="text-muted-foreground text-xs font-semibold">৳</span>}
          />
          <InlineCell
            value={variant.stockCount.toString()}
            displayValue={variant.stockCount.toString()}
            onSave={handleSaveStock}
            type="number"
            placeholder="0"
            disabled={disabled}
            label="Stock"
          />
        </div>
      </div>

      {/* ── Variant Images (expandable) ── */}
    </div>
  );
}
