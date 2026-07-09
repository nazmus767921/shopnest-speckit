"use client";

import { useCallback, useId } from "react";
import type { MetadataEntryInput } from "@/lib/validations/variants";
import { Plus, X, BookText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MetadataEditorProps {
  entries: MetadataEntryInput[];
  onChange: (entries: MetadataEntryInput[]) => void;
  disabled?: boolean;
}

const MAX_METADATA = 20;

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

  if (entries.length === 0) {
    return (
      <div className="space-y-4 text-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Custom Metadata
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add details like fabric type, care instructions, or fit notes for the storefront
            </p>
          </div>
        </div>

        <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BookText className="h-5 w-5 text-muted-foreground" />
          </div>
          <h4 className="text-base font-semibold text-foreground mb-1">
            No metadata yet
          </h4>
          <p className="text-xs text-muted-foreground mb-5 max-w-sm mx-auto">
            Metadata appears as a details table on the product page — perfect for
            specs, materials, and care instructions.
          </p>
          <Button
            type="button"
            onClick={addEntry}
            disabled={disabled}
            aria-label="Add first metadata field"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Field</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Custom Metadata
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {entries.length} of {MAX_METADATA} fields used
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addEntry}
          disabled={disabled || entries.length >= MAX_METADATA}
          aria-label="Add metadata field"
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Field</span>
        </Button>
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
              className="rounded-xl border border-border bg-muted/20 p-3 sm:p-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2 sm:gap-3 items-start">
                {/* Key */}
                <div>
                  <label
                    htmlFor={keyId}
                    className="sm:hidden mb-1 block text-xs font-semibold text-muted-foreground"
                  >
                    Key
                  </label>
                  <Input
                    id={keyId}
                    type="text"
                    value={entry.key}
                    onChange={(e) => updateEntry(index, "key", e.target.value)}
                    placeholder="e.g., Fabric"
                    disabled={disabled}
                    aria-label={`Metadata field ${index + 1} key`}
                    className="w-full text-sm"
                  />
                </div>

                {/* Value */}
                <div>
                  <label
                    htmlFor={valId}
                    className="sm:hidden mb-1 block text-xs font-semibold text-muted-foreground"
                  >
                    Value
                  </label>
                  <Input
                    id={valId}
                    type="text"
                    value={entry.value}
                    onChange={(e) => updateEntry(index, "value", e.target.value)}
                    placeholder="e.g., Cotton"
                    disabled={disabled}
                    aria-label={`Metadata field ${index + 1} value`}
                    className="w-full text-sm"
                  />
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  disabled={disabled}
                  aria-label={`Remove metadata field ${index + 1}`}
                  className="self-start sm:self-center justify-self-end sm:justify-self-center rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50 border-none bg-transparent cursor-pointer"
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
          className="rounded-xl bg-amber-500/10 px-4 py-2.5 text-xs text-amber-600 dark:text-amber-500 flex items-center gap-2"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Maximum of {MAX_METADATA} metadata entries reached.</span>
        </div>
      )}
    </div>
  );
}
