import { describe, it, expect, beforeEach } from "vitest";
import { getCartStore } from "../cart-store";

// Helper to get a fresh store for testing
function createTestStore(merchantId = "test-merchant-1") {
  return getCartStore(merchantId);
}

describe("Cart Store — Variant Support", () => {
  const merchantId = "test-merchant-variant";
  let store: ReturnType<typeof getCartStore>;

  beforeEach(() => {
    // Clear persisted state between tests
    if (typeof window !== "undefined") {
      localStorage.removeItem(`shopnest-cart-${merchantId}`);
    }
    store = createTestStore(merchantId);
    store.getState().clearCart();
  });

  it("T039a — should store variantId when adding a variant item to cart", () => {
    const store = createTestStore(merchantId);
    store.getState().clearCart();

    store.getState().addItem({
      productId: "prod-1",
      slug: "test-product",
      name: "Test Product",
      pricePaisa: 10000,
      stockCount: 10,
      imageUrl: null,
      variantId: "variant-red-m",
      variantLabel: "Color: Red, Size: M",
    });

    const items = store.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].variantId).toBe("variant-red-m");
    expect(items[0].variantLabel).toBe("Color: Red, Size: M");
    expect(items[0].productId).toBe("prod-1");
  });

  it("T039b — should treat variants with different IDs as separate cart items", () => {
    const store = createTestStore(merchantId);
    store.getState().clearCart();

    // Add Red/M variant
    store.getState().addItem({
      productId: "prod-1",
      slug: "test-product",
      name: "Test Product",
      pricePaisa: 10000,
      stockCount: 10,
      imageUrl: null,
      variantId: "variant-red-m",
      variantLabel: "Color: Red, Size: M",
    });

    // Add Blue/L variant (same product, different variant)
    store.getState().addItem({
      productId: "prod-1",
      slug: "test-product",
      name: "Test Product",
      pricePaisa: 12000,
      stockCount: 5,
      imageUrl: null,
      variantId: "variant-blue-l",
      variantLabel: "Color: Blue, Size: L",
    });

    const items = store.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0].variantId).toBe("variant-red-m");
    expect(items[1].variantId).toBe("variant-blue-l");
  });

  it("T039c — should increment quantity when same variant is added again", () => {
    const store = createTestStore(merchantId);
    store.getState().clearCart();

    store.getState().addItem({
      productId: "prod-1",
      slug: "test-product",
      name: "Test Product",
      pricePaisa: 10000,
      stockCount: 10,
      imageUrl: null,
      variantId: "variant-red-m",
      variantLabel: "Color: Red, Size: M",
    });

    store.getState().addItem({
      productId: "prod-1",
      slug: "test-product",
      name: "Test Product",
      pricePaisa: 10000,
      stockCount: 10,
      imageUrl: null,
      variantId: "variant-red-m",
      variantLabel: "Color: Red, Size: M",
    });

    const items = store.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it("T039d — should remove variant item correctly", () => {
    const store = createTestStore(merchantId);
    store.getState().clearCart();

    store.getState().addItem({
      productId: "prod-1",
      slug: "test-product",
      name: "Test Product",
      pricePaisa: 10000,
      stockCount: 10,
      imageUrl: null,
      variantId: "variant-red-m",
      variantLabel: "Color: Red, Size: M",
    });

    store.getState().removeItem("prod-1", "variant-red-m");
    expect(store.getState().items).toHaveLength(0);
  });

  it("T039e — should not mix variant and base product items in the same cart entry", () => {
    const store = createTestStore(merchantId);
    store.getState().clearCart();

    // Add base product (no variant)
    store.getState().addItem({
      productId: "prod-1",
      slug: "test-product",
      name: "Test Product",
      pricePaisa: 10000,
      stockCount: 10,
      imageUrl: null,
    });

    // Add same product with variant
    store.getState().addItem({
      productId: "prod-1",
      slug: "test-product",
      name: "Test Product",
      pricePaisa: 12000,
      stockCount: 5,
      imageUrl: null,
      variantId: "variant-red-m",
      variantLabel: "Color: Red, Size: M",
    });

    expect(store.getState().items).toHaveLength(2);
  });
});
