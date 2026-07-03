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
  const variantsRes = await getProductVariantsAction(productId);
  if (!variantsRes.success) throw new Error(variantsRes.error);

  const mappedAttributes: AttributeInput[] = await Promise.all(
    variantsRes.attributes.map(async (attr) => {
      const optionsRes = await getProductAttributeOptionsAction(attr.id);
      if (!optionsRes.success) throw new Error(optionsRes.error);
      return {
        name: attr.name,
        displayType: attr.displayType as "swatch" | "dropdown" | "radio",
        options: optionsRes.options.map((opt) => ({
          label: opt.label,
          value: opt.value,
          swatchColor: opt.swatchColor ?? undefined,
        })),
      };
    }),
  );

  return {
    attributes: mappedAttributes,
    variants: variantsRes.variants as VariantFromDb[],
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
  const [attributes, setAttributes] = useState<AttributeInput[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [undoSnapshot, setUndoSnapshot] = useState<{
    variants: Array<{ id: string; pricePaisa: number | null; stockCount: number; isActive: boolean; sku: string }>;
    appliedData: any;
  } | null>(null);
  const [filters, setFilters] = useState<FilterCriteria>({
    skuQuery: "",
    stockFilter: "all",
    statusFilter: "all",
    attributeFilters: {},
  });

  // Snapshot of saved attributes to detect unsaved changes
  const savedAttrsRef = useRef<AttributeInput[]>([]);

  // Fetch variants
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["product-variants", productId],
    queryFn: () => fetchVariants(productId),
    enabled: true,
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

  // ── Screen reader live region for count/selection changes ──
  const announcement = data
    ? `${filteredVariants.length} of ${data.variants.length} variants shown`
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
                attributes={[]}
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

          {/* Variant list */}
          <div className="p-4 sm:p-6 pt-3 space-y-2" role="list" aria-label="Variant list">
            {filteredVariants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Layers className="h-8 w-8 text-shade-30 mb-2" />
                <p className="text-body-md text-shade-40">No variants match the current filters.</p>
              </div>
            ) : (
              filteredVariants.map((variant: any) => (
                <VariantRowEditor
                  key={variant.id}
                  variant={{
                    id: variant.id,
                    sku: variant.sku,
                    label: `Variant #${variant.sortOrder}`,
                    pricePaisa: variant.pricePaisa,
                    stockCount: variant.stockCount,
                    isActive: variant.isActive,
                  }}
                  selected={selectedIds.has(variant.id)}
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
        </div>
      )}
    </div>
    </>
  );
}
