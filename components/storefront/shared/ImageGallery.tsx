"use client"

import React, { useState, useEffect, useRef } from "react"
import { ImageIcon, XIcon, ChevronLeftIcon, ChevronRightIcon } from "@/lib/icons";

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
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // ─── Lightbox Keyboard & Body Scroll Lock ───────────────────────────────────
  useEffect(() => {
    if (!lightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false)
      if (e.key === "ArrowLeft") handlePrev()
      if (e.key === "ArrowRight") handleNext()
    }

    window.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [lightboxOpen, selectedIndex])

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

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomPos({ x, y })
  }

  return (
    <div className={cn("flex flex-col gap-4 items-start w-full", isLeft ? "lg:flex-row" : "lg:flex-col", className)}>
      {/* Primary Image Viewer */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setLightboxOpen(true)}
        className={cn(
          "flex-1 w-full relative bg-[var(--color-surface-product)] rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-hairline-warm)] flex items-center justify-center cursor-zoom-in group/gallery",
          aspectRatioClassName
        )}
      >
        {activeUrl ? (
          <img
            src={activeUrl}
            alt={`${productName} view ${selectedIndex + 1}`}
            style={{
              transformOrigin: isHovered ? `${zoomPos.x}% ${zoomPos.y}%` : "center",
              transform: isHovered ? "scale(2)" : "scale(1)",
            }}
            className="w-full h-full object-cover mix-blend-multiply transition-transform duration-150 ease-out select-none"
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-surface-product)] flex items-center justify-center text-[var(--color-shade-40)]">
            <ImageIcon className="h-10 w-10 stroke-[1.5]" />
          </div>
        )}

        {/* Hover overlay hint */}
        <div className="absolute bottom-4 right-4 bg-black/70 text-white text-[10px] font-sans font-bold uppercase tracking-wider px-3 py-1.5 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-300 pointer-events-none select-none">
          Click to expand
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className={cn(
          "flex gap-3 overflow-x-auto select-none shrink-0 pb-2 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          isLeft
            ? "flex-row w-full lg:flex-col lg:overflow-y-auto lg:w-[96px] lg:max-h-[500px]"
            : "flex-row w-full"
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
                  "aspect-square rounded-[var(--radius-md)] overflow-hidden cursor-pointer bg-[var(--color-surface-product)] transition-all border-2 focus:outline-none shrink-0 flex items-center justify-center w-[64px] lg:w-[80px]",
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

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && activeUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Product images for ${productName}`}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in"
        >
          {/* Backdrop click to close */}
          <div className="absolute inset-0 cursor-zoom-out" onClick={() => setLightboxOpen(false)} />

          {/* Close Button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white cursor-pointer transition-colors z-[110] border-none"
            aria-label="Close fullscreen gallery"
          >
            <XIcon className="h-6 w-6" />
          </button>

          {/* Large Image container */}
          <div className="relative max-w-5xl max-h-[80vh] w-full h-full flex items-center justify-center z-[105]">
            <img
              src={activeUrl}
              alt={`${productName} fullscreen view ${selectedIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scale-up"
            />
          </div>

          {/* Navigation Controls */}
          {images.length > 1 && (
            <>
              {/* Prev Arrow */}
              <button
                onClick={handlePrev}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white cursor-pointer transition-colors z-[110] border-none flex items-center justify-center"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="h-6 w-6 stroke-[2.5]" />
              </button>

              {/* Next Arrow */}
              <button
                onClick={handleNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white cursor-pointer transition-colors z-[110] border-none flex items-center justify-center"
                aria-label="Next image"
              >
                <ChevronRightIcon className="h-6 w-6 stroke-[2.5]" />
              </button>

              {/* Indicator dots or fraction */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-zinc-800/80 px-4 py-2 rounded-full text-xs font-sans tracking-widest text-zinc-300 font-semibold z-[110]">
                {selectedIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
