## Context

The storefront currently re-fetches static merchant data and configuration on every page request, both in the proxy and the React application. This is because standard Server Actions and layouts lack cross-request caching, leading to multiple database queries.

## Goals / Non-Goals

**Goals:**
- Implement Phase 1: Use Next.js 16 `'use cache'` directive to wrap DB queries in the React application layer.
- Implement Phase 2: Use Upstash Redis for proxy-level caching and endpoint rate-limiting.
- Eliminate up to 90% of redundant database reads.

**Non-Goals:**
- Do not migrate user sessions to Redis (Better Auth's cookie cache is sufficient).
- Do not change the database schema or multi-tenant structures.

## Decisions

- **Phase 1 Strategy - Next.js `'use cache'`**:
  - We will wrap core read queries (like `getMerchantById`) with `'use cache'` inside separate `getCached*` functions.
  - Since the app is self-hosted (`next start`), this cache operates as an in-memory LRU that persists across requests.
  - **Dynamic APIs**: Calls to `cookies()`, `headers()`, or `connection()` are excluded from cached functions to prevent build timeouts or static bailing. Instead, dynamic wrappers (`<Suspense>`) will be used higher up if needed, though most of these cached data functions rely only on ID arguments.
  - **Invalidation**: We will use `cacheTag` inside the cached functions and call `revalidateTag` inside Server Actions (e.g. `updateStoreSettings`) to invalidate stale data.

- **Phase 2 Strategy - Upstash Redis**:
  - The `proxy.ts` middleware runs on the Node runtime before the React render tree, making `'use cache'` unavailable.
  - We will use `@upstash/redis` to cache the subdomain-to-merchant mapping directly in `proxy.ts`.
  - We will implement `@upstash/ratelimit` for checkout, OTP, and product mutation endpoints.

- **Multi-Tenant Query Filters**:
  - No database schema modifications are required. The existing Drizzle ORM queries already enforce multi-tenant isolation. The caching wrappers simply wrap these existing Drizzle functions and use the `merchantId` as part of the `cacheTag`.

- **Test Strategy**:
  - **Integration Testing**: We will use integration tests to verify the cache hits and misses, ensuring that `revalidateTag` correctly purges the in-memory caches.

## Risks / Trade-offs

- **Risk**: In-memory cache footprint grows too large on the Node.js server.
  - **Mitigation**: Tune `cacheMaxMemorySize` in `next.config.ts`.
- **Risk**: Stale data shown to merchants after they update settings.
  - **Mitigation**: Strict `revalidateTag` adoption in all mutation actions.
