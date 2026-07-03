"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { saveProductAttributesAction, updateVariantAction, bulkUpdateVariantsAction, getProductVariantsAction, getProductAttributeOptionsAction } from "@/app/actions/variants";
import { AttributeEditor } from "@/components/dashboard/attribute-editor/AttributeEditor";
import { VariantRowEditor, type VariantRow } from "./VariantRowEditor";
import { VariantBulkToolbar } from "./VariantBulkToolbar";
import { VariantFilterBar, type FilterCriteria } from "./VariantFilterBar";
import type { AttributeInput, VariantUpdateInput } from "@/lib/validations/variants";
import { Save, RefreshCw, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

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
    enabled: true,
    staleTime: 30_000,
  });

  // Load existing attributes into the editor when data arrives
  useEffect(() => {
    if (data && data.attributes.length > 0 && attributes.length === 0) {
      setAttributes(data.attributes);
    }
  }, [data, attributes.length]);

  // ── Manual Save: persists attributes + generates/reconciles variants ─────

  const handleSave = useCallback(async () => {
    const hasAnyOptions = attributes.some((a) => a.options.length > 0);
    if (!hasAnyOptions) {
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

  const hasGeneratedData = data && data.variants.length > 0;

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

  return (
    <div className="space-y-4">
      {/* ── Attribute Editor ── */}
      <div className="rounded-lg border border-hairline-light bg-canvas-light p-4 sm:p-6">
        <div className="mb-4">
          <h2 className="text-body-strong text-ink">Product Attributes</h2>
          <p className="text-micro text-shade-50 mt-0.5">
            Add attributes like Color, Size, or Material. Save to generate variants.
          </p>
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
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-body-md text-on-primary hover:bg-shade-70 transition-colors disabled:opacity-50 w-full sm:w-auto"
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
        <div className="rounded-lg border border-hairline-light bg-canvas-light p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-body-strong text-ink">
              {filteredVariants.length !== data.variants.length
                ? `${filteredVariants.length} of ${data.variants.length}`
                : data.variants.length}{` `}
              Variant{data.variants.length !== 1 ? "s" : ""}
            </h3>
          </div>

          <div className="mb-3">
            <VariantFilterBar
              attributes={[]}
              onFilterChange={setFilters}
            />
          </div>

          <div className="mb-3">
            <VariantBulkToolbar
              selectedCount={selectedIds.size}
              totalCount={filteredVariants.length}
              onSelectAll={() => {
                setSelectedIds(new Set(filteredVariants.map((v: any) => v.id)));
              }}
              onDeselectAll={() => setSelectedIds(new Set())}
              onBulkUpdate={async (bulkData: any) => {
                const result = await bulkUpdateVariantsAction({
                  ...bulkData,
                  variantIds: Array.from(selectedIds),
                });
                if (result.success) {
                  queryClient.invalidateQueries({
                    queryKey: ["product-variants", productId],
                  });
                  setSelectedIds(new Set());
                } else {
                  throw new Error(result.error);
                }
              }}
            />
          </div>

          <div className="space-y-2" role="list" aria-label="Variant list">
            {filteredVariants.length === 0 ? (
              <p className="text-center py-6 text-caption text-shade-40">
                No variants match the current filters.
              </p>
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

      {/* ── Loading ── */}
      {isLoading && (
        <div className="rounded-lg border border-hairline-light bg-canvas-light flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-shade-40" />
            <p className="text-body-md text-shade-50">Loading variants...</p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {isError && (
        <div className="rounded-lg border border-hairline-light bg-canvas-light flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
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
      )}
    </div>
  );
}
