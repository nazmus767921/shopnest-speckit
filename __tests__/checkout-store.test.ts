import { describe, it, expect, beforeEach } from "vitest"
import { useCheckoutStore } from "@/lib/checkout/checkout-store"

describe("Checkout Zustand Store (Buy Now)", () => {
  beforeEach(() => {
    useCheckoutStore.getState().clearCheckoutStore()
  })

  it("should initialize with an empty items array", () => {
    const state = useCheckoutStore.getState()
    expect(state.items).toEqual([])
  })

  it("should set a product for Buy Now and enforce quantity of 1", () => {
    const product = {
      productId: "prod-123",
      slug: "awesome-tshirt",
      name: "Awesome T-Shirt",
      pricePaisa: 120000,
      stockCount: 15,
      imageUrl: null,
    }

    useCheckoutStore.getState().setBuyNow(product)

    const state = useCheckoutStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.items[0]).toEqual({
      ...product,
      quantity: 1,
    })
  })

  it("should clear the checkout store state", () => {
    const product = {
      productId: "prod-123",
      slug: "awesome-tshirt",
      name: "Awesome T-Shirt",
      pricePaisa: 120000,
      stockCount: 15,
      imageUrl: null,
    }

    useCheckoutStore.getState().setBuyNow(product)
    expect(useCheckoutStore.getState().items).toHaveLength(1)

    useCheckoutStore.getState().clearCheckoutStore()
    expect(useCheckoutStore.getState().items).toEqual([])
  })
})
