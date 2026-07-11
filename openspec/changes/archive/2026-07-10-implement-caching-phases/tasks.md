## 1. Setup Phase 2 Dependencies (Upstash Redis)

- [x] 1.1 Add `@upstash/redis` and `@upstash/ratelimit` to package.json and install.
- [x] 1.2 Write tests for proxy caching and rate limiting (TDD).
- [x] 1.3 Create an Upstash Redis client instance in a new `lib/redis/client.ts` file.

## 2. Implement Proxy Subdomain Caching

- [x] 2.1 Write integration tests for proxy subdomain caching (TDD).
- [x] 2.2 Update `proxy.ts` to fetch `merchant` and `subscription` from Redis.
- [x] 2.3 Implement fallback to DB and Redis `set` if cache miss occurs in `proxy.ts`.
- [x] 2.4 Add cache invalidation for proxy data inside subscription update and store settings update actions.

## 3. Implement Rate Limiting

- [x] 3.1 Write integration tests for rate limiting (TDD).
- [x] 3.2 Create rate limiter instances in `lib/redis/rate-limit.ts` (checkout, OTP, API).
- [x] 3.3 Apply checkout rate limiting in checkout Server Actions.
- [x] 3.4 Apply OTP rate limiting in OTP verification Server Actions.
- [x] 3.5 Apply product CRUD rate limiting in product mutation Server Actions.

## 4. Implement Phase 1: Next.js `'use cache'`

- [x] 4.1 Write integration tests for Next.js cache hits and misses (TDD).
- [x] 4.2 Create `getCachedMerchantById` and `getCachedMerchantByOwnerId` wrappers.
- [x] 4.3 Create `getCachedStorefrontSections` wrapper.
- [x] 4.4 Create `getCachedCategories` wrapper.
- [x] 4.5 Create `getCachedPublishedProducts` and `getCachedPublishedProductBySlug` wrappers.
- [x] 4.6 Create `getCachedShippingZones` wrapper.
- [x] 4.7 Create `getCachedActiveTemplates` wrapper.
- [x] 4.8 Create `getCachedMerchantPlan` wrapper.
- [x] 4.9 Refactor all call sites to use the new `getCached*` functions.

## 5. Cache Invalidation for Next.js

- [x] 5.1 Add `revalidateTag` to all relevant merchant/storefront mutation actions.
- [x] 5.2 Add `revalidateTag` to all product/category mutation actions.
- [x] 5.3 Verify all tests pass and `NEXT_PRIVATE_DEBUG_CACHE=1` shows expected cache hits.
