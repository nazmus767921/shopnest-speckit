"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { saveProductAttributesAction, updateVariantAction, bulkUpdateVariantsAction, getProductVariantsAction } from "@/app/actions/variants";
import { AttributeEditor } from "@/components/dashboard/attribute-editor/AttributeEditor";
import { VariantRowEditor } from "./VariantRowEditor";
import { VariantBulkToolbar } from "./VariantBulkToolbar";
import { VariantFilterBar, type FilterCriteria } from "./VariantFilterBar";
import type { AttributeInput, VariantUpdateInput } from "@/lib/validations/variants";
import { Save, RefreshCw, Loader2, AlertCircle, CheckCircle2, Tags, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VariantsSectionProps {
  productId: string;
  hasVariants: boolean;
  baseSku: string;
  basePricePaisa: number;
  productImages?: { storagePath: string }[];
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

async function fetchVariants(productId: string): Promise<{
  attributes: AttributeInput[];
  variants: VariantFromDb[];
}> {
  const res = await getProductVariantsAction(productId);
  if (!res.success) throw new Error(res.error);

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

export function VariantsSection({
  productId,
  hasVariants,
  baseSku,
  basePricePaisa,
  productImages = [],
}: VariantsSectionProps) {
  const queryClient = useQueryClient();
  const savedAttrsRef = useRef<AttributeInput[]>([]);

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

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["product-variants", productId],
    queryFn: () => fetchVariants(productId),
    staleTime: 30_000,
  });

  const hasGeneratedData = data && data.variants.length > 0;

  useEffect(() => {
    if (data && data.attributes.length > 0 && attributes.length === 0) {
      savedAttrsRef.current = JSON.parse(JSON.stringify(data.attributes));
      setAttributes(data.attributes);
    }
  }, [data, attributes.length]);

  const hasAnyOptions = attributes.some((a) => a.options.length > 0);
  const hasUnsavedChanges =
    JSON.stringify(attributes) !== JSON.stringify(savedAttrsRef.current);
  const saveDisabled =
    !hasAnyOptions || (hasGeneratedData && !hasUnsavedChanges);

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

  const totalPages = Math.max(1, Math.ceil(filteredVariants.length / 25));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedVariants = filteredVariants.slice(
    safePage * 25,
    (safePage + 1) * 25,
  );

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

  useEffect(() => {
    if (!gridRef.current) return;
    const row = gridRef.current.querySelector<HTMLElement>(
      `[data-row-index="${focusedRowIndex}"]`,
    );
    row?.focus();
  }, [focusedRowIndex]);

  useEffect(() => {
    setPage(0);
    setFocusedRowIndex(0);
  }, [filters, data]);

  if (isLoading) {
    return (
      <div className="space-y-4 text-foreground" aria-label="Loading variant data">
        <Card className="relative overflow-hidden p-4 sm:p-6">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-muted via-muted/65 to-muted/20" aria-hidden="true" />
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <div className="h-4 w-4 rounded bg-muted/60" />
            </div>
            <div>
              <div className="h-5 w-40 rounded bg-muted/80 animate-pulse" />
              <div className="h-3 w-64 rounded bg-muted/50 animate-pulse mt-1.5" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="h-[42px] w-[200px] rounded-md bg-muted/60 animate-pulse" />
              <div className="h-[42px] flex-1 rounded-md bg-muted/60 animate-pulse" />
              <div className="h-[42px] w-[32px] rounded-md bg-muted/60 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="h-5 w-32 rounded bg-muted/60 animate-pulse" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border bg-muted/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <div className="h-4 w-4 rounded bg-muted/60" />
            </div>
            <div className="h-5 w-20 rounded bg-muted/80 animate-pulse" />
            <div className="h-5 w-10 rounded bg-muted/60 animate-pulse" />
          </div>
          <div className="p-4 sm:p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2 h-10">
                <div className="h-4 w-4 rounded bg-muted/60 animate-pulse" />
                <div className="h-2 w-2 rounded-full bg-muted/50" />
                <div className="h-5 w-24 rounded bg-muted/80 animate-pulse" />
                <div className="h-5 w-32 rounded bg-muted/60 animate-pulse" />
                <div className="h-5 w-20 rounded bg-muted/80 animate-pulse" />
                <div className="h-5 w-20 rounded bg-muted/60 animate-pulse" />
                <div className="h-5 w-16 rounded bg-muted/80 animate-pulse" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="text-foreground">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border bg-muted/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
          <h3 className="text-base font-semibold">Variants</h3>
        </div>
        <div className="flex items-center justify-center min-h-[160px]">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground mb-3">Could not load variant data</p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const announcement = data
    ? `${paginatedVariants.length} of ${filteredVariants.length} variants shown`
    : "";

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
        {selectedIds.size > 0 && `, ${selectedIds.size} selected`}
      </div>
      <div className="space-y-4 text-foreground">
      {/* ── Attribute Editor ── */}
      <Card className="relative overflow-hidden p-4 sm:p-6">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/60 to-primary/10" aria-hidden="true" />

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/5">
            <Tags className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Product Attributes</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Define options like Color, Size, or Material. Save to generate variants.
            </p>
          </div>
        </div>

        <AttributeEditor
          attributes={attributes}
          onChange={setAttributes}
          estimatedExistingVariants={data?.variants.length ?? 0}
          productImages={productImages}
          savedAttributes={data?.attributes ?? []}
        />

        {message && (
          <div
            className={cn(
              "mt-4 flex items-center gap-1.5 text-xs font-semibold",
              message.type === "success" ? "text-muted-foreground" : "text-destructive"
            )}
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
        <div className="mt-4 flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saveDisabled || isSaving}
            className="w-full sm:w-auto flex items-center gap-2"
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
          </Button>
        </div>
      </Card>

      {/* ── Variant Table ── */}
      {hasGeneratedData && (
        <Card size="sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-(--card-spacing) py-3 border-b border-border bg-muted/10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-base font-semibold">Variants</h3>
              <span
                className="inline-flex items-center gap-1 rounded-md bg-primary/5 border border-primary/10 px-2 py-0.5 text-xs font-semibold"
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
          <div className="px-(--card-spacing) py-2 border-b border-border">
            <VariantBulkToolbar
              selectedCount={selectedIds.size}
              totalCount={filteredVariants.length}
              onSelectAll={() => {
                setSelectedIds(new Set(filteredVariants.map((v: any) => v.id)));
              }}
              onDeselectAll={() => setSelectedIds(new Set())}
              onBulkUpdate={async (bulkData: any) => {
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
                  setTimeout(() => setUndoSnapshot(null), 10_000);
                } else {
                  throw new Error(result.error);
                }
              }}
              undoSnapshot={undoSnapshot}
              onUndo={async () => {
                if (!undoSnapshot) return;
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

          {/* Variant list */}
          <div
            ref={gridRef}
            className="p-(--card-spacing) pt-3 space-y-2"
            role="grid"
            aria-label="Variants table"
            aria-rowcount={filteredVariants.length}
            tabIndex={-1}
            onKeyDown={handleGridKeyDown}
          >
            {paginatedVariants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Layers className="h-8 w-8 text-muted-foreground/60 mb-2" />
                <p className="text-sm text-muted-foreground">No variants match the current filters.</p>
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
            <div className="flex items-center justify-between gap-3 px-(--card-spacing) pb-4" role="navigation" aria-label="Pagination">
              <span className="text-xs text-muted-foreground">
                {safePage * 25 + 1}–{Math.min((safePage + 1) * 25, filteredVariants.length)} of {filteredVariants.length}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  onClick={() => { setPage((p) => Math.max(0, p - 1)); setFocusedRowIndex(0); }}
                  disabled={safePage === 0}
                  className="rounded-full px-4"
                  aria-label="Previous page"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { setPage(i); setFocusedRowIndex(0); }}
                      className={cn(
                        "h-7 w-7 rounded-full text-xs font-medium transition-colors cursor-pointer",
                        i === safePage
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                      aria-label={`Page ${i + 1}`}
                      aria-current={i === safePage ? "page" : undefined}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => { setPage((p) => Math.min(totalPages - 1, p + 1)); setFocusedRowIndex(0); }}
                  disabled={safePage >= totalPages - 1}
                  className="rounded-full px-4"
                  aria-label="Next page"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
    </>
  );
}
