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
    <div className="flex flex-col-reverse lg:flex-row gap-3.5 md:gap-4 items-start">
      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex flex-row lg:flex-col gap-3 lg:gap-4 overflow-x-auto lg:overflow-y-auto w-full lg:w-[152px] shrink-0 pb-1 lg:pb-0 select-none">
          {images.map((img, idx) => {
            const thumbUrl = supabase.storage
              .from("product-images")
              .getPublicUrl(img.storagePath).data.publicUrl

            return (
              <button
                key={img.storagePath}
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  "aspect-square w-[76px] lg:w-full rounded-[10px] lg:rounded-[20px] overflow-hidden cursor-pointer bg-[#F0EEED] transition-all border-2 focus:outline-none shrink-0 flex items-center justify-center",
                  selectedIndex === idx
                    ? "border-primary"
                    : "border-transparent hover:border-shade-40"
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
      <div className="flex-1 w-full aspect-square relative bg-[#F0EEED] rounded-[10px] lg:rounded-[20px] overflow-hidden border border-hairline-light/30 flex items-center justify-center">
        {activeUrl ? (
          <img
            src={activeUrl}
            alt={`${productName} view ${selectedIndex + 1}`}
            className="w-full h-full object-cover mix-blend-multiply"
          />
        ) : (
          <div className="w-full h-full bg-[#F0EEED] flex items-center justify-center text-shade-40">
            <ImageIcon className="h-10 w-10 stroke-[1.5]" />
          </div>
        )}
      </div>
    </div>
  )
}
