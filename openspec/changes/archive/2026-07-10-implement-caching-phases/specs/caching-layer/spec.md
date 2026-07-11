## ADDED Requirements

### Requirement: Storefront Data Caching
The system SHALL cache high-traffic database read queries (merchant config, storefront sections, categories, products, shipping zones) using Next.js `'use cache'` directive to avoid redundant database calls.

#### Scenario: Cached storefront page loads
- **WHEN** a user visits the storefront layout or any page
- **THEN** the system retrieves `getMerchantById`, `getStorefrontSections`, and product lists from the Next.js LRU memory cache instead of hitting the database.

### Requirement: Cache Invalidation
The system SHALL invalidate relevant cache tags immediately when underlying data is mutated via Server Actions.

#### Scenario: Settings update invalidates cache
- **WHEN** a merchant updates their store settings or storefront sections
- **THEN** the system calls `revalidateTag` for `merchant-{merchantId}` and `merchant-{merchantId}-storefront-sections` respectively.

### Requirement: Proxy Subdomain Caching
The system SHALL cache subdomain-to-merchant lookups and subscription status in the proxy middleware using Upstash Redis.

#### Scenario: Rapid requests to the same subdomain
- **WHEN** multiple requests arrive for a given `subdomain`
- **THEN** the proxy retrieves the merchant and subscription from Redis instead of hitting the Postgres database.
