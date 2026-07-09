"use client";

import { useCallback, useMemo, useId, useState, useRef, useEffect } from "react";
import type { AttributeInput } from "@/lib/validations/variants";
import { Plus, X, MoreVertical, Trash2, Palette, List, Circle } from "lucide-react";
import { DeleteAttributeDialog } from "@/components/dashboard/product-variant-editor/DeleteAttributeDialog";
import { RemoveOptionDialog } from "@/components/dashboard/attribute-editor/RemoveOptionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AttributeEditorProps {
  attributes: AttributeInput[];
  onChange: (attributes: AttributeInput[]) => void;
  disabled?: boolean;
  estimatedExistingVariants?: number;
}

const MAX_ATTRIBUTES = 3;
const MAX_OPTIONS = 10;

const DISPLAY_TYPES = [
  { value: "dropdown" as const, label: "Dropdown", icon: List },
  { value: "swatch" as const, label: "Color Swatch", icon: Palette },
  { value: "radio" as const, label: "Radio Buttons", icon: Circle },
] as const;

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

// ─── Three-Dot Menu ──────────────────────────────────────────────────────────

function ThreeDotMenu({
  onDelete,
  displayType,
  onDisplayTypeChange,
  disabled,
}: {
  onDelete: () => void;
  displayType: string;
  onDisplayTypeChange: (t: "swatch" | "dropdown" | "radio") => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 border-none bg-transparent cursor-pointer"
        aria-label="Attribute options"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-border bg-popover py-1 shadow-md"
          role="menu"
        >
          <div className="px-3 py-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Display Type
          </div>
          {DISPLAY_TYPES.map((dt) => {
            const Icon = dt.icon;
            const isActive = displayType === dt.value;
            return (
              <button
                key={dt.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  onDisplayTypeChange(dt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors cursor-pointer border-none",
                  isActive
                    ? "bg-primary/10 text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{dt.label}</span>
                {isActive && <span className="ml-auto text-primary font-bold">✓</span>}
              </button>
            );
          })}

          <div className="my-1 border-t border-border" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer border-none"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Attribute</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tag Input ───────────────────────────────────────────────────────────────

const MAX_OPTION_LENGTH = 50;

function TagInput({
  options,
  onAddOption,
  onRemoveOption,
  disabled,
}: {
  options: Array<{ label: string; value: string }>;
  onAddOption: (label: string, value: string) => void;
  onRemoveOption: (index: number) => void;
  disabled?: boolean;
}) {
  const [input, setInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      onAddOption(trimmed, slugify(trimmed));
      setInput("");
    },
    [options, onAddOption],
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
      {options.map((opt, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-semibold"
        >
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{
              backgroundColor: ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#a855f7"][i % 10],
            }}
          />
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
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}

      {canAdd && (
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={options.length === 0 ? "Type and press Enter..." : "Add more..."}
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
  onUpdate,
  onDelete,
  onRemoveOption,
  disabled,
}: {
  attr: AttributeInput;
  attrIndex: number;
  onUpdate: (index: number, field: keyof AttributeInput, value: string) => void;
  onDelete: (index: number) => void;
  onRemoveOption: (attrIndex: number, optIndex: number) => void;
  disabled?: boolean;
}) {
  const rowId = useId();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-border bg-card p-3 text-foreground">
      {/* Three-dot Menu */}
      <div className="order-first sm:order-last self-end sm:self-center">
        <ThreeDotMenu
          onDelete={() => onDelete(attrIndex)}
          displayType={attr.displayType}
          onDisplayTypeChange={(t) => onUpdate(attrIndex, "displayType", t)}
          disabled={disabled}
        />
      </div>

      {/* Attribute Name Input */}
      <div className="w-full sm:w-[200px] shrink-0">
        <label className="sm:hidden text-xs text-muted-foreground mb-1 block">Attribute Name</label>
        <Input
          id={`${rowId}-name`}
          type="text"
          value={attr.name}
          onChange={(e) => onUpdate(attrIndex, "name", e.target.value)}
          placeholder="e.g. Color"
          disabled={disabled}
          className="w-full"
        />
      </div>

      {/* Tag Input */}
      <div className="flex-1 min-w-0">
        <label className="sm:hidden text-xs text-muted-foreground mb-1 block">Options</label>
        <TagInput
          options={attr.options}
          onAddOption={(label, value) => {
            const updated = [...attr.options, { label, value }];
            onUpdate(attrIndex, "options", updated as any);
          }}
          onRemoveOption={(optIndex) => {
            onRemoveOption(attrIndex, optIndex);
          }}
          disabled={disabled}
        />
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
}: AttributeEditorProps) {
  const variantCount = useMemo(() => estimateVariantCount(attributes), [attributes]);
  const canAddAttribute = attributes.length < MAX_ATTRIBUTES && !disabled;

  const [pendingDeleteAttr, setPendingDeleteAttr] = useState<number | null>(null);
  const [pendingRemoveOption, setPendingRemoveOption] = useState<{
    attrIndex: number;
    optIndex: number;
  } | null>(null);

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
      if (!estimatedExistingVariants || estimatedExistingVariants === 0) {
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
    [attributes, onChange, estimatedExistingVariants],
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
            <Plus className="h-5 w-5 text-muted-foreground" />
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
            <Plus className="h-4 w-4" />
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
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
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
              className="w-full justify-center border-dashed flex items-center gap-1.5 rounded-full"
            >
              <Plus className="h-3.5 w-3.5" />
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
