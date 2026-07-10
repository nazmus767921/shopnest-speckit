## Context

Currently, the ShopNest platform supports image uploads at both the product level (`product_images` table) and the variant level (`variant_images` table). A business model change requires us to remove variant-specific image uploads and instead enforce a global pool of images per product. The number of allowed global product images will be restricted based on the merchant's subscription plan.

## Goals / Non-Goals

**Goals:**
- Remove the `variant_images` table and related database queries.
- Limit the maximum number of `product_images` allowed per product. This limit is dynamically fetched from the merchant's active subscription plan.
- Update UI components (Dashboard and Storefront) to rely solely on `product_images`.

**Non-Goals:**
- Redesigning the entire product page.
- Changing the underlying storage provider (Supabase Storage).
- Implementing new subscription tiers (we assume existing tiers just need new limit configurations).

## Decisions

1.  **Database Schema Changes**:
    -   **Decision**: Drop `variant_images` table entirely.
    -   **Rationale**: Simplifies the database schema and queries. Since variant images are no longer supported, keeping the table adds unnecessary complexity.
    -   **Alternative**: Add a deprecation flag to `variant_images`, but that leaves dead data and code.

2.  **Enforcing Image Limits**:
    -   **Decision**: Enforce image limits in Next.js Server Actions before uploading to Supabase Storage. The merchant's plan limit will be checked via the active subscription.
    -   **Rationale**: Prevents malicious users from bypassing client-side checks to upload files. Since we use `cacheComponents: true` (Next.js 16.2.9), server actions that check database state for limits must properly handle caching and revalidation.

3.  **Caching Strategy (`use cache`)**:
    -   **Decision**: Actions that retrieve the current image count for a product will not be cached if they mutate state, but reads for the product gallery on the storefront will use `'use cache'` and invalidate via tags (`cacheTag('product-images')`) upon successful upload or deletion.
    -   **Rationale**: Aligns with the strict `use cache` rules for Next.js 16.2.9.

4.  **UI Updates**:
    -   **Decision**: The variant creation dialog and variant list in the dashboard will have image upload fields removed. The main product image gallery component will be updated to clarify that it serves as the global pool.
    -   **Rationale**: Less confusion for merchants, conforming to `DESIGN.md` rules.

## Risks / Trade-offs

-   **Risk**: Storefront caching might serve stale product galleries if tags aren't properly invalidated.
    -   **Mitigation**: Use explicit `revalidateTag` in the upload and delete Server Actions.
-   **Risk**: Deleting `variant_images` might break existing queries.
    -   **Mitigation**: Extensive integration testing on the product fetch paths before deployment.

## Migration Plan

Since the application is not deployed yet, there is no need for data migration or backward compatibility.

1.  Execute Drizzle schema migration to drop the `variant_images` table directly.
2.  Deploy the updated Server Actions, UI components, and API routes.

