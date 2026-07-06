"use client"

import React from "react"
import { Trash2, Plus, Minus, ImageIcon } from "lucide-react"
import { type CartItem } from "@/lib/cart/cart-store"
import { formatTaka } from "@/lib/utils"
import { Button } from "@/components/ui"

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
          <Trash2 className="h-5 w-5" />
        </button>

        {/* Quantity Stepper */}
        <div className="flex items-center bg-[#F2F0F1] rounded-full h-9 md:h-10 px-2.5 md:px-4 gap-2.5 md:gap-3 select-none">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1, item.variantId)}
            disabled={item.quantity <= 1}
            className="p-0.5 text-ink disabled:opacity-30 disabled:pointer-events-none hover:opacity-75 transition-opacity"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4 stroke-[2.5]" />
          </button>
          
          <span className="w-6 text-center text-sm md:text-base font-bold text-ink">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1, item.variantId)}
            disabled={item.quantity >= item.stockCount}
            className="p-0.5 text-ink disabled:opacity-30 disabled:pointer-events-none hover:opacity-75 transition-opacity"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  )
}
