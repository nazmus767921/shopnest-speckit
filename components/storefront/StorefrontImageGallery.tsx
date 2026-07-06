"use client"

import React from "react"
import { ImageGallery } from "./shared/ImageGallery"

interface Props {
  images: { storagePath: string }[]
  productName: string
}

export function StorefrontImageGallery({ images, productName }: Props) {
  return (
    <ImageGallery
      images={images}
      productName={productName}
      aspectRatioClassName="aspect-square"
      thumbnailLayout="left"
    />
  )
}
