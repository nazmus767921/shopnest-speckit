"use client";

import { useCallback, useId, useState, useEffect } from "react";
import type { MetadataEntryInput } from "@/lib/validations/variants";
import { PlusIcon, XIcon, BookTextIcon, AlertCircleIcon, GripVerticalIcon } from "@/lib/icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface MetadataEditorProps {
  entries: MetadataEntryInput[];
  onChange: (entries: MetadataEntryInput[]) => void;
  disabled?: boolean;
}

interface LocalEntry {
  id: string;
  key: string;
  value: string;
}

const MAX_METADATA = 20;

const PRESETS = [
  { key: "Fabric", label: "Fabric" },
  { key: "Care Instructions", label: "Care" },
  { key: "Dimensions", label: "Dimensions" },
  { key: "Weight", label: "Weight" },
  { key: "Fit", label: "Fit" },
  { key: "Origin", label: "Origin" },
];

export function MetadataEditor({
  entries,
  onChange,
  disabled = false,
}: MetadataEditorProps) {
  const [localEntries, setLocalEntries] = useState<LocalEntry[]>([]);

  // Configure Dnd sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sync from parent if length changes or localEntries is empty
  useEffect(() => {
    if (entries.length !== localEntries.length) {
      setLocalEntries(
        entries.map((e) => ({
          id: crypto.randomUUID(),
          key: e.key,
          value: e.value,
        }))
      );
    }
  }, [entries, localEntries.length]);

  const addEntry = useCallback(() => {
    if (localEntries.length >= MAX_METADATA) return;
    const newEntry = { id: crypto.randomUUID(), key: "", value: "" };
    const updated = [...localEntries, newEntry];
    setLocalEntries(updated);
    onChange(updated.map(({ key, value }) => ({ key, value })));
  }, [localEntries, onChange]);

  const addPresetEntry = useCallback((presetKey: string) => {
    if (localEntries.length >= MAX_METADATA) return;
    if (localEntries.some((e) => e.key.toLowerCase() === presetKey.toLowerCase())) return;
    const newEntry = { id: crypto.randomUUID(), key: presetKey, value: "" };
    const updated = [...localEntries, newEntry];
    setLocalEntries(updated);
    onChange(updated.map(({ key, value }) => ({ key, value })));
  }, [localEntries, onChange]);

  const removeEntry = useCallback(
    (id: string) => {
      const updated = localEntries.filter((e) => e.id !== id);
      setLocalEntries(updated);
      onChange(updated.map(({ key, value }) => ({ key, value })));
    },
    [localEntries, onChange]
  );

  const updateEntry = useCallback(
    (id: string, field: "key" | "value", val: string) => {
      const updated = localEntries.map((e) =>
        e.id === id ? { ...e, [field]: val } : e
      );
      setLocalEntries(updated);
      onChange(updated.map(({ key, value }) => ({ key, value })));
    },
    [localEntries, onChange]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = localEntries.findIndex((e) => e.id === active.id);
        const newIndex = localEntries.findIndex((e) => e.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          const updated = arrayMove(localEntries, oldIndex, newIndex);
          setLocalEntries(updated);
          onChange(updated.map(({ key, value }) => ({ key, value })));
        }
      }
    },
    [localEntries, onChange]
  );

  if (entries.length === 0) {
    return (
      <div className="space-y-4 text-foreground">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Custom Metadata
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add details like fabric type, care instructions, or fit notes for the storefront
          </p>
        </div>

        <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BookTextIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <h4 className="text-base font-semibold text-foreground mb-1">
            No metadata yet
          </h4>
          <p className="text-xs text-muted-foreground mb-5 max-w-sm mx-auto">
            Metadata appears as a details table on the product page — perfect for
            specs, materials, and care instructions.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Button
              type="button"
              onClick={addEntry}
              disabled={disabled}
              aria-label="Add first metadata field"
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Field</span>
            </Button>

            {/* Quick presets when empty */}
            <div className="space-y-2 mt-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Or start with a preset
              </span>
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => addPresetEntry(preset.key)}
                    disabled={disabled}
                    className="px-2.5 py-1 text-xs rounded-full border border-border text-foreground hover:bg-muted/50 transition-colors cursor-pointer select-none"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Custom Metadata
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {localEntries.length} of {MAX_METADATA} fields used
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addEntry}
          disabled={disabled || localEntries.length >= MAX_METADATA}
          aria-label="Add metadata field"
          className="flex items-center gap-1.5 self-start sm:self-auto h-9"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span>Add Field</span>
        </Button>
      </div>

      {/* Preset pills */}
      <div className="space-y-2 bg-muted/10 p-3 rounded-lg border border-border/60">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
          Quick-Add Presets
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => {
            const isAlreadyAdded = localEntries.some(
              (e) => e.key.toLowerCase() === preset.key.toLowerCase()
            );
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => addPresetEntry(preset.key)}
                disabled={disabled || localEntries.length >= MAX_METADATA || isAlreadyAdded}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-full border transition-all cursor-pointer font-medium select-none flex items-center gap-1",
                  isAlreadyAdded
                    ? "bg-muted/50 border-border/40 text-muted-foreground/60 cursor-not-allowed"
                    : "bg-background border-border text-foreground hover:border-muted-foreground/30 hover:bg-muted/30"
                )}
              >
                <PlusIcon className="h-3 w-3" />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Entry List Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-[48px_1fr_2fr_48px] gap-3 bg-muted/40 px-3 py-2.5 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider items-center">
          <div className="text-center">Move</div>
          <div>Field Key</div>
          <div>Value</div>
          <div className="text-center">Delete</div>
        </div>

        {/* Table Body */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localEntries.map((e) => e.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="divide-y divide-border/60">
              {localEntries.map((entry, index) => (
                <SortableRow
                  key={entry.id}
                  id={entry.id}
                  entry={entry}
                  onUpdate={updateEntry}
                  onRemove={removeEntry}
                  disabled={disabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Limit notice */}
      {localEntries.length >= MAX_METADATA && (
        <div
          className="rounded-xl bg-amber-500/10 px-4 py-2.5 text-xs text-amber-600 dark:text-amber-500 flex items-center gap-2"
          role="alert"
        >
          <AlertCircleIcon className="h-4 w-4 shrink-0" />
          <span>Maximum of {MAX_METADATA} metadata entries reached.</span>
        </div>
      )}
    </div>
  );
}

interface SortableRowProps {
  id: string;
  entry: LocalEntry;
  onUpdate: (id: string, field: "key" | "value", val: string) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}

function SortableRow({
  id,
  entry,
  onUpdate,
  onRemove,
  disabled,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "grid grid-cols-[48px_1fr_2fr_48px] gap-3 items-center px-3 py-1.5 bg-card transition-all",
        isDragging && "shadow-lg bg-muted/40 relative z-50 ring-1 ring-primary/10"
      )}
    >
      {/* Drag handle */}
      <div className="flex justify-center">
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={disabled}
          className="cursor-grab active:cursor-grabbing p-1.5 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted rounded-md border-none bg-transparent"
          aria-label="Drag to reorder"
        >
          <GripVerticalIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Key Input */}
      <div className="min-w-0">
        <Input
          type="text"
          value={entry.key}
          onChange={(e) => onUpdate(entry.id, "key", e.target.value)}
          placeholder="Field key (e.g., Fabric)..."
          disabled={disabled}
          className="h-9 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 px-2"
        />
      </div>

      {/* Value Input */}
      <div className="min-w-0">
        <Input
          type="text"
          value={entry.value}
          onChange={(e) => onUpdate(entry.id, "value", e.target.value)}
          placeholder="Value (e.g., 100% Cotton)..."
          disabled={disabled}
          className="h-9 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 px-2"
        />
      </div>

      {/* Delete button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => onRemove(entry.id)}
          disabled={disabled}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors border-none bg-transparent cursor-pointer"
          aria-label="Remove row"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
