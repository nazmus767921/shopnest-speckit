"use client";

import { useCheckoutStore } from "@/lib/checkout/checkout-store";
import { useRouter } from "next/navigation";

export type BuyNowItem = {
  productId: string;
  slug: string;
  name: string;
  pricePaisa: number;
  stockCount: number;
  imageUrl: string | null;
  variantId?: string;
  variantLabel?: string;
};

export function useBuyNow(subdomain: string) {
  const setBuyNow = useCheckoutStore((s) => s.setBuyNow);
  const router = useRouter();

  const handleBuyNow = (item: BuyNowItem) => {
    setBuyNow(item as any);
    router.push("/checkout");
  };

  return { handleBuyNow };
}
