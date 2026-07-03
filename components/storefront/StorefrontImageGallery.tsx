"use client"

import React, { useState } from "react"
import { ImageIcon } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface Props {
  images: { storagePath: string }[]
  productName: string
}

export function StorefrontImageGallery({ images, productName }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0)

  if (images.length === 0) {
    return (
      <div className="aspect-square w-full bg-canvas-cream rounded-2xl flex items-center justify-center text-shade-40 border border-hairline-light">
        <div className="flex flex-col items-center gap-2">
          <ImageIcon className="h-12 w-12 stroke-[1.2]" />
          <span className="text-caption text-shade-50">No images available</span>
        </div>
      </div>
    )
  }

  const activeImage = images[selectedIndex]?.storagePath
  const activeUrl = activeImage
    ? supabase.storage.from("product-images").getPublicUrl(activeImage).data.publicUrl
    : null

  return (
    <div className="flex flex-col gap-4">
      {/* Primary Image */}
      <div className="aspect-square w-full relative bg-zinc-50/70 rounded-2xl overflow-hidden border border-hairline-light flex items-center justify-center">
        {activeUrl ? (
          <img
            src={activeUrl}
            alt={`${productName} view ${selectedIndex + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-canvas-cream flex items-center justify-center text-shade-40">
            <ImageIcon className="h-10 w-10 stroke-[1.5]" />
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img, idx) => {
            const thumbUrl = supabase.storage
              .from("product-images")
              .getPublicUrl(img.storagePath).data.publicUrl

            return (
              <button
                key={img.storagePath}
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  "aspect-3/4 w-16 sm:w-20 rounded-lg overflow-hidden cursor-pointer bg-zinc-50/70 transition-all border-2 focus:outline-none focus:ring-1 focus:ring-shade-40",
                  selectedIndex === idx
                    ? "border-ink scale-102"
                    : "border-hairline-light hover:border-shade-40"
                )}
                aria-label={`View image ${idx + 1}`}
              >
                <img
                  src={thumbUrl}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
