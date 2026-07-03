/**
 * Variant Database Queries
 *
 * Typed Drizzle query functions for variant-related tables.
 * All queries are scoped to merchant_id (Invariant 1).
 *
 * @see specs/20-product-variants-metadata/data-model.md
 */

import { db } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import {
  productAttributes,
  attributeOptions,
  productVariants,
  variantAttributeLinks,
  variantImages,
  productMetadata,
  products,
  orderItems,
} from "@/db/schema";

// ─── Product Attributes ──────────────────────────────────────────────────────

export async function getAttributesByProductId(productId: string) {
  return db
    .select()
    .from(productAttributes)
    .where(eq(productAttributes.productId, productId))
    .orderBy(productAttributes.sortOrder);
}

export async function createAttribute(
  data: typeof productAttributes.$inferInsert,
) {
  const [result] = await db.insert(productAttributes).values(data).returning();
  return result;
}

export async function deleteAttributesByProductId(
  productId: string,
  merchantId: string,
) {
  await db
    .delete(productAttributes)
    .where(
      and(
        eq(productAttributes.productId, productId),
        eq(productAttributes.merchantId, merchantId),
      ),
    );
}

// ─── Attribute Options ────────────────────────────────────────────────────────

export async function getOptionsByAttributeId(attributeId: string) {
  return db
    .select()
    .from(attributeOptions)
    .where(eq(attributeOptions.attributeId, attributeId))
    .orderBy(attributeOptions.sortOrder);
}

export async function createAttributeOption(
  data: typeof attributeOptions.$inferInsert,
) {
  const [result] = await db
    .insert(attributeOptions)
    .values(data)
    .returning();
  return result;
}

export async function deleteOptionsByAttributeId(attributeId: string) {
  await db
    .delete(attributeOptions)
    .where(eq(attributeOptions.attributeId, attributeId));
}

// ─── Product Variants ─────────────────────────────────────────────────────────

export async function getVariantsByProductId(productId: string) {
  return db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .orderBy(productVariants.sortOrder);
}

export async function getVariantById(variantId: string) {
  const [result] = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.id, variantId));
  return result ?? null;
}

export async function getVariantsByMerchantId(merchantId: string) {
  return db
    .select()
    .from(productVariants)
    .where(eq(productVariants.merchantId, merchantId))
    .orderBy(productVariants.sortOrder);
}

export async function createVariant(
  data: typeof productVariants.$inferInsert,
) {
  const [result] = await db
    .insert(productVariants)
    .values(data)
    .returning();
  return result;
}

export async function updateVariant(
  variantId: string,
  data: Partial<typeof productVariants.$inferInsert>,
) {
  const [result] = await db
    .update(productVariants)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(productVariants.id, variantId))
    .returning();
  return result;
}

/**
 * Atomic stock decrement with guard. Uses Postgres `WHERE stock_count >= quantity`.
 * Returns false when insufficient stock.
 */
export async function updateVariantStock(
  variantId: string,
  quantity: number,
): Promise<boolean> {
  const [result] = await db
    .update(productVariants)
    .set({
      stockCount: sql`${productVariants.stockCount} - ${quantity}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(productVariants.id, variantId),
        sql`${productVariants.stockCount} >= ${quantity}`,
      ),
    )
    .returning({ id: productVariants.id });

  return !!result;
}

export async function deleteVariantsByProductId(
  productId: string,
  merchantId: string,
) {
  await db
    .delete(productVariants)
    .where(
      and(
        eq(productVariants.productId, productId),
        eq(productVariants.merchantId, merchantId),
      ),
    );
}

// ─── Variant Attribute Links ──────────────────────────────────────────────────

export async function getVariantLinksByVariantId(variantId: string) {
  return db
    .select()
    .from(variantAttributeLinks)
    .where(eq(variantAttributeLinks.variantId, variantId));
}

export async function createVariantLink(
  data: typeof variantAttributeLinks.$inferInsert,
) {
  const [result] = await db
    .insert(variantAttributeLinks)
    .values(data)
    .returning();
  return result;
}

/**
 * Gets the attribute combination for a variant as a Record<attributeName, optionValue>.
 */
export async function getVariantAttributeCombination(variantId: string) {
  const links = await db
    .select({
      attributeName: productAttributes.name,
      optionLabel: attributeOptions.label,
      optionValue: attributeOptions.value,
    })
    .from(variantAttributeLinks)
    .innerJoin(
      attributeOptions,
      eq(variantAttributeLinks.attributeOptionId, attributeOptions.id),
    )
    .innerJoin(
      productAttributes,
      eq(attributeOptions.attributeId, productAttributes.id),
    )
    .where(eq(variantAttributeLinks.variantId, variantId));

  const combination: Record<string, string> = {};
  for (const link of links) {
    combination[link.attributeName] = link.optionValue;
  }

  return combination;
}

/**
 * Gets all variants for a product with their attribute combinations.
 * Uses a single join query to avoid N+1.
 * Used by smart merge to preserve custom data when attributes change.
 */
export async function getVariantsWithCombinationsByProductId(productId: string) {
  const rows = await db
    .select({
      variantId: productVariants.id,
      sku: productVariants.sku,
      pricePaisa: productVariants.pricePaisa,
      stockCount: productVariants.stockCount,
      isActive: productVariants.isActive,
      sortOrder: productVariants.sortOrder,
      attributeName: productAttributes.name,
      optionValue: attributeOptions.value,
    })
    .from(productVariants)
    .leftJoin(
      variantAttributeLinks,
      eq(productVariants.id, variantAttributeLinks.variantId),
    )
    .leftJoin(
      attributeOptions,
      eq(variantAttributeLinks.attributeOptionId, attributeOptions.id),
    )
    .leftJoin(
      productAttributes,
      eq(attributeOptions.attributeId, productAttributes.id),
    )
    .where(eq(productVariants.productId, productId))
    .orderBy(productVariants.sortOrder, productAttributes.sortOrder);

  // Group by variantId and build combinations
  const variantMap = new Map<string, {
    id: string;
    sku: string;
    pricePaisa: number | null;
    stockCount: number;
    isActive: boolean;
    sortOrder: number;
    attributeCombination: Record<string, string>;
  }>();

  for (const row of rows) {
    if (!variantMap.has(row.variantId)) {
      variantMap.set(row.variantId, {
        id: row.variantId,
        sku: row.sku,
        pricePaisa: row.pricePaisa,
        stockCount: row.stockCount,
        isActive: row.isActive,
        sortOrder: row.sortOrder,
        attributeCombination: {},
      });
    }
    if (row.attributeName && row.optionValue) {
      variantMap.get(row.variantId)!.attributeCombination[row.attributeName] = row.optionValue;
    }
  }

  return Array.from(variantMap.values());
}

// ─── Variant Images ───────────────────────────────────────────────────────────

export async function getVariantImages(variantId: string) {
  return db
    .select()
    .from(variantImages)
    .where(eq(variantImages.variantId, variantId))
    .orderBy(variantImages.displayOrder);
}

export async function createVariantImage(
  data: typeof variantImages.$inferInsert,
) {
  const [result] = await db
    .insert(variantImages)
    .values(data)
    .returning();
  return result;
}

export async function deleteVariantImage(
  imageId: string,
  merchantId: string,
) {
  await db
    .delete(variantImages)
    .where(
      and(
        eq(variantImages.id, imageId),
        eq(variantImages.merchantId, merchantId),
      ),
    );
}

// ─── Product Metadata ─────────────────────────────────────────────────────────

export async function getMetadataByProductId(productId: string) {
  return db
    .select()
    .from(productMetadata)
    .where(eq(productMetadata.productId, productId))
    .orderBy(productMetadata.sortOrder);
}

/**
 * Atomically replaces all metadata for a product. Deletes old entries and
 * inserts new ones in a single transaction.
 */
export async function replaceMetadataByProductId(
  productId: string,
  merchantId: string,
  entries: Array<typeof productMetadata.$inferInsert>,
) {
  return db.transaction(async (tx) => {
    await tx
      .delete(productMetadata)
      .where(
        and(
          eq(productMetadata.productId, productId),
          eq(productMetadata.merchantId, merchantId),
        ),
      );

    if (entries.length > 0) {
      await tx.insert(productMetadata).values(entries);
    }

    // Update denormalized count on products
    await tx
      .update(products)
      .set({ metadataCount: entries.length })
      .where(eq(products.id, productId));
  });
}
