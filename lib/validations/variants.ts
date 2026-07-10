/**
 * Zod Validation Schemas for Product Variants & Metadata
 *
 * Uses Zod v4 APIs. See .agents/skills/zod/ for best practices.
 *
 * @see specs/20-product-variants-metadata/contracts/server-actions.md
 */

import { z } from "zod/v4";
import {
  MAX_ATTRIBUTES_PER_PRODUCT,
  MAX_METADATA_ENTRIES,
  MAX_OPTIONS_PER_ATTRIBUTE,
} from "@/lib/products/attributes";

// ─── Attribute Schemas ───────────────────────────────────────────────────────

export const attributeOptionSchema = z.object({
  label: z.string().min(1, "Option label is required"),
  value: z.string().min(1, "Option value is required"),
  swatchColor: z.string().optional(),
  sortOrder: z.int().optional(),
});

export const attributeSchema = z.object({
  name: z.string().min(1, "Attribute name is required"),
  displayType: z.enum(["swatch", "dropdown", "radio"]).default("dropdown"),
  options: z
    .array(attributeOptionSchema)
    .min(1, "At least one option is required")
    .max(
      MAX_OPTIONS_PER_ATTRIBUTE,
      `Maximum ${MAX_OPTIONS_PER_ATTRIBUTE} options per attribute`,
    ),
});

export const saveAttributesSchema = z.object({
  productId: z.string().min(1),
  attributes: z
    .array(attributeSchema)
    .min(1, "At least one attribute is required")
    .max(
      MAX_ATTRIBUTES_PER_PRODUCT,
      `Maximum ${MAX_ATTRIBUTES_PER_PRODUCT} attributes per product`,
    ),
});

// ─── Variant Update Schema ────────────────────────────────────────────────────

export const variantUpdateSchema = z.object({
  sku: z.string().min(1).optional(),
  pricePaisa: z.int().min(0).nullable().optional(),
  compareAtPricePaisa: z.int().min(0).nullable().optional(),
  stockCount: z.int().min(0).optional(),
  isActive: z.boolean().optional(),
  lowStockThreshold: z.int().min(0).nullable().optional(),
});

// ─── Metadata Schema ──────────────────────────────────────────────────────────

export const metadataEntrySchema = z.object({
  key: z.string().min(1, "Metadata key is required"),
  value: z.string().min(1, "Metadata value is required"),
  sortOrder: z.int().optional(),
});

export const saveMetadataSchema = z.object({
  productId: z.string().min(1),
  metadata: z
    .array(metadataEntrySchema)
    .max(
      MAX_METADATA_ENTRIES,
      `Maximum ${MAX_METADATA_ENTRIES} metadata entries per product`,
    ),
});

// ─── Variant Selection Schema ─────────────────────────────────────────────────

export const variantSelectionSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.int().min(1, "Quantity must be at least 1"),
});

// ─── Stock Update Schema ──────────────────────────────────────────────────────

export const variantStockUpdateSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.int().min(1, "Quantity must be at least 1"),
});

// ─── Bulk Update Schema ───────────────────────────────────────────────────────

export const priceAdjustmentSchema = z.object({
  type: z.enum(["fixed", "percent", "add_amount"]),
  value: z.int(),
});

export const bulkVariantUpdateSchema = z.object({
  variantIds: z.array(z.string().min(1)).min(1, "Select at least one variant"),
  priceAdjustment: priceAdjustmentSchema.optional(),
  compareAtPriceAdjustment: priceAdjustmentSchema.nullable().optional(),
  stockCount: z.int().min(0).optional(),
  isActive: z.boolean().optional(),
  skuPrefix: z.string().min(1).max(20).optional(),
});



// ─── Inferred Types ───────────────────────────────────────────────────────────

export type AttributeOptionInput = z.infer<typeof attributeOptionSchema>;
export type AttributeInput = z.infer<typeof attributeSchema>;
export type SaveAttributesInput = z.infer<typeof saveAttributesSchema>;
export type VariantUpdateInput = z.infer<typeof variantUpdateSchema>;
export type MetadataEntryInput = z.infer<typeof metadataEntrySchema>;
export type SaveMetadataInput = z.infer<typeof saveMetadataSchema>;
export type VariantSelectionInput = z.infer<typeof variantSelectionSchema>;
export type VariantStockUpdateInput = z.infer<typeof variantStockUpdateSchema>;
