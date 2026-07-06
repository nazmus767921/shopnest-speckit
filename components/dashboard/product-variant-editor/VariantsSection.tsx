"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { saveProductAttributesAction, updateVariantAction, bulkUpdateVariantsAction, getProductVariantsAction, getProductAttributeOptionsAction } from "@/app/actions/variants";
import { AttributeEditor } from "@/components/dashboard/attribute-editor/AttributeEditor";
import { VariantRowEditor, type VariantRow } from "./VariantRowEditor";
import { VariantBulkToolbar } from "./VariantBulkToolbar";
import { VariantFilterBar, type FilterCriteria } from "./VariantFilterBar";
import type { AttributeInput, VariantUpdateInput } from "@/lib/validations/variants";
import { Save, RefreshCw, Loader2, AlertCircle, CheckCircle2, Tags, Layers } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface VariantsSectionProps {
  productId: string;
  hasVariants: boolean;
  baseSku: string;
  basePricePaisa: number;
}

interface VariantFromDb {
  id: string;
  sku: string;
  pricePaisa: number | null;
  compareAtPricePaisa: number | null;
  stockCount: number;
  isActive: boolean;
  sortOrder: number;
  attributeLinks?: Array<{
    attributeOption: {
      value: string;
      attribute: { name: string };
    };
  }>;
}

// ─── Fetch variants ──────────────────────────────────────────────────────────

async function fetchVariants(productId: string): Promise<{
  attributes: AttributeInput[];
  variants: VariantFromDb[];
}> {
  const res = await getProductVariantsAction(productId);
  if (!res.success) throw new Error(res.error);

  // Server action now returns attributes WITH options (join query) and
  // variants WITH attributeCombination — no N+1 option fetches needed.
  return {
    attributes: res.attributes.map((attr) => ({
      name: attr.name,
      displayType: attr.displayType as "swatch" | "dropdown" | "radio",
      options: attr.options.map((opt) => ({
        label: opt.label,
        value: opt.value,
        swatchColor: opt.swatchColor ?? undefined,
      })),
    })),
    variants: res.variants as VariantFromDb[],
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VariantsSection({
  productId,
  hasVariants,
  baseSku,
  basePricePaisa,
}: VariantsSectionProps) {
  const queryClient = useQueryClient();
  // Snapshot of saved attributes to detect unsaved changes
  // MUST be declared before useState initializer that references it.
  const savedAttrsRef = useRef<AttributeInput[]>([]);

  // Initialize from query cache to prevent flash on tab switch.
  // When the component re-mounts (tab switch), the cache has data within
  // staleTime, so we hydrate state synchronously before the first render.
  const [attributes, setAttributes] = useState<AttributeInput[]>(
    () => {
      const cached = queryClient.getQueryData(["product-variants", productId]);
      const attrs = (cached as { attributes: AttributeInput[] } | undefined)?.attributes ?? [];
      if (attrs.length > 0) {
        savedAttrsRef.current = JSON.parse(JSON.stringify(attrs));
      }
      return attrs;
    },
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [focusedRowIndex, setFocusedRowIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<{
    variants: Array<{ id: string; pricePaisa: number | null; compareAtPricePaisa: number | null; stockCount: number; isActive: boolean; sku: string }>;
    appliedData: any;
  } | null>(null);
  const [filters, setFilters] = useState<FilterCriteria>({
    skuQuery: "",
    stockFilter: "all",
    statusFilter: "all",
    attributeFilters: {},
  });

  // Fetch variants
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["product-variants", productId],
    queryFn: () => fetchVariants(productId),
    staleTime: 30_000,
  });

  const hasGeneratedData = data && data.variants.length > 0;

  // Load existing attributes into the editor when data arrives
  useEffect(() => {
    if (data && data.attributes.length > 0 && attributes.length === 0) {
      savedAttrsRef.current = JSON.parse(JSON.stringify(data.attributes));
      setAttributes(data.attributes);
    }
  }, [data, attributes.length]);

  // Derive disabled state: no options, OR no unsaved changes (when variants exist)
  const hasAnyOptions = attributes.some((a) => a.options.length > 0);
  const hasUnsavedChanges =
    JSON.stringify(attributes) !== JSON.stringify(savedAttrsRef.current);
  const saveDisabled =
    !hasAnyOptions || (hasGeneratedData && !hasUnsavedChanges);

  // ── Manual Save: persists attributes + generates/reconciles variants ─────

  const handleSave = useCallback(async () => {
    const anyOptions = attributes.some((a) => a.options.length > 0);
    if (!anyOptions) {
      setMessage({ type: "error", text: "Add at least one option before saving." });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const result = await saveProductAttributesAction(productId, attributes);
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        queryClient.invalidateQueries({
          queryKey: ["product-variants", productId],
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: result.error });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save attributes",
      });
    } finally {
      setIsSaving(false);
    }
  }, [productId, attributes, queryClient]);

  // ── Update variant (inline cell edit) ────────────────────────────────────

  const handleUpdateVariant = useCallback(
    async (variantId: string, variantData: VariantUpdateInput) => {
      const result = await updateVariantAction(variantId, variantData);
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: ["product-variants", productId],
        });
      } else {
        throw new Error(result.error);
      }
    },
    [productId, queryClient],
  );



  // Filtered variants
  const filteredVariants = useMemo(() => {
    if (!data) return [];
    let result = data.variants;

    if (filters.skuQuery) {
      const q = filters.skuQuery.toLowerCase();
      result = result.filter((v: any) => v.sku.toLowerCase().includes(q));
    }
    if (filters.stockFilter === "in_stock") {
      result = result.filter((v: any) => v.stockCount > 0);
    } else if (filters.stockFilter === "out_of_stock") {
      result = result.filter((v: any) => v.stockCount === 0);
    } else if (filters.stockFilter === "low_stock") {
      result = result.filter((v: any) => v.stockCount > 0 && v.stockCount <= 10);
    }
    if (filters.statusFilter === "active") {
      result = result.filter((v: any) => v.isActive);
    } else if (filters.statusFilter === "inactive") {
      result = result.filter((v: any) => !v.isActive);
    }
    return result;
  }, [data, filters]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredVariants.length / 25));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedVariants = filteredVariants.slice(
    safePage * 25,
    (safePage + 1) * 25,
  );

  // Keyboard navigation: arrow keys
  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const rowCount = paginatedVariants.length;
      if (rowCount === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedRowIndex((prev) => Math.min(prev + 1, rowCount - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedRowIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Home":
          e.preventDefault();
          setFocusedRowIndex(0);
          break;
        case "End":
          e.preventDefault();
          setFocusedRowIndex(rowCount - 1);
          break;
      }
    },
    [paginatedVariants.length],
  );

  // Focus the focused row
  useEffect(() => {
    if (!gridRef.current) return;
    const row = gridRef.current.querySelector<HTMLElement>(
      `[data-row-index="${focusedRowIndex}"]`,
    );
    row?.focus();
  }, [focusedRowIndex]);

  // Reset page and focused row when filters change
  useEffect(() => {
    setPage(0);
    setFocusedRowIndex(0);
  }, [filters, data]);

  // ── Loading Skeleton ──
  if (isLoading) {
    return (
      <div className="space-y-4" aria-label="Loading variant data">
        {/* Attribute editor skeleton */}
        <div className="relative overflow-hidden rounded-lg border border-hairline-light bg-canvas-light p-4 sm:p-6">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-shade-30/60 to-shade-30/20" aria-hidden="true" />
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-shade-30/30">
              <div className="h-4 w-4 rounded bg-shade-30/50" />
            </div>
            <div>
              <div className="h-5 w-40 rounded bg-shade-30/50 animate-pulse" />
              <div className="h-3 w-64 rounded bg-shade-30/30 animate-pulse mt-1.5" />
            </div>
          </div>
          {/* Attribute row skeleton */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="h-[42px] w-[200px] rounded-md bg-shade-30/30 animate-pulse" />
              <div className="h-[42px] flex-1 rounded-md bg-shade-30/30 animate-pulse" />
              <div className="h-[42px] w-[32px] rounded-md bg-shade-30/30 animate-pulse" />
            </div>
          </div>
          {/* Add button skeleton */}
          <div className="mt-4 pt-4 border-t border-hairline-light">
            <div className="h-5 w-32 rounded bg-shade-30/30 animate-pulse" />
          </div>
        </div>

        {/* Variant table skeleton */}
        <div className="rounded-lg border border-hairline-light bg-canvas-light overflow-hidden">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-hairline-light bg-canvas-cream/40">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-shade-30/30">
              <div className="h-4 w-4 rounded bg-shade-30/40" />
            </div>
            <div className="h-5 w-20 rounded bg-shade-30/50 animate-pulse" />
            <div className="h-5 w-10 rounded bg-shade-30/30 animate-pulse" />
          </div>
          <div className="p-4 sm:p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2 h-10">
                <div className="h-4 w-4 rounded bg-shade-30/30 animate-pulse" />
                <div className="h-2 w-2 rounded-full bg-shade-30/30" />
                <div className="h-5 w-24 rounded bg-shade-30/40 animate-pulse" />
                <div className="h-5 w-32 rounded bg-shade-30/30 animate-pulse" />
                <div className="h-5 w-20 rounded bg-shade-30/40 animate-pulse" />
                <div className="h-5 w-20 rounded bg-shade-30/30 animate-pulse" />
                <div className="h-5 w-16 rounded bg-shade-30/40 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (isError) {
    return (
      <div className="rounded-lg border border-hairline-light bg-canvas-light overflow-hidden">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-hairline-light bg-canvas-cream/40">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-400" />
          </div>
          <h3 className="text-body-strong text-ink">Variants</h3>
        </div>
        <div className="flex items-center justify-center min-h-[160px]">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-300" />
            <p className="text-body-md text-shade-50 mb-3">Could not load variant data</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-full border border-hairline-light px-4 py-2 text-caption text-ink hover:bg-canvas-cream transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Screen reader live region ──
  const announcement = data
    ? `${paginatedVariants.length} of ${filteredVariants.length} variants shown`
    : "";

  // ── Normal UI ──
  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
        {selectedIds.size > 0 && `, ${selectedIds.size} selected`}
      </div>
      <div className="space-y-4">
      {/* ── Attribute Editor ── */}
      <div className="relative overflow-hidden rounded-lg border border-hairline-light bg-canvas-light p-4 sm:p-6">
        {/* Left accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/60 to-primary/10" aria-hidden="true" />

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/5">
            <Tags className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-body-strong text-ink">Product Attributes</h2>
            <p className="text-micro text-shade-50 mt-0.5">
              Define options like Color, Size, or Material. Save to generate variants.
            </p>
          </div>
        </div>

        <AttributeEditor
          attributes={attributes}
          onChange={setAttributes}
          estimatedExistingVariants={data?.variants.length ?? 0}
        />

        {/* Status message */}
        {message && (
          <div
            className={`mt-4 flex items-center gap-1.5 text-caption ${
              message.type === "success" ? "text-shade-50" : "text-red-500"
            }`}
            role="alert"
            aria-live="polite"
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Save & Generate button */}
        <div className="mt-4 flex items-center justify-end gap-3 pt-4 border-t border-hairline-light">
          <button
            type="button"
            onClick={handleSave}
            disabled={saveDisabled || isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-body-md text-on-primary hover:bg-shade-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 transition-colors disabled:opacity-50 w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save &amp; Generate</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Variant Table ── */}
      {hasGeneratedData && (
        <div className="rounded-lg border border-hairline-light bg-canvas-light overflow-hidden">
          {/* Header row with integrated filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-hairline-light bg-canvas-cream/40">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-body-strong text-ink">Variants</h3>
              <span
                className="inline-flex items-center gap-1 rounded-md bg-primary/5 border border-primary/10 px-2 py-0.5 text-micro font-semibold text-ink"
                aria-label={`${data.variants.length} variants total`}
              >
                <Layers className="h-3 w-3 text-primary/60" />
                {data.variants.length}
              </span>
            </div>

            <div className="flex-1 max-w-lg">
              <VariantFilterBar
                attributes={data?.attributes ?? []}
                onFilterChange={setFilters}
              />
            </div>
          </div>

          {/* Bulk toolbar */}
          <div className="px-4 sm:px-6 py-2 border-b border-hairline-light">
            <VariantBulkToolbar
              selectedCount={selectedIds.size}
              totalCount={filteredVariants.length}
              onSelectAll={() => {
                setSelectedIds(new Set(filteredVariants.map((v: any) => v.id)));
              }}
              onDeselectAll={() => setSelectedIds(new Set())}
              onBulkUpdate={async (bulkData: any) => {
                // Capture pre-update state for undo
                const affectedVariants = data?.variants
                  .filter((v: any) => selectedIds.has(v.id))
                  .map((v: any) => ({
                    id: v.id,
                    pricePaisa: v.pricePaisa,
                    compareAtPricePaisa: v.compareAtPricePaisa,
                    stockCount: v.stockCount,
                    isActive: v.isActive,
                    sku: v.sku,
                  })) || [];

                const result = await bulkUpdateVariantsAction({
                  ...bulkData,
                  variantIds: Array.from(selectedIds),
                });
                if (result.success) {
                  setUndoSnapshot({ variants: affectedVariants, appliedData: bulkData });
                  queryClient.invalidateQueries({
                    queryKey: ["product-variants", productId],
                  });
                  setSelectedIds(new Set());
                  // Clear undo snapshot after 10 seconds
                  setTimeout(() => setUndoSnapshot(null), 10_000);
                } else {
                  throw new Error(result.error);
                }
              }}
              undoSnapshot={undoSnapshot}
              onUndo={async () => {
                if (!undoSnapshot) return;
                // Restore each variant to its previous state
                for (const v of undoSnapshot.variants) {
                  await updateVariantAction(v.id, {
                    pricePaisa: v.pricePaisa,
                    compareAtPricePaisa: v.compareAtPricePaisa,
                    stockCount: v.stockCount,
                    isActive: v.isActive,
                    sku: v.sku,
                  });
                }
                setUndoSnapshot(null);
                queryClient.invalidateQueries({
                  queryKey: ["product-variants", productId],
                });
              }}
            />
          </div>

          {/* Variant list (grid) */}
          <div
            ref={gridRef}
            className="p-4 sm:p-6 pt-3 space-y-2"
            role="grid"
            aria-label="Variants table"
            aria-rowcount={filteredVariants.length}
            tabIndex={-1}
            onKeyDown={handleGridKeyDown}
          >
            {paginatedVariants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Layers className="h-8 w-8 text-shade-30 mb-2" />
                <p className="text-body-md text-shade-40">No variants match the current filters.</p>
              </div>
            ) : (
              paginatedVariants.map((variant: any, idx: number) => (
                <VariantRowEditor
                  key={variant.id}
                  variant={{
                    id: variant.id,
                    sku: variant.sku,
                    label: `Variant #${variant.sortOrder}`,
                    pricePaisa: variant.pricePaisa,
                    compareAtPricePaisa: variant.compareAtPricePaisa,
                    stockCount: variant.stockCount,
                    isActive: variant.isActive,
                  }}
                  selected={selectedIds.has(variant.id)}
                  rowIndex={idx}
                  focused={focusedRowIndex === idx}
                  onSelectChange={(checked) => {
                    const next = new Set(selectedIds);
                    if (checked) next.add(variant.id);
                    else next.delete(variant.id);
                    setSelectedIds(next);
                  }}
                  onUpdate={handleUpdateVariant}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 pb-4" role="navigation" aria-label="Pagination">
              <span className="text-micro text-shade-50">
                {safePage * 25 + 1}–{Math.min((safePage + 1) * 25, filteredVariants.length)} of {filteredVariants.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => { setPage((p) => Math.max(0, p - 1)); setFocusedRowIndex(0); }}
                  disabled={safePage === 0}
                  className="rounded-full border border-hairline-light px-3 py-1 text-caption text-ink hover:bg-canvas-cream disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setPage(i); setFocusedRowIndex(0); }}
                      className={`h-7 w-7 rounded-full text-micro font-medium transition-colors ${
                        i === safePage
                          ? "bg-primary text-on-primary"
                          : "text-shade-50 hover:bg-canvas-cream"
                      }`}
                      aria-label={`Page ${i + 1}`}
                      aria-current={i === safePage ? "page" : undefined}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => { setPage((p) => Math.min(totalPages - 1, p + 1)); setFocusedRowIndex(0); }}
                  disabled={safePage >= totalPages - 1}
                  className="rounded-full border border-hairline-light px-3 py-1 text-caption text-ink hover:bg-canvas-cream disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
