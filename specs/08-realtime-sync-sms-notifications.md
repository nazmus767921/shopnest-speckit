# Spec 08: Realtime Sync (Dashboard Order List)

> **Scope change:** SMS notifications (SSL Wireless, `on-order-created`, `on-stock-low` Edge Functions, `sms_logs` table) have been deferred to **V3**. `lib/sms.ts` remains as a stub and is not integrated in V1. This spec covers only Supabase Realtime integration.

---

## Goal

Wire the merchant dashboard order list to Supabase Realtime so new orders appear instantly without a manual page refresh. When a new order is created on the storefront, the dashboard list refetches automatically and highlights the newest entry.

---

## Design

- The existing `OrdersClient` component (or a thin sibling wrapper) subscribes to the `orders` table channel, scoped by `merchant_id`.
- On an `INSERT` event, TanStack Query's `invalidateQueries` is called — the list refetches from the server. No optimistic insert is used; canonical data always comes from the DB.
- The newest order card receives a brief highlight animation (warning-color ring, fades out over 1.5s) to draw the merchant's eye.
- No new loading indicator is needed; the existing list skeleton handles the brief refetch window.

---

## Implementation

### 1. `hooks/use-realtime-orders.ts`

Create a new client-side hook that subscribes to Supabase Realtime's `postgres_changes` for `orders INSERT`, filtered to the current merchant.

```ts
// hooks/use-realtime-orders.ts
"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

export function useRealtimeOrders(merchantId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!merchantId) return

    const channel = supabase
      .channel(`orders:merchant:${merchantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `merchant_id=eq.${merchantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orders", merchantId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [merchantId, queryClient])
}
```

**Key constraints:**
- One channel per merchant, keyed by `merchantId`. Prevents duplicate subscriptions if the hook remounts.
- Cleanup via `supabase.removeChannel(channel)` in the effect return — no lingering connections on unmount or tab close.
- The invalidation uses the same query key structure used by the existing `OrdersClient` fetch. Confirm the key matches exactly before wiring.

---

### 2. Wiring into `OrdersClient`

Call `useRealtimeOrders(merchantId)` at the top of the `OrdersClient` component (or a thin `<OrdersRealtimeWatcher merchantId={merchantId} />` sibling rendered inside the page). The `merchantId` is passed as a prop from the Server Component (already sourced from `auth.api.getSession()`).

```tsx
// Inside OrdersClient (or a sibling watcher component)
useRealtimeOrders(merchantId)
```

Track the `latestOrderId` in local state — updated inside the realtime callback alongside the query invalidation. Pass it to each order card so the card can apply the highlight class conditionally.

---

### 3. Highlight Animation — `app/globals.css`

Add the keyframe and utility class to the global stylesheet:

```css
@keyframes new-order-highlight {
  0%   { box-shadow: 0 0 0 3px var(--color-warning); }
  100% { box-shadow: 0 0 0 0px transparent; }
}
.animate-new-order-highlight {
  animation: new-order-highlight 1.5s ease-out;
}
```

Apply `animate-new-order-highlight` to the order card whose `id === latestOrderId`. Because TanStack Query refetches after invalidation, the newest card will be at the top of the list and will receive the class on that render.

---

### 4. Supabase Realtime — Required Project Setting

Realtime must be enabled for the `orders` table in the Supabase project dashboard:

**Supabase Dashboard → Database → Replication → Tables**
- Toggle **Realtime** ON for the `orders` table.

Without this, `postgres_changes` subscriptions will not receive events even if the channel subscribes successfully.

---

## Dependencies

| Package | Purpose | Already present? |
|---------|---------|-----------------|
| `@supabase/supabase-js` | Supabase browser client (Realtime channel) | ✅ Yes |
| `@tanstack/react-query` | `invalidateQueries` on realtime event | ✅ Yes |

No new packages. No new environment variables. No schema changes.

---

## Deferred to V3

The following were originally planned for this unit and have been explicitly moved out of V1:

| Item | Reason deferred |
|------|----------------|
| `lib/sms.ts` real implementation (SSL Wireless) | Adds dependency on a third-party SMS provider; not essential for core order flow in MVP |
| `on-order-created` Edge Function | Depends on real `lib/sms.ts` |
| `on-stock-low` Edge Function | Depends on real `lib/sms.ts` |
| `sms_logs` DB table | No SMS sends in V1; table has no purpose yet |
| `merchants.notification_phone` column | No SMS sends in V1 |
| SSL Wireless env vars (`SSL_WIRELESS_API_KEY`, `SSL_WIRELESS_SID`) | Not needed in V1 |

`lib/sms.ts` stays as a console-log stub so the codebase compiles cleanly and the integration point is clear for V3.

---

## Verification Checklist

- [x] Opening `/dashboard/orders` in one tab and submitting a test order from the storefront causes the order to appear in the dashboard list **without a manual page refresh**.
- [x] The newest order card shows the warning-ring highlight animation and then returns to its normal appearance after ~1.5s.
- [x] Closing the dashboard tab and reopening it does not produce console errors about duplicate Realtime channel subscriptions.
- [x] No Supabase Realtime connection errors appear in the browser console when the page loads.
- [x] The `orders` table has Realtime enabled in the Supabase project (confirmed in the Supabase dashboard).
- [x] `queryClient.invalidateQueries` is called with the correct query key and the list visually refreshes with the new order at the top.
- [x] The Realtime subscription is merchant-scoped: a test order placed for a **different merchant's subdomain** does not trigger an invalidation in the first merchant's dashboard.
