"use client"

import React, { useState } from "react"
import { ImageIcon } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface ImageGalleryProps {
  images: { storagePath: string }[]
  productName: string
  aspectRatioClassName?: string
  className?: string
  thumbnailLayout?: "left" | "bottom"
}

export function ImageGallery({
  images,
  productName,
  aspectRatioClassName = "aspect-square",
  className = "",
  thumbnailLayout = "left"
}: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0)

  if (images.length === 0) {
    return (
      <div className={cn("w-full bg-[var(--color-canvas-cream)] rounded-[var(--radius-lg)] flex items-center justify-center text-[var(--color-shade-40)] border border-[var(--color-hairline-light)]", aspectRatioClassName, className)}>
        <div className="flex flex-col items-center gap-2">
          <ImageIcon className="h-12 w-12 stroke-[1.2]" />
          <span className="text-caption text-[var(--color-shade-50)]">No images available</span>
        </div>
      </div>
    )
  }

  const activeImage = images[selectedIndex]?.storagePath
  const activeUrl = activeImage
    ? supabase.storage.from("product-images").getPublicUrl(activeImage).data.publicUrl
    : null

  const isLeft = thumbnailLayout === "left"

  return (
    <div className={cn("flex flex-col-reverse lg:flex-row gap-3.5 md:gap-4 items-start", !isLeft && "flex-col-reverse lg:flex-col-reverse", className)}>
      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className={cn(
          "flex gap-3 overflow-x-auto select-none shrink-0 pb-1 lg:pb-0",
          isLeft
            ? "flex-row lg:flex-col lg:overflow-y-auto w-full lg:w-[152px]"
            : "flex-row w-full overflow-x-auto"
        )}>
          {images.map((img, idx) => {
            const thumbUrl = supabase.storage
              .from("product-images")
              .getPublicUrl(img.storagePath).data.publicUrl

            return (
              <button
                key={img.storagePath}
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  "aspect-square rounded-[var(--radius-md)] overflow-hidden cursor-pointer bg-[var(--color-surface-product)] transition-all border-2 focus:outline-none shrink-0 flex items-center justify-center",
                  isLeft ? "w-[76px] lg:w-full" : "w-[76px] lg:w-[100px]",
                  selectedIndex === idx
                    ? "border-[var(--color-primary)]"
                    : "border-transparent hover:border-[var(--color-shade-40)]"
                )}
                aria-label={`View image ${idx + 1}`}
              >
                <img
                  src={thumbUrl}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover mix-blend-multiply"
                />
              </button>
            )
          })}
        </div>
      )}

      {/* Primary Image */}
      <div className={cn("flex-1 w-full relative bg-[var(--color-surface-product)] rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-hairline-light)]/30 flex items-center justify-center", aspectRatioClassName)}>
        {activeUrl ? (
          <img
            src={activeUrl}
            alt={`${productName} view ${selectedIndex + 1}`}
            className="w-full h-full object-cover mix-blend-multiply"
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-surface-product)] flex items-center justify-center text-[var(--color-shade-40)]">
            <ImageIcon className="h-10 w-10 stroke-[1.5]" />
          </div>
        )}
      </div>
    </div>
  )
}
