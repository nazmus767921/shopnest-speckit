"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadVariantImageAction, deleteVariantImageAction } from "@/app/actions/variants";
import { getVariantImagesAction } from "@/app/actions/variants";
import { cn } from "@/lib/utils";

interface VariantImageUploadProps {
  variantId: string;
  disabled?: boolean;
}

interface VariantImage {
  id: string;
  storagePath: string;
  url: string;
}

async function fetchVariantImages(variantId: string): Promise<VariantImage[]> {
  const res = await getVariantImagesAction(variantId);
  if (!res.success) throw new Error(res.error);
  return res.images;
}

export function VariantImageUpload({
  variantId,
  disabled = false,
}: VariantImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["variant-images", variantId],
    queryFn: () => fetchVariantImages(variantId),
    staleTime: 30_000,
  });

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
      if (!allowedTypes.includes(file.type)) {
        alert("Invalid file type. Allowed: JPEG, PNG, WebP, AVIF.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Maximum 5MB.");
        return;
      }

      const tempId = crypto.randomUUID();
      setUploadingId(tempId);

      const formData = new FormData();
      formData.append("file", file);

      startTransition(async () => {
        try {
          const result = await uploadVariantImageAction(variantId, formData);
          if (result.success) {
            queryClient.invalidateQueries({ queryKey: ["variant-images", variantId] });
          } else {
            alert(result.error);
          }
        } catch {
          alert("Upload failed.");
        } finally {
          setUploadingId(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      });
    },
    [variantId, queryClient],
  );

  const handleDelete = useCallback(
    async (imageId: string) => {
      startTransition(async () => {
        const result = await deleteVariantImageAction(imageId);
        if (result.success) {
          queryClient.invalidateQueries({ queryKey: ["variant-images", variantId] });
        } else {
          alert(result.error);
        }
      });
    },
    [variantId, queryClient],
  );

  const canAdd = images.length < 5 && !disabled;

  return (
    <div className="space-y-2 text-foreground">
      {isLoading ? (
        <div className="flex items-center gap-2 py-1">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading images...</span>
        </div>
      ) : images.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative h-16 w-16 overflow-hidden rounded-md border border-border bg-muted"
            >
              <img
                src={img.url}
                alt="Variant"
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                disabled={isPending || disabled}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500 disabled:opacity-30 cursor-pointer border-none"
                aria-label="Delete image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {canAdd && (
            <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed border-border bg-muted/50 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground transition-colors">
              {uploadingId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
              />
            </label>
          )}
        </div>
      ) : (
        canAdd && (
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-muted-foreground/45 hover:text-foreground transition-colors">
            {uploadingId ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5" />
            )}
            <span>{uploadingId ? "Uploading..." : "Add image"}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled}
            />
          </label>
        )
      )}

      {images.length > 0 && (
        <span className="text-xs text-muted-foreground">
          {images.length}/5 images
        </span>
      )}
    </div>
  );
}
