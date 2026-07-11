"use client";

import { useCallback, useMemo, useId, useState, useRef, useEffect } from "react";
import type { AttributeInput } from "@/lib/validations/variants";
import { PlusIcon, XIcon, Trash2Icon, PaletteIcon, ListIcon, CircleIcon, GripVerticalIcon } from "@/lib/icons";

import { DeleteAttributeDialog } from "@/components/dashboard/product-variant-editor/DeleteAttributeDialog";
import { RemoveOptionDialog } from "@/components/dashboard/attribute-editor/RemoveOptionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

interface AttributeEditorProps {
  attributes: AttributeInput[];
  onChange: (attributes: AttributeInput[]) => void;
  disabled?: boolean;
  estimatedExistingVariants?: number;
  productImages?: { storagePath: string }[];
  savedAttributes?: AttributeInput[];
}

const MAX_ATTRIBUTES = 3;
const MAX_OPTIONS = 10;

const DISPLAY_TYPES = [
  { value: "dropdown" as const, label: "Dropdown", icon: ListIcon },
  { value: "swatch" as const, label: "Color Swatch", icon: PaletteIcon },
  { value: "radio" as const, label: "Radio Buttons", icon: CircleIcon },
] as const;

const PREMIUM_COLORS = [
  { hex: "#ef4444", label: "Red" },
  { hex: "#f97316", label: "Orange" },
  { hex: "#f59e0b", label: "Amber" },
  { hex: "#10b981", label: "Emerald" },
  { hex: "#3b82f6", label: "Blue" },
  { hex: "#6366f1", label: "Indigo" },
  { hex: "#8b5cf6", label: "Violet" },
  { hex: "#ec4899", label: "Pink" },
  { hex: "#000000", label: "Black" },
  { hex: "#ffffff", label: "White" },
  { hex: "#f5f5f7", label: "Off White" },
  { hex: "#71717a", label: "Slate" },
];

const SEMANTIC_COLORS: Record<string, string> = {
  red: "#ef4444",
  crimson: "#991b1b",
  maroon: "#7f1d1d",
  orange: "#f97316",
  rust: "#c2410c",
  yellow: "#eab308",
  gold: "#d97706",
  green: "#22c55e",
  emerald: "#10b981",
  teal: "#0d9488",
  cyan: "#06b6d4",
  blue: "#3b82f6",
  navy: "#1e3a8a",
  indigo: "#6366f1",
  purple: "#a855f7",
  violet: "#8b5cf6",
  pink: "#ec4899",
  rose: "#f43f5e",
  black: "#000000",
  white: "#ffffff",
  cream: "#fef08a",
  beige: "#f5f5dc",
  khaki: "#f0e68c",
  grey: "#71717a",
  gray: "#71717a",
  brown: "#78350f",
  chocolate: "#451a03",
  olive: "#808000",
  peach: "#ffdab9",
  lavender: "#e6e6fa",
  mustard: "#e1ad01",
};

function matchSemanticColor(name: string): string | null {
  const lowercase = name.toLowerCase().trim();
  if (SEMANTIC_COLORS[lowercase]) return SEMANTIC_COLORS[lowercase];
  for (const [key, hex] of Object.entries(SEMANTIC_COLORS)) {
    if (lowercase.includes(key)) {
      return hex;
    }
  }
  return null;
}

// Client-side dominant colors extractor using canvas
function extractColorsFromImage(url: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve([]);

        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);

        const imageData = ctx.getImageData(0, 0, 50, 50).data;
        const colorCounts: Record<string, number> = {};

        for (let i = 0; i < imageData.length; i += 16) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];

          if (a < 128) continue;

          const factor = 24;
          const rRound = Math.round(r / factor) * factor;
          const gRound = Math.round(g / factor) * factor;
          const bRound = Math.round(b / factor) * factor;

          const hex = `#${((1 << 24) + (rRound << 16) + (gRound << 8) + bRound).toString(16).slice(1)}`;

          const brightness = (r + g + b) / 3;
          if (brightness > 242) continue; // skip pure white/gray backgrounds

          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }

        const sortedColors = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([hex]) => hex);

        resolve(sortedColors);
      } catch {
        resolve([]);
      }
    };
    img.onerror = () => resolve([]);
    img.src = url;
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || text.toLowerCase();
}

function estimateVariantCount(attributes: AttributeInput[]): number {
  return attributes.reduce((count, attr) => {
    const validOptions = attr.options.filter((o) => o.label.trim() && o.value.trim());
    return count * Math.max(validOptions.length, 1);
  }, attributes.length > 0 ? 1 : 0);
}

function estimateOptionVariantCount(
  attributes: AttributeInput[],
  attrIndex: number,
  optIndex: number,
): number {
  if (attributes.length === 0) return 0;
  const otherAttrCounts = attributes
    .filter((_, i) => i !== attrIndex)
    .map((a) => a.options.filter((o) => o.label.trim()).length)
    .filter((c) => c > 0);
  if (otherAttrCounts.length === 0) return 1;
  return otherAttrCounts.reduce((a, b) => a * b, 1);
}

// ─── Tag Input with Premium Color Picker & Image Presets ─────────────────────

const MAX_OPTION_LENGTH = 50;

function TagInput({
  options,
  displayType,
  extractedColors = [],
  onAddOption,
  onRemoveOption,
  onUpdateOptionColor,
  disabled,
}: {
  options: Array<{ label: string; value: string; swatchColor?: string }>;
  displayType: "swatch" | "dropdown" | "radio";
  extractedColors?: string[];
  onAddOption: (label: string, value: string, swatchColor?: string) => void;
  onRemoveOption: (index: number) => void;
  onUpdateOptionColor: (index: number, color: string) => void;
  disabled?: boolean;
}) {
  const [input, setInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activePickerIndex, setActivePickerIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActivePickerIndex(null);
      }
    }
    if (activePickerIndex !== null) {
      document.addEventListener("mousedown", clickOutside);
    }
    return () => document.removeEventListener("mousedown", clickOutside);
  }, [activePickerIndex]);

  const commitTag = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        setValidationError("Option value cannot be empty.");
        return;
      }
      if (trimmed.length > MAX_OPTION_LENGTH) {
        setValidationError(`Option value must be ${MAX_OPTION_LENGTH} characters or fewer.`);
        return;
      }
      if (options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase())) {
        setValidationError(`"${trimmed}" already exists.`);
        return;
      }
      setValidationError(null);

      // Smart semantic color matching or default color from index
      const matched = matchSemanticColor(trimmed);
      const defaultColor = displayType === "swatch"
        ? (matched || PREMIUM_COLORS[options.length % PREMIUM_COLORS.length].hex)
        : undefined;

      onAddOption(trimmed, slugify(trimmed), defaultColor);
      setInput("");
    },
    [options, displayType, onAddOption],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitTag(input);
      } else if (e.key === "Backspace" && input === "" && options.length > 0) {
        e.preventDefault();
        onRemoveOption(options.length - 1);
      } else {
        if (validationError) setValidationError(null);
      }
    },
    [input, options, commitTag, onRemoveOption, validationError],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
      if (validationError) setValidationError(null);
    },
    [validationError],
  );

  const canAdd = options.length < MAX_OPTIONS && !disabled;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-lg border px-2.5 py-1.5 min-h-[42px] transition-colors cursor-text text-foreground",
        disabled
          ? "border-border bg-muted/50 cursor-not-allowed"
          : validationError
            ? "border-destructive bg-destructive/10"
            : "border-border bg-card focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/45"
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {options.map((opt, i) => {
        const hasCustomColor = displayType === "swatch";
        const dotColor = opt.swatchColor || PREMIUM_COLORS[i % PREMIUM_COLORS.length].hex;

        return (
          <div
            key={i}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-semibold relative"
          >
            {/* Color preview circle */}
            {hasCustomColor && (
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePickerIndex(activePickerIndex === i ? null : i);
                }}
                style={{ backgroundColor: dotColor }}
                className="h-3 w-3 rounded-full shrink-0 border border-black/15 p-0 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                title="Choose Swatch Color"
              />
            )}

            <span className="truncate max-w-[120px]">{opt.label}</span>

            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveOption(i);
                }}
                className="ml-0.5 rounded p-0.5 text-muted-foreground opacity-60 hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all border-none bg-transparent cursor-pointer"
                aria-label={`Remove ${opt.label}`}
              >
                <XIcon className="h-3 w-3" />
              </button>
            )}

            {/* Custom Swatch Popover Color Picker */}
            {activePickerIndex === i && (
              <div
                ref={popoverRef}
                onClick={(e) => e.stopPropagation()}
                className="absolute z-50 top-full left-0 mt-1 bg-popover border border-border rounded-xl p-3 shadow-xl w-48 space-y-2.5 animate-in fade-in-50 duration-150"
              >
                {/* Extracted Colors Presets */}
                {extractedColors.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      From Product Images
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {extractedColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            onUpdateOptionColor(i, color);
                            setActivePickerIndex(null);
                          }}
                          style={{ backgroundColor: color }}
                          className={cn(
                            "w-6 h-6 rounded-full border border-black/15 hover:scale-110 active:scale-95 transition-transform cursor-pointer relative",
                            opt.swatchColor === color && "ring-2 ring-primary ring-offset-1"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Boutique Presets
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PREMIUM_COLORS.map((pc) => (
                      <button
                        key={pc.hex}
                        type="button"
                        onClick={() => {
                          onUpdateOptionColor(i, pc.hex);
                          setActivePickerIndex(null);
                        }}
                        style={{ backgroundColor: pc.hex }}
                        className={cn(
                          "w-6 h-6 rounded-full border border-black/15 hover:scale-110 active:scale-95 transition-transform cursor-pointer relative",
                          opt.swatchColor === pc.hex && "ring-2 ring-primary ring-offset-1"
                        )}
                        title={pc.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-2 mt-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Custom Color
                  </span>
                  <div className="relative flex items-center justify-center w-6 h-6 rounded-full border border-border overflow-hidden bg-background cursor-pointer">
                    <input
                      type="color"
                      value={opt.swatchColor || "#000000"}
                      onChange={(e) => onUpdateOptionColor(i, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-black/15"
                      style={{ backgroundColor: opt.swatchColor || "#000000" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {canAdd && (
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={options.length === 0 ? "Type option and press Enter..." : "Add option..."}
          disabled={disabled}
          className="min-w-[80px] flex-1 border-none bg-transparent py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      )}

      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-semibold ml-auto shrink-0 select-none">
        <span className={cn(
          "h-1.5 w-1.5 rounded-full",
          options.length >= MAX_OPTIONS ? "bg-amber-500" : "bg-primary/60"
        )} />
        {options.length}/{MAX_OPTIONS}
      </span>

      {validationError && (
        <div className="w-full text-xs text-destructive mt-1 font-semibold">
          {validationError}
        </div>
      )}
    </div>
  );
}

// ─── Dynamic Attribute Row ───────────────────────────────────────────────────

function AttributeRow({
  attr,
  attrIndex,
  extractedColors = [],
  onUpdate,
  onDelete,
  onRemoveOption,
  disabled,
}: {
  attr: AttributeInput;
  attrIndex: number;
  extractedColors?: string[];
  onUpdate: (index: number, field: keyof AttributeInput, value: any) => void;
  onDelete: (index: number) => void;
  onRemoveOption: (attrIndex: number, optIndex: number) => void;
  disabled?: boolean;
}) {
  const rowId = useId();

  const handleUpdateColor = useCallback(
    (optIndex: number, newColor: string) => {
      const updatedOptions = attr.options.map((opt, i) =>
        i === optIndex ? { ...opt, swatchColor: newColor } : opt
      );
      onUpdate(attrIndex, "options", updatedOptions);
    },
    [attrIndex, attr.options, onUpdate]
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border bg-card p-3 text-foreground">
      {/* Attribute Name Input */}
      <div className="w-full sm:w-[180px] shrink-0">
        <label className="sm:hidden text-xs text-muted-foreground mb-1 block">Attribute Name</label>
        <Input
          id={`${rowId}-name`}
          type="text"
          value={attr.name}
          onChange={(e) => onUpdate(attrIndex, "name", e.target.value)}
          placeholder="e.g. Color"
          disabled={disabled}
          className="w-full h-9"
        />
      </div>

      {/* Inline Display Type Selector Button Group */}
      <div className="flex flex-col shrink-0">
        <label className="sm:hidden text-xs text-muted-foreground mb-1 block">Display Type</label>
        <div className="flex bg-muted/40 rounded-lg p-0.5 border border-border shrink-0 h-9 items-center">
          {DISPLAY_TYPES.map((dt) => {
            const Icon = dt.icon;
            const isActive = attr.displayType === dt.value;
            return (
              <button
                key={dt.value}
                type="button"
                onClick={() => onUpdate(attrIndex, "displayType", dt.value)}
                disabled={disabled}
                className={cn(
                  "p-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center border-none h-7 bg-transparent",
                  isActive
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={`Display as ${dt.label}`}
              >
                <Icon className="h-4 w-4" />
                <span className="sr-only">{dt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tag Input */}
      <div className="flex-1 min-w-0">
        <label className="sm:hidden text-xs text-muted-foreground mb-1 block">Options</label>
        <TagInput
          options={attr.options}
          displayType={attr.displayType}
          extractedColors={extractedColors}
          onAddOption={(label, value, swatchColor) => {
            const updated = [...attr.options, { label, value, swatchColor }];
            onUpdate(attrIndex, "options", updated as any);
          }}
          onRemoveOption={(optIndex) => {
            onRemoveOption(attrIndex, optIndex);
          }}
          onUpdateOptionColor={handleUpdateColor}
          disabled={disabled}
        />
      </div>

      {/* Delete Attribute Button */}
      <div className="order-first sm:order-last self-end sm:self-center">
        <Button
          type="button"
          onClick={() => onDelete(attrIndex)}
          disabled={disabled}
          variant={'destructive'}
          size={'icon-sm'}
          className="shrink-0 border-none bg-transparent! hover:bg-destructive/20!"
          title="Remove Attribute"
        >
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AttributeEditor({
  attributes,
  onChange,
  disabled = false,
  estimatedExistingVariants,
  productImages = [],
  savedAttributes = [],
}: AttributeEditorProps) {
  const variantCount = useMemo(() => estimateVariantCount(attributes), [attributes]);
  const canAddAttribute = attributes.length < MAX_ATTRIBUTES && !disabled;

  const [pendingDeleteAttr, setPendingDeleteAttr] = useState<number | null>(null);
  const [pendingRemoveOption, setPendingRemoveOption] = useState<{
    attrIndex: number;
    optIndex: number;
  } | null>(null);

  const [extractedColors, setExtractedColors] = useState<string[]>([]);

  // Extract colors from cover image on mount or when images change
  useEffect(() => {
    async function getColors() {
      if (productImages.length === 0) return;

      // Use cover image (first image)
      const coverImage = productImages[0];
      if (!coverImage) return;

      const publicUrl = supabase.storage
        .from("product-images")
        .getPublicUrl(coverImage.storagePath).data.publicUrl;

      const colors = await extractColorsFromImage(publicUrl);
      if (colors.length > 0) {
        setExtractedColors(colors);
      }
    }
    getColors();
  }, [productImages]);

  const addAttribute = useCallback(() => {
    if (!canAddAttribute) return;
    onChange([
      ...attributes,
      {
        name: "",
        displayType: "dropdown",
        options: [],
      },
    ]);
  }, [attributes, onChange, canAddAttribute]);

  const updateAttribute = useCallback(
    (attrIndex: number, field: keyof AttributeInput, value: any) => {
      const updated = [...attributes];
      (updated[attrIndex] as any)[field] = value;
      onChange(updated);
    },
    [attributes, onChange],
  );

  const requestDeleteAttribute = useCallback(
    (attrIndex: number) => {
      if (attributes[attrIndex]?.options.length === 0) {
        onChange(attributes.filter((_, i) => i !== attrIndex));
        return;
      }
      setPendingDeleteAttr(attrIndex);
    },
    [attributes, onChange],
  );

  const confirmDeleteAttribute = useCallback(() => {
    if (pendingDeleteAttr !== null) {
      onChange(attributes.filter((_, i) => i !== pendingDeleteAttr));
      setPendingDeleteAttr(null);
    }
  }, [attributes, onChange, pendingDeleteAttr]);

  const requestRemoveOption = useCallback(
    (attrIndex: number, optIndex: number) => {
      const currentAttr = attributes[attrIndex];
      const optionToRemove = currentAttr?.options[optIndex];

      // Find the corresponding saved attribute
      const savedAttr = savedAttributes.find(
        (sa, idx) => idx === attrIndex || sa.name.toLowerCase() === currentAttr.name.toLowerCase()
      );

      const isSavedOption = savedAttr?.options.some(
        (so) => so.label.toLowerCase() === optionToRemove?.label.toLowerCase()
      );

      if (!isSavedOption || !estimatedExistingVariants || estimatedExistingVariants === 0) {
        const updated = [...attributes];
        updated[attrIndex] = {
          ...updated[attrIndex],
          options: updated[attrIndex].options.filter((_, i) => i !== optIndex),
        };
        onChange(updated);
        return;
      }
      setPendingRemoveOption({ attrIndex, optIndex });
    },
    [attributes, onChange, estimatedExistingVariants, savedAttributes],
  );

  const confirmRemoveOption = useCallback(() => {
    if (pendingRemoveOption) {
      const { attrIndex, optIndex } = pendingRemoveOption;
      const updated = [...attributes];
      updated[attrIndex] = {
        ...updated[attrIndex],
        options: updated[attrIndex].options.filter((_, i) => i !== optIndex),
      };
      onChange(updated);
      setPendingRemoveOption(null);
    }
  }, [attributes, onChange, pendingRemoveOption]);

  const pendingDeleteAttrData = pendingDeleteAttr !== null
    ? attributes[pendingDeleteAttr]
    : null;

  const pendingRemoveOptionData = pendingRemoveOption
    ? attributes[pendingRemoveOption.attrIndex]?.options[pendingRemoveOption.optIndex]
    : null;

  const deleteAttrVariantCount = pendingDeleteAttr !== null
    ? estimateOptionVariantCount(attributes, pendingDeleteAttr, -1)
    : 0;

  const removeOptionVariantCount = pendingRemoveOption
    ? estimateOptionVariantCount(
      attributes,
      pendingRemoveOption.attrIndex,
      pendingRemoveOption.optIndex,
    )
    : 0;

  return (
    <div className="space-y-3 text-foreground" role="region" aria-label="Product attribute editor">
      {/* Empty State */}
      {attributes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <PlusIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <h4 className="text-base font-semibold text-foreground mb-1">No attributes yet</h4>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
            Add attributes like Color, Size, or Material. Each attribute&apos;s options are combined to create unique variants.
          </p>
          <Button
            type="button"
            onClick={addAttribute}
            disabled={!canAddAttribute}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Attribute</span>
          </Button>
        </div>
      ) : (
        <>
          {/* Attribute rows */}
          <div className="space-y-2">
            {attributes.map((attr, i) => (
              <AttributeRow
                key={i}
                attr={attr}
                attrIndex={i}
                extractedColors={extractedColors}
                onUpdate={updateAttribute}
                onDelete={requestDeleteAttribute}
                onRemoveOption={requestRemoveOption}
                disabled={disabled}
              />
            ))}
          </div>

          {/* Variant count indicator */}
          {variantCount > 0 && (
            <div
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-semibold",
                variantCount > 1000
                  ? "bg-destructive/10 text-destructive"
                  : variantCount > 100
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-500"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-350"
              )}
              role="status"
              aria-live="polite"
            >
              {variantCount > 1000 ? (
                <span>⚠️ {variantCount.toLocaleString()} variants — exceeds 1,000 limit. Reduce options.</span>
              ) : (
                <span>{variantCount.toLocaleString()} variant{variantCount !== 1 ? "s" : ""} will be generated</span>
              )}
            </div>
          )}

          {/* Add Attribute button */}
          {canAddAttribute && (
            <Button
              type="button"
              variant="outline"
              onClick={addAttribute}
              className="w-full justify-center border-dashed flex items-center gap-1.5 rounded-sm"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>Add {attributes.length >= MAX_ATTRIBUTES ? "" : "Another Attribute"}</span>
              <span className="text-xs text-muted-foreground ml-1">
                ({MAX_ATTRIBUTES - attributes.length} left)
              </span>
            </Button>
          )}
        </>
      )}

      <DeleteAttributeDialog
        open={pendingDeleteAttr !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteAttr(null);
        }}
        attributeName={pendingDeleteAttrData?.name || "this attribute"}
        variantCount={deleteAttrVariantCount}
        onConfirm={confirmDeleteAttribute}
      />

      <RemoveOptionDialog
        open={pendingRemoveOption !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveOption(null);
        }}
        optionLabel={pendingRemoveOptionData?.label || "this option"}
        variantCount={removeOptionVariantCount}
        onConfirm={confirmRemoveOption}
      />
    </div>
  );
}
