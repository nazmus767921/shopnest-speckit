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

  if (isLoading) {
    return (
      <div className="space-y-4 text-foreground" aria-label="Loading metadata">
        <Card className="relative overflow-hidden p-4 sm:p-6">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-muted via-muted/65 to-muted/20" aria-hidden="true" />
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <div className="h-4 w-4 rounded bg-muted/60" />
            </div>
            <div>
              <div className="h-5 w-40 rounded bg-muted/80 animate-pulse" />
              <div className="h-3 w-56 rounded bg-muted/50 animate-pulse mt-1.5" />
            </div>
          </div>

          {/* Preset pills skeleton */}
          <div className="bg-muted/10 p-3 rounded-lg border border-border/60">
            <div className="h-2 w-24 rounded bg-muted/60 animate-pulse mb-2" />
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-6 w-16 rounded-full bg-muted/50 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Table skeleton */}
          <div className="border border-border rounded-xl overflow-hidden mt-4">
            <div className="grid grid-cols-[48px_1fr_2fr_48px] gap-3 bg-muted/40 px-3 py-2.5 border-b border-border">
              <div className="h-2 w-8 rounded bg-muted/60 animate-pulse mx-auto" />
              <div className="h-2 w-16 rounded bg-muted/60 animate-pulse" />
              <div className="h-2 w-12 rounded bg-muted/60 animate-pulse" />
              <div className="h-2 w-8 rounded bg-muted/60 animate-pulse mx-auto" />
            </div>
            <div className="divide-y divide-border/60">
              {[1, 2, 3].map((i) => (
                <div key={i} className="grid grid-cols-[48px_1fr_2fr_48px] gap-3 items-center px-3 py-3">
                  <div className="flex justify-center">
                    <div className="h-4 w-4 rounded bg-muted/60 animate-pulse" />
                  </div>
                  <div className="h-9 rounded-md bg-muted/50 animate-pulse" />
                  <div className="h-9 rounded-md bg-muted/50 animate-pulse" />
                  <div className="flex justify-center">
                    <div className="h-4 w-4 rounded bg-muted/50 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-end gap-3">
              <div className="h-9 w-32 rounded-md bg-muted/60 animate-pulse" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

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
      </CardContent>
    </Card>
  );
}
