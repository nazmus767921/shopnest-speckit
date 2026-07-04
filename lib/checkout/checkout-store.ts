import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CheckoutStoreItem {
  productId: string
  slug: string
  name: string
  pricePaisa: number
  stockCount: number
  imageUrl: string | null
  quantity: number
  variantId?: string
  variantLabel?: string
}

interface CheckoutState {
  items: CheckoutStoreItem[]
  setBuyNow: (item: Omit<CheckoutStoreItem, "quantity">) => void
  clearCheckoutStore: () => void
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      items: [],
      setBuyNow: (item) => set({ items: [{ ...item, quantity: 1 }] }),
      clearCheckoutStore: () => set({ items: [] }),
    }),
    {
      name: "shopnest-buy-now",
    }
  )
)
