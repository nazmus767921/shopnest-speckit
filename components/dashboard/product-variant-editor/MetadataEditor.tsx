"use client";

import { useCallback, useId } from "react";
import type { MetadataEntryInput } from "@/lib/validations/variants";
import { Plus, X, BookText, AlertCircle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MetadataEditorProps {
  entries: MetadataEntryInput[];
  onChange: (entries: MetadataEntryInput[]) => void;
  disabled?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_METADATA = 20;

// ─── Component ───────────────────────────────────────────────────────────────

export function MetadataEditor({
  entries,
  onChange,
  disabled = false,
}: MetadataEditorProps) {
  const uid = useId();

  const addEntry = useCallback(() => {
    if (entries.length >= MAX_METADATA) return;
    onChange([...entries, { key: "", value: "" }]);
  }, [entries, onChange]);

  const removeEntry = useCallback(
    (index: number) => {
      onChange(entries.filter((_, i) => i !== index));
    },
    [entries, onChange],
  );

  const updateEntry = useCallback(
    (index: number, field: "key" | "value", value: string) => {
      const updated = entries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry,
      );
      onChange(updated);
    },
    [entries, onChange],
  );

  // ─── Empty State ───────────────────────────────────────────────────────

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-body-strong text-ink">
              Custom Metadata
            </h3>
            <p className="text-micro text-shade-50 mt-0.5">
              Add details like fabric type, care instructions, or fit notes for the storefront
            </p>
          </div>
        </div>

        <div className="rounded-lg border-2 border-dashed border-hairline-light bg-canvas-cream/30 p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-canvas-cream">
            <BookText className="h-5 w-5 text-shade-50" />
          </div>
          <h4 className="text-body-strong text-ink mb-1">
            No metadata yet
          </h4>
          <p className="text-caption text-shade-50 mb-5 max-w-sm mx-auto">
            Metadata appears as a details table on the product page — perfect for
            specs, materials, and care instructions.
          </p>
          <button
            type="button"
            onClick={addEntry}
            disabled={disabled}
            aria-label="Add first metadata field"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-body-md text-on-primary hover:bg-shade-70 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>Add Field</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-body-strong text-ink">
            Custom Metadata
          </h3>
          <p className="text-micro text-shade-50 mt-0.5">
            {entries.length} of {MAX_METADATA} fields used
          </p>
        </div>
        <button
          type="button"
          onClick={addEntry}
          disabled={disabled || entries.length >= MAX_METADATA}
          aria-label="Add metadata field"
          className="inline-flex items-center gap-1.5 rounded-full border border-hairline-light bg-canvas-light px-4 py-2 text-caption text-ink hover:bg-canvas-cream transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Field</span>
        </button>
      </div>

      {/* Entry List */}
      <div className="space-y-3" role="list" aria-label="Metadata entries">
        {entries.map((entry, index) => {
          const keyId = `${uid}-key-${index}`;
          const valId = `${uid}-val-${index}`;

          return (
            <div
              key={index}
              role="listitem"
              className="rounded-lg border border-hairline-light bg-canvas-cream/30 p-3 sm:p-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2 sm:gap-3 items-start">
                {/* Key */}
                <div>
                  <label
                    htmlFor={keyId}
                    className="sm:hidden mb-0.5 block text-micro text-shade-40"
                  >
                    Key
                  </label>
                  <input
                    id={keyId}
                    type="text"
                    value={entry.key}
                    onChange={(e) => updateEntry(index, "key", e.target.value)}
                    placeholder="e.g., Fabric"
                    disabled={disabled}
                    aria-label={`Metadata field ${index + 1} key`}
                    className="w-full rounded-md border border-hairline-light bg-canvas-light px-3 py-2 text-body-md text-ink placeholder:text-shade-40 transition-colors focus:border-ink focus:outline-none"
                  />
                </div>

                {/* Value */}
                <div>
                  <label
                    htmlFor={valId}
                    className="sm:hidden mb-0.5 block text-micro text-shade-40"
                  >
                    Value
                  </label>
                  <input
                    id={valId}
                    type="text"
                    value={entry.value}
                    onChange={(e) => updateEntry(index, "value", e.target.value)}
                    placeholder="e.g., Cotton"
                    disabled={disabled}
                    aria-label={`Metadata field ${index + 1} value`}
                    className="w-full rounded-md border border-hairline-light bg-canvas-light px-3 py-2 text-body-md text-ink placeholder:text-shade-40 transition-colors focus:border-ink focus:outline-none"
                  />
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  disabled={disabled}
                  aria-label={`Remove metadata field ${index + 1}`}
                  className="self-start sm:self-center justify-self-end sm:justify-self-center rounded-full p-2 text-shade-40 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Limit notice */}
      {entries.length >= MAX_METADATA && (
        <div
          className="rounded-lg bg-amber-50 px-4 py-2.5 text-caption text-amber-700 flex items-center gap-2"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Maximum of {MAX_METADATA} metadata entries reached.</span>
        </div>
      )}
    </div>
  );
}
