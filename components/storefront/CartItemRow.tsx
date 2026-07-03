"use client"

import React from "react"
import { Trash2, Plus, Minus, ImageIcon } from "lucide-react"
import { type CartItem } from "@/lib/cart/cart-store"
import { formatTaka } from "@/lib/utils"
import { Button } from "@/components/ui"

interface Props {
  item: CartItem
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: Props) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-hairline-light last:border-0">
      {/* Thumbnail Image Container */}
      <div className="h-16 w-16 bg-zinc-50 rounded-lg overflow-hidden border border-hairline-light flex items-center justify-center shrink-0">
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
      <div className="grow min-w-0">
        <h3 className="text-body-strong font-semibold text-ink truncate">
          {item.name}
        </h3>
        <p className="text-caption text-shade-50">
          {formatTaka(item.pricePaisa)} each
        </p>
      </div>

      {/* Stepper and Price */}
      <div className="flex items-center gap-6 shrink-0">
        {/* Quantity Stepper */}
        <div className="flex items-center border border-hairline-light rounded-full bg-canvas-light overflow-hidden h-9">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="px-2.5 h-full text-shade-50 hover:text-ink hover:bg-canvas-cream transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </button>
          
          <span className="w-8 text-center text-caption font-semibold select-none text-ink">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
            disabled={item.quantity >= item.stockCount}
            className="px-2.5 h-full text-shade-50 hover:text-ink hover:bg-canvas-cream transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Total Price for this item row */}
        <div className="w-24 text-right">
          <span className="text-body-strong font-bold text-ink">
            {formatTaka(item.pricePaisa * item.quantity)}
          </span>
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => onRemove(item.productId)}
          className="p-2 text-shade-40 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
          aria-label={`Remove ${item.name} from cart`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
