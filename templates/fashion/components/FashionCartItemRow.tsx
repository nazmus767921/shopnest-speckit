"use client"

import React from "react"
import { Trash2, ImageIcon, Minus, Plus } from "lucide-react"
import { type CartItem } from "@/lib/cart/cart-store"
import { formatTaka } from "@/lib/utils"

interface Props {
  item: CartItem
  onUpdateQuantity: (productId: string, quantity: number, variantId?: string | null) => void
  onRemove: (productId: string, variantId?: string | null) => void
}

export function FashionCartItemRow({ item, onUpdateQuantity, onRemove }: Props) {
  const isOutOfStock = item.stockCount !== null && item.stockCount <= 0

  if (item.isUnavailable) {
    return (
      <div className="flex items-center gap-4 py-5 border-b border-[var(--color-hairline-warm)]/60 last:border-0 opacity-60">
        <div className="h-20 w-15 bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200/50 flex items-center justify-center shrink-0">
          <ImageIcon className="h-5 w-5 text-zinc-400 stroke-[1.2]" />
        </div>
        <div className="grow min-w-0">
          <h3 className="text-sm font-sans font-semibold text-zinc-400 truncate line-through">
            {item.name}
          </h3>
          <p className="text-[10px] font-sans text-red-500 uppercase tracking-wider font-semibold">
            No longer available
          </p>
          {item.variantLabel && (
            <p className="text-xs text-zinc-400 font-sans mt-0.5">{item.variantLabel}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.productId, item.variantId)}
          className="px-4 py-2 text-[10px] font-bold font-sans text-red-500 border border-red-200 rounded-full hover:bg-red-50 hover:border-red-300 transition-colors uppercase tracking-wider shrink-0 cursor-pointer"
        >
          Remove
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-4 py-6 border-b border-[var(--color-hairline-warm)]/60 last:border-0 items-start select-none">
      {/* Tall aspect-[3/4] Thumbnail Image Container */}
      <div className="h-28 w-21 bg-[var(--color-surface-product)] rounded-lg overflow-hidden border border-[var(--color-hairline-warm)]/40 flex items-center justify-center shrink-0 aspect-[3/4] relative">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="h-5 w-5 text-zinc-400 stroke-[1.2]" />
        )}
      </div>

      {/* Product Details (Middle) */}
      <div className="grow min-w-0 flex flex-col gap-1 text-left">
        <div>
          <h3 className="text-sm md:text-base font-display font-medium text-[var(--color-ink)] leading-snug truncate hover:underline cursor-pointer">
            {item.name}
          </h3>
          {item.variantLabel && (
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
              {item.variantLabel.split(",").map((part) => {
                const [key, val] = part.split(":")
                if (!key || !val) return null
                return (
                  <p key={part} className="text-[10px] text-zinc-450 font-sans uppercase tracking-wider">
                    <span className="font-semibold text-zinc-500">{key.trim()}:</span>{" "}
                    <span>{val.trim()}</span>
                  </p>
                )
              })}
            </div>
          )}
        </div>
        
        {/* Quantity Stepper */}
        <div className="flex items-center gap-1 mt-2.5">
          <button
            type="button"
            disabled={item.quantity <= 1}
            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1, item.variantId)}
            className="w-7 h-7 rounded-full border border-zinc-200 hover:border-black flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none bg-white text-zinc-550 hover:text-black"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3 w-3 stroke-[1.5]" />
          </button>
          <span className="w-8 text-center text-xs font-sans font-medium text-ink">
            {item.quantity}
          </span>
          <button
            type="button"
            disabled={item.stockCount !== null && item.quantity >= item.stockCount}
            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1, item.variantId)}
            className="w-7 h-7 rounded-full border border-zinc-200 hover:border-black flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none bg-white text-zinc-550 hover:text-black"
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* Pricing & Trash Button (Right) */}
      <div className="flex flex-col justify-between items-end shrink-0 self-stretch py-0.5">
        {/* Remove Button */}
        <button
          type="button"
          onClick={() => onRemove(item.productId, item.variantId)}
          className="p-1.5 text-zinc-400 hover:text-black transition-colors rounded-full hover:bg-zinc-100 cursor-pointer border-none bg-transparent"
          aria-label={`Remove ${item.name} from cart`}
        >
          <Trash2 className="h-4 w-4 stroke-[1.5]" />
        </button>

        <p className="text-xs md:text-sm font-sans font-semibold text-[var(--color-ink)]">
          {formatTaka(item.pricePaisa * item.quantity)}
        </p>
      </div>
    </div>
  )
}
