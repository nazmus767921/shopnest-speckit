/**
 * Attribute CRUD Library
 *
 * Pure functions and helpers for managing product attribute definitions.
 * Database I/O is delegated to Drizzle queries in db/queries/.
 *
 * @see specs/20-product-variants-metadata/contracts/server-actions.md
 */

import type {
  productAttributes,
  attributeOptions,
  productVariants,
  productMetadata,
} from "@/db/schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProductAttribute = typeof productAttributes.$inferSelect;
export type NewProductAttribute = typeof productAttributes.$inferInsert;

export type AttributeOption = typeof attributeOptions.$inferSelect;
export type NewAttributeOption = typeof attributeOptions.$inferInsert;

export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;

export type ProductMetadata = typeof productMetadata.$inferSelect;
export type NewProductMetadata = typeof productMetadata.$inferInsert;

// ─── Attribute Input ──────────────────────────────────────────────────────────

export type AttributeInput = {
  name: string;
  displayType: "swatch" | "dropdown" | "radio";
  options: Array<{
    label: string;
    value: string;
    swatchColor?: string;
    sortOrder?: number;
  }>;
};

export type MetadataInput = {
  key: string;
  value: string;
  sortOrder?: number;
};

// ─── Validation Constants ─────────────────────────────────────────────────────

export const MAX_ATTRIBUTES_PER_PRODUCT = 3;
export const MAX_OPTIONS_PER_ATTRIBUTE = 10;
export const MAX_VARIANTS_PER_PRODUCT = 1000;
export const MAX_METADATA_ENTRIES = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validates attribute count limit.
 */
export function validateAttributeCount(count: number): boolean {
  return count >= 0 && count <= MAX_ATTRIBUTES_PER_PRODUCT;
}

/**
 * Validates option count per attribute.
 */
export function validateOptionCount(count: number): boolean {
  return count >= 1 && count <= MAX_OPTIONS_PER_ATTRIBUTE;
}

/**
 * Validates total variant count does not exceed limit.
 */
export function validateVariantCount(count: number): boolean {
  return count >= 0 && count <= MAX_VARIANTS_PER_PRODUCT;
}

/**
 * Validates metadata entry count.
 */
export function validateMetadataCount(count: number): boolean {
  return count >= 0 && count <= MAX_METADATA_ENTRIES;
}
