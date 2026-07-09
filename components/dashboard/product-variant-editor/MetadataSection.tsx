"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { saveProductMetadataAction, getProductMetadataAction } from "@/app/actions/variants";
import { MetadataEditor } from "./MetadataEditor";
import type { MetadataEntryInput } from "@/lib/validations/variants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetadataSectionProps {
  productId: string;
}

export function MetadataSection({ productId }: MetadataSectionProps) {
  const queryClient = useQueryClient();
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
    <Card className="text-foreground">
      <CardContent className="pt-6">
        <MetadataEditor
          entries={entries}
          onChange={setEntries}
          disabled={isSaving}
        />

        <div className="mt-4 flex items-center justify-end gap-3 flex-wrap">
          {message && (
            <span
              className={cn(
                "text-xs font-semibold mr-auto",
                message.type === "success" ? "text-emerald-700 dark:text-emerald-350" : "text-destructive"
              )}
            >
              {message.text}
            </span>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? "Saving..." : "Save Metadata"}
          </Button>
        </div>

        {isLoading && (
          <p className="mt-4 text-center text-xs text-muted-foreground animate-pulse">
            Loading metadata...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
