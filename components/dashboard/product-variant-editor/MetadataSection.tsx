"use client";

import { useState, useCallback } from "react";
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
  const [entries, setEntries] = useState<MetadataEntryInput[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { isLoading } = useQuery({
    queryKey: ["product-metadata", productId],
    queryFn: async () => {
      const res = await getProductMetadataAction(productId);
      if (!res.success) throw new Error(res.error);
      setEntries(res.metadata);
      return res.metadata;
    },
    staleTime: 30_000,
  });

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
