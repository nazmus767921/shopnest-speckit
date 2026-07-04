"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { saveProductMetadataAction, getProductMetadataAction } from "@/app/actions/variants";
import { MetadataEditor } from "./MetadataEditor";
import type { MetadataEntryInput } from "@/lib/validations/variants";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MetadataSectionProps {
  productId: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MetadataSection({ productId }: MetadataSectionProps) {
  const queryClient = useQueryClient();
  // Initialize from query cache to prevent flash on tab switch.
  // When the component re-mounts (tab switch), the cache has data within
  // staleTime, so we hydrate state synchronously before the first render.
  const [entries, setEntries] = useState<MetadataEntryInput[]>(
    () => {
      const cached = queryClient.getQueryData(["product-metadata", productId]);
      return (cached as MetadataEntryInput[]) ?? [];
    },
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["product-metadata", productId],
    queryFn: async () => {
      const res = await getProductMetadataAction(productId);
      if (!res.success) throw new Error(res.error);
      return res.metadata;
    },
    staleTime: 30_000,
  });

  // Sync query data into local editing state after first fetch or cache update.
  // On initial mount with no cache, this populates entries after the query completes.
  useEffect(() => {
    if (data) {
      setEntries(data);
    }
  }, [data]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const result = await saveProductMetadataAction(productId, entries);
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        queryClient.invalidateQueries({
          queryKey: ["product-metadata", productId],
        });
      } else {
        setMessage({ type: "error", text: result.error });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save metadata",
      });
    } finally {
      setIsSaving(false);
    }
  }, [productId, entries, queryClient]);

  return (
    <div className="rounded-lg border border-hairline-light bg-canvas-light p-6">
      <MetadataEditor
        entries={entries}
        onChange={setEntries}
        disabled={isSaving}
      />

      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-body-md text-on-primary hover:bg-shade-70 transition-colors disabled:opacity-50 w-full sm:w-auto"
        >
          {isSaving ? "Saving..." : "Save Metadata"}
        </button>
        {message && (
          <span
            className={`text-sm ${
              message.type === "success" ? "text-aloe-10" : "text-red-500"
            }`}
          >
            {message.text}
          </span>
        )}
      </div>

      {isLoading && (
        <p className="mt-4 text-center text-sm text-shade-40">
          Loading metadata...
        </p>
      )}
    </div>
  );
}
