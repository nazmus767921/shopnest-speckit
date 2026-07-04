import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  productId: string
  slug: string
  name: string
  pricePaisa: number
  stockCount: number
  imageUrl: string | null
  quantity: number
  /** Variant ID if this item is a product variant, null for base products */
  variantId?: string | null
  /** Human-readable variant label (e.g., "Color: Red, Size: M") */
  variantLabel?: string | null
  /** Set to true when the variant has been cascade-deleted and is no longer available */
  isUnavailable?: boolean
}

export interface CartState {
  merchantId: string
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (productId: string, variantId?: string | null) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string | null) => void
  clearCart: () => void
}

const stores: Record<string, any> = {}

export const getCartStore = (merchantId: string) => {
  if (!merchantId) {
    throw new Error("merchantId is required to access cart store")
  }

  if (!stores[merchantId]) {
    stores[merchantId] = create<CartState>()(
      persist(
        (set, get) => ({
          merchantId,
          items: [],
          addItem: (item) => {
            const currentItems = get().items
            const itemKey = item.variantId ?? item.productId
            const existingItem = currentItems.find((i) =>
              item.variantId
                ? i.variantId === item.variantId
                : i.productId === item.productId && !i.variantId
            )

            if (existingItem) {
              set({
                items: currentItems.map((i) =>
                  (item.variantId
                    ? i.variantId === item.variantId
                    : i.productId === item.productId && !i.variantId)
                    ? { ...i, quantity: Math.min(i.quantity + 1, item.stockCount) }
                    : i
                ),
              })
            } else {
              set({
                items: [...currentItems, { ...item, quantity: 1 }],
              })
            }
          },
          removeItem: (productId, variantId) => {
            set({
              items: get().items.filter((i) =>
                variantId
                  ? !(i.productId === productId && i.variantId === variantId)
                  : !(i.productId === productId && !i.variantId)
              ),
            })
          },
          updateQuantity: (productId, quantity, variantId) => {
            const item = get().items.find((i) =>
              variantId
                ? i.productId === productId && i.variantId === variantId
                : i.productId === productId && !i.variantId
            )
            if (!item) return
            const clampedQuantity = Math.max(1, Math.min(quantity, item.stockCount))
            set({
              items: get().items.map((i) =>
                (variantId
                  ? i.productId === productId && i.variantId === variantId
                  : i.productId === productId && !i.variantId)
                  ? { ...i, quantity: clampedQuantity }
                  : i
              ),
            })
          },
          clearCart: () => {
            set({ items: [] })
          },
        }),
        {
          name: `shopnest-cart-${merchantId}`,
        }
      )
    )
  }
  return stores[merchantId]
}
