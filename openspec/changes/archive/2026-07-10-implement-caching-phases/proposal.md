## Why

The ShopNest platform suffers from redundant database queries across storefront, dashboard, and proxy requests. Multiple DB hits occur per page load for identical, static data (e.g., merchant lookup, storefront sections, plan resolution). By implementing a comprehensive caching strategy with Next.js `'use cache'` (Phase 1) and Upstash Redis (Phase 2), we can eliminate up to 90% of read queries, drastically improving TTFB, reducing database load, and securing the platform against abuse.

## What Changes

- Implement Next.js `'use cache'` wrappers for high-traffic read queries (Merchant by ID/Owner, Storefront Sections, Categories, Published Products, Shipping Zones, Active Templates, Merchant Plan).
- Add cache invalidation (`revalidateTag`) to all relevant Server Actions (mutations).
- Setup Upstash Redis client.
- Cache subdomain-to-merchant lookups and subscription status in the proxy middleware using Upstash Redis.
- Implement rate limiting with `@upstash/ratelimit` for checkout, OTP verification, and product CRUD operations.

## Capabilities

### New Capabilities
- `caching-layer`: Caching of database reads via Next.js cache and Redis.
- `rate-limiting`: Protection against endpoint abuse via Redis.

### Modified Capabilities


## Impact

- Significant reduction in database queries on Supabase.
- Lower latency for all storefront pages.
- Proxy middleware performance heavily optimized.
- Required environment variables: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
