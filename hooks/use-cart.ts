import { getCartStore, type CartItem, type CartState } from "@/lib/cart/cart-store"

export function useCart(merchantId: string) {
  // If merchantId is empty or not provided yet (during initial SSR render), return dummy fallback values
  if (!merchantId) {
    return {
      items: [],
      addItem: () => {},
      removeItem: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      totalItems: 0,
      subtotalPaisa: 0,
    }
  }

  const useStore = getCartStore(merchantId)

  const items = useStore((state: CartState) => state.items)
  const addItem = useStore((state: CartState) => state.addItem)
  const removeItem = useStore((state: CartState) => state.removeItem)
  const updateQuantity = useStore((state: CartState) => state.updateQuantity)
  const clearCart = useStore((state: CartState) => state.clearCart)

  const totalItems = items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0)
  const subtotalPaisa = items.reduce((sum: number, item: CartItem) => sum + item.pricePaisa * item.quantity, 0)

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    subtotalPaisa,
  }
}
