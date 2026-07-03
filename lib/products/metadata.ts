/**
 * Product Metadata Library
 *
 * Pure functions and helpers for managing per-product custom metadata.
 * Database I/O is delegated to Drizzle queries in db/queries/.
 *
 * @see specs/20-product-variants-metadata/contracts/server-actions.md
 */

import type { productMetadata } from "@/db/schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProductMetadata = typeof productMetadata.$inferSelect;
export type NewProductMetadata = typeof productMetadata.$inferInsert;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Prepares metadata entries for bulk replace operation.
 * Assigns sort_order if not provided.
 */
export function prepareMetadataEntries(
  productId: string,
  merchantId: string,
  entries: Array<{ key: string; value: string; sortOrder?: number }>,
): NewProductMetadata[] {
  return entries.map((entry, index) => ({
    id: crypto.randomUUID(),
    productId,
    merchantId,
    key: entry.key,
    value: entry.value,
    sortOrder: entry.sortOrder ?? index + 1,
  }));
}
