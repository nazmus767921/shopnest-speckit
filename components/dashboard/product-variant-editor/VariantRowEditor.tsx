"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import type { VariantUpdateInput } from "@/lib/validations/variants";
import { VariantImageUpload } from "./VariantImageUpload";
import { Input } from "@/components/ui/primitives/Input";
import { Loader2, Check, X, ChevronDown, ChevronUp, ImageIcon } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type VariantRow = {
  id: string;
  sku: string;
  label: string;
  pricePaisa: number | null;
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
      ? "ring-2 ring-green-500"
      : flash === "error"
        ? "ring-2 ring-red-500"
        : "";

  return (
    <div ref={containerRef} className="relative">
      <span className="block sm:hidden text-micro text-shade-40 mb-1">{label}</span>

      {editing ? (
        <div className={flashBorderClass}>
          {type === "number" ? (
            <Input
              type="number"
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              disabled={disabled || saving}
              placeholder={placeholder}
              min={0}
              step={1}
              leftIcon={leftIcon}
              className="min-h-9 text-body-md"
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
              className="min-h-9 text-body-md"
            />
          )}
          {saving && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-shade-40" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          disabled={disabled}
          className={`w-full rounded-md border border-transparent px-2.5 py-1.5 text-left text-body-md transition-colors hover:border-hairline-light hover:bg-canvas-cream disabled:cursor-not-allowed ${flash === "success"
            ? "ring-2 ring-green-500 bg-green-50"
            : flash === "error"
              ? "ring-2 ring-red-500 bg-red-50"
              : ""
            } ${displayValue === "Inherit" || displayValue === ""
              ? "text-shade-40"
              : "text-ink"
            }`}
        >
          {displayValue}
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
    variant.pricePaisa !== null
      ? `৳${(variant.pricePaisa / 100).toFixed(0)}`
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
      // Input is in taka — convert to paisa for DB
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

  const [showImages, setShowImages] = useState(false);

  return (
    <div
      className={`rounded-lg border transition-all ${variant.isActive
        ? "border-hairline-light bg-canvas-light"
        : "border-hairline-light bg-canvas-cream/50 opacity-75"
        } ${selected ? "ring-2 ring-primary/30" : ""} ${focused ? "ring-2 ring-primary/20" : ""}`}
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
          <label
            className="flex items-center cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelectChange?.(e.target.checked)}
              className="h-4 w-4 rounded border-hairline-light accent-ink"
              aria-label={`Select variant ${variant.sku}`}
            />
          </label>
          <div className="min-w-0">
            <span className="text-micro text-shade-40 block leading-tight">Label</span>
            <span className="text-body-md text-ink font-medium truncate block leading-7">
              {variant.label}
            </span>
          </div>
        </div>

        {/* SKU */}
        <div className="flex-1 min-w-0" role="gridcell">
          <span className="text-micro text-shade-40 block leading-tight">SKU</span>
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
          <span className="text-micro text-shade-40 block leading-tight">Price (৳)</span>
          <InlineCell
            value={variant.pricePaisa !== null ? (variant.pricePaisa / 100).toFixed(0) : ""}
            displayValue={priceDisplay}
            onSave={handleSavePrice}
            type="number"
            placeholder="Inherit"
            disabled={disabled}
            label="Price (৳)"
            leftIcon={<span className="text-shade-50 text-body-md font-medium">৳</span>}
          />
        </div>

        {/* Stock */}
        <div className="w-[110px] shrink-0" role="gridcell">
          <span className="text-micro text-shade-40 block leading-tight">Stock</span>
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

        {/* Status — click to toggle */}
        <div className="w-[80px] shrink-0" role="gridcell">
          <span className="text-micro text-shade-40 block leading-tight">Status</span>
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={disabled}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-micro font-medium leading-tight transition-colors hover:opacity-80 disabled:cursor-not-allowed ${variant.isActive
              ? "bg-aloe-10/60 text-shade-70"
              : "bg-shade-30/50 text-shade-50"
              }`}
            aria-label={variant.isActive ? "Deactivate variant" : "Activate variant"}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${variant.isActive ? "bg-aloe-10/80" : "bg-shade-40"
                }`}
              aria-hidden="true"
            />
            {variant.isActive ? "Active" : "Inactive"}
          </button>
        </div>
      </div>

      {/* ── Mobile: stacked card layout ── */}
      <div className="sm:hidden px-3 py-3 space-y-3" role="gridcell">
        {/* Header row: checkbox + label + status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <label className="flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => onSelectChange?.(e.target.checked)}
                className="h-4 w-4 rounded border-hairline-light accent-ink"
                aria-label={`Select variant ${variant.sku}`}
              />
            </label>
            <span className="text-body-md text-ink font-medium truncate">
              {variant.label}
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={disabled}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-micro font-medium shrink-0 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed ${variant.isActive
              ? "bg-aloe-10/70 text-shade-70"
              : "bg-shade-30/60 text-shade-50"
              }`}
            aria-label={variant.isActive ? "Deactivate variant" : "Activate variant"}
          >
            {variant.isActive ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            {variant.isActive ? "Active" : "Inactive"}
          </button>
        </div>

        {/* SKU (full width) */}
        <InlineCell
          value={variant.sku}
          displayValue={variant.sku}
          onSave={handleSaveSku}
          placeholder="SKU"
          disabled={disabled}
          label="SKU"
        />

        {/* Price + Stock side by side */}
        <div className="grid grid-cols-2 gap-2">
          <InlineCell
            value={variant.pricePaisa !== null ? (variant.pricePaisa / 100).toFixed(0) : ""}
            displayValue={priceDisplay}
            onSave={handleSavePrice}
            type="number"
            placeholder="Inherit"
            disabled={disabled}
            label="Price (৳)"
            leftIcon={<span className="text-shade-50 text-body-md font-medium">৳</span>}
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
      <div className="border-t border-hairline-light/50">
        <button
          type="button"
          onClick={() => setShowImages(!showImages)}
          className="flex w-full items-center gap-1.5 px-3 py-1.5 text-micro text-shade-40 hover:text-ink hover:bg-canvas-cream/50 transition-colors"
          aria-expanded={showImages}
        >
          <ImageIcon className="h-3 w-3" />
          <span>Images</span>
          {showImages ? (
            <ChevronUp className="h-3 w-3 ml-auto" />
          ) : (
            <ChevronDown className="h-3 w-3 ml-auto" />
          )}
        </button>

        {showImages && (
          <div className="px-3 pb-3">
            <VariantImageUpload variantId={variant.id} disabled={disabled} />
          </div>
        )}
      </div>
    </div>
  );
}
