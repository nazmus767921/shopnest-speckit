"use server";

import { db } from "@/db";
import { productVariants } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * Validates cart items against the database.
 * Returns a list of variant IDs that have been cascade-deleted.
 * The frontend uses this to display "No longer available" notices.
 */
export async function validateCartVariantsAction(
  variantIds: string[],
): Promise<{ deletedVariantIds: string[] }> {
  if (variantIds.length === 0) {
    return { deletedVariantIds: [] };
  }

  // Query which variant IDs still exist
  const existingVariants = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(inArray(productVariants.id, variantIds));

  const existingIds = new Set(existingVariants.map((v) => v.id));
  const deletedVariantIds = variantIds.filter((id) => !existingIds.has(id));

  return { deletedVariantIds };
}
