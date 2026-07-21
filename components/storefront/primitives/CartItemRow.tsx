"use client"

import React from "react"
import { Trash2Icon, ImageIcon } from "@/lib/icons";

import { type CartItem } from "@/lib/cart/cart-store"
import { formatTaka } from "@/lib/utils"
import { QuantityAdjuster } from "@/components/storefront/shared/QuantityAdjuster"

interface Props {
  item: CartItem
  onUpdateQuantity: (productId: string, quantity: number, variantId?: string | null) => void
  onRemove: (productId: string, variantId?: string | null) => void
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: Props) {
  if (item.isUnavailable) {
    return (
      <div className="flex items-center gap-4 py-4 border-b border-hairline-light last:border-0 opacity-60">
        <div className="h-16 w-16 bg-zinc-100 rounded-lg overflow-hidden border border-hairline-light flex items-center justify-center shrink-0">
          <ImageIcon className="h-6 w-6 text-shade-30 stroke-[1.5]" />
        </div>
        <div className="grow min-w-0">
          <h3 className="text-body-strong font-semibold text-shade-40 truncate line-through">
            {item.name}
          </h3>
          <p className="text-caption text-destructive font-medium">
            No longer available
          </p>
          {item.variantLabel && (
            <p className="text-caption text-shade-30">{item.variantLabel}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.productId, item.variantId)}
          className="px-3 py-1.5 text-xs font-medium text-destructive border border-destructive/30 rounded-full hover:bg-destructive/5 transition-colors shrink-0"
        >
          Remove
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-3 md:gap-4 py-4 md:py-5 border-b border-hairline-light last:border-0">
      {/* Thumbnail Image Container */}
      <div className="h-24 w-24 md:h-28 md:w-28 bg-[#F0EEED] rounded-lg overflow-hidden border border-hairline-light/30 flex items-center justify-center shrink-0">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="h-6 w-6 text-shade-40 stroke-[1.5]" />
        )}
      </div>

      {/* Product Details */}
      <div className="grow min-w-0 flex flex-col justify-between py-1">
        <div>
          <h3 className="text-base md:text-xl font-bold font-sans text-ink leading-tight truncate">
            {item.name}
          </h3>
          {item.variantLabel && (
            <div className="mt-1.5 flex flex-col gap-0.5">
              {item.variantLabel.split(",").map((part) => {
                const [key, val] = part.split(":")
                if (!key || !val) return null
                return (
                  <p key={part} className="text-xs md:text-sm text-shade-40 font-sans">
                    <span className="capitalize">{key.trim()}:</span>{" "}
                    <span className="text-shade-60">{val.trim()}</span>
                  </p>
                )
              })}
            </div>
          )}
        </div>
        <p className="text-lg md:text-2xl font-bold font-sans text-ink mt-2">
          {formatTaka(item.pricePaisa)}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col justify-between items-end shrink-0 py-1">
        {/* Remove Button */}
        <button
          type="button"
          onClick={() => onRemove(item.productId, item.variantId)}
          className="p-1 text-[#FF3333] hover:text-red-700 transition-colors rounded-full hover:bg-red-50"
          aria-label={`Remove ${item.name} from cart`}
        >
          <Trash2Icon className="h-5 w-5" />
        </button>

        {/* Quantity Stepper */}
        <QuantityAdjuster
          quantity={item.quantity}
          maxQuantity={item.stockCount}
          onChange={(q) => onUpdateQuantity(item.productId, q, item.variantId)}
        />
      </div>
    </div>
  )
}
