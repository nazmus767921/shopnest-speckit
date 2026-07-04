"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { getMerchantByOwnerId } from "@/db/queries/merchants";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import {
  productAttributes,
  attributeOptions,
  productVariants,
  variantAttributeLinks,
  variantImages,
  productMetadata,
  products,
} from "@/db/schema";
import { generateVariantMatrix, variantFingerprint, smartMergeVariants } from "@/lib/products/variants";
import { getMetadataByProductId, getVariantsByProductId, getAttributesByProductId, getOptionsByAttributeId, getAttributesWithOptionsByProductId, getVariantsWithCombinationsByProductId, getVariantImages, createVariantImage, deleteVariantImage } from "@/db/queries/variants";
import { saveAttributesSchema, variantUpdateSchema, saveMetadataSchema, bulkVariantUpdateSchema, variantImageUploadSchema } from "@/lib/validations/variants";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function getAuthenticatedMerchant() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized. Please log in.");
  }
  const merchant = await getMerchantByOwnerId(session.user.id);
  if (!merchant) {
    throw new Error("Merchant account not found.");
  }
  return merchant;
}

// ─── Save Product Attributes ──────────────────────────────────────────────────

export async function saveProductAttributesAction(
  productId: string,
  attributes: unknown,
) {
  try {
    const merchant = await getAuthenticatedMerchant();

    const parsed = saveAttributesSchema.safeParse({
      productId,
      attributes,
    });
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message);
    }

    const { attributes: validatedAttributes } = parsed.data;

    // Verify product belongs to merchant
    const [product] = await db
      .select({ id: products.id, pricePaisa: products.pricePaisa })
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          eq(products.merchantId, merchant.id),
        ),
      );

    if (!product) {
      throw new Error("Product not found.");
    }

    // ── Smart Merge: read existing variant data ────────────────────────────
    const existingRaw = await db
      .select({
        variantId: productVariants.id,
        sku: productVariants.sku,
        pricePaisa: productVariants.pricePaisa,
        stockCount: productVariants.stockCount,
        isActive: productVariants.isActive,
        attrName: productAttributes.name,
        optValue: attributeOptions.value,
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
      .where(
        and(
          eq(productVariants.productId, productId),
          eq(productVariants.merchantId, merchant.id),
        ),
      );

    // Group into variant map: id → { data, combination }
    const existingVariantMap = new Map<
      string,
      {
        id: string;
        sku: string;
        pricePaisa: number | null;
        stockCount: number;
        isActive: boolean;
        combination: Record<string, string>;
      }
    >();
    for (const row of existingRaw) {
      if (!existingVariantMap.has(row.variantId)) {
        existingVariantMap.set(row.variantId, {
          id: row.variantId,
          sku: row.sku,
          pricePaisa: row.pricePaisa,
          stockCount: row.stockCount,
          isActive: row.isActive,
          combination: {},
        });
      }
      if (row.attrName && row.optValue) {
        existingVariantMap.get(row.variantId)!.combination[row.attrName] = row.optValue;
      }
    }

    // Build fingerprint → full existing variant data
    const fingerprintToExisting = new Map<
      string,
      { id: string; sku: string; pricePaisa: number | null; stockCount: number; isActive: boolean }
    >();
    for (const [, ev] of existingVariantMap) {
      fingerprintToExisting.set(variantFingerprint(ev.combination), {
        id: ev.id,
        sku: ev.sku,
        pricePaisa: ev.pricePaisa,
        stockCount: ev.stockCount,
        isActive: ev.isActive,
      });
    }

    // ── Compute smart merge diff ──────────────────────────────────────────
    // Read old attributes from DB
    const oldAttributeRows = await db
      .select()
      .from(productAttributes)
      .where(
        and(
          eq(productAttributes.productId, productId),
          eq(productAttributes.merchantId, merchant.id),
        ),
      )
      .orderBy(productAttributes.sortOrder);

    const oldAttributesFormatted: Array<{
      id: string;
      name: string;
      options: Array<{ id: string; label: string; value: string }>;
    }> = [];

    for (const attr of oldAttributeRows) {
      const options = await db
        .select()
        .from(attributeOptions)
        .where(eq(attributeOptions.attributeId, attr.id))
        .orderBy(attributeOptions.sortOrder);

      oldAttributesFormatted.push({
        id: attr.id,
        name: attr.name,
        options: options.map((o) => ({
          id: o.id,
          label: o.label,
          value: o.value,
        })),
      });
    }

    const baseSku = product.id.slice(0, 8).toUpperCase();
    const basePrice = product.pricePaisa;
    const existingForMerge = Array.from(existingVariantMap.values()).map((ev) => ({
      id: ev.id,
      attributeCombination: ev.combination,
    }));

    // Map validatedAttributes to include id fields expected by smartMergeVariants
    const newAttrsForMerge = validatedAttributes.map((attr: any, i: number) => ({
      id: `attr-${i}`,
      name: attr.name,
      options: attr.options.map((opt: any, j: number) => ({
        id: `opt-${i}-${j}`,
        label: opt.label,
        value: opt.value,
      })),
    }));

    const { toPreserve, toDelete, toAdd } = smartMergeVariants(
      oldAttributesFormatted,
      newAttrsForMerge,
      existingForMerge,
      baseSku,
      basePrice,
    );

    // ── Execute merge in a transaction ─────────────────────────────────────
    await db.transaction(async (tx) => {
      // 1. Cascade-delete removed combinations: delete variant images from Storage,
      //    then let ON DELETE CASCADE handle DB rows
      for (const variantId of toDelete) {
        // Clean up variant images from Supabase Storage before DB delete
        const images = await tx
          .select({ storagePath: variantImages.storagePath })
          .from(variantImages)
          .where(eq(variantImages.variantId, variantId));

        for (const img of images) {
          try {
            const path = img.storagePath.replace(/^product-images\//, '');
            await supabaseAdmin.storage.from('product-images').remove([path]);
          } catch {
            // Storage cleanup is best-effort — log failure but don't block cascade
            console.error(`Failed to delete variant image: ${img.storagePath}`);
          }
        }

        // Delete variant — ON DELETE CASCADE handles variant_attribute_links
        await tx
          .delete(productVariants)
          .where(
            and(
              eq(productVariants.id, variantId),
              eq(productVariants.merchantId, merchant.id),
            ),
          );
      }

      // 2. Delete old attributes (cascades to attribute_options via ON DELETE CASCADE)
      await tx
        .delete(productAttributes)
        .where(
          and(
            eq(productAttributes.productId, productId),
            eq(productAttributes.merchantId, merchant.id),
          ),
        );

      // 3. Insert new attributes with options
      const insertedAttributes: Array<{
        id: string;
        name: string;
        options: Array<{ id: string; label: string; value: string }>;
      }> = [];

      for (const [attrIndex, attr] of validatedAttributes.entries()) {
        const [insertedAttr] = await tx
          .insert(productAttributes)
          .values({
            id: crypto.randomUUID(),
            merchantId: merchant.id,
            productId,
            name: attr.name,
            displayType: attr.displayType,
            sortOrder: attrIndex + 1,
          })
          .returning();

        const insertedOptions: Array<{ id: string; label: string; value: string }> = [];

        for (const [optIndex, opt] of attr.options.entries()) {
          const [insertedOpt] = await tx
            .insert(attributeOptions)
            .values({
              id: crypto.randomUUID(),
              attributeId: insertedAttr.id,
              label: opt.label,
              value: opt.value,
              swatchColor: opt.swatchColor ?? null,
              sortOrder: opt.sortOrder ?? optIndex + 1,
            })
            .returning();

          insertedOptions.push({
            id: insertedOpt.id,
            label: insertedOpt.label,
            value: insertedOpt.value,
          });
        }

        insertedAttributes.push({
          id: insertedAttr.id,
          name: insertedAttr.name,
          options: insertedOptions,
        });
      }

      // 4. Re-create links for preserved variants (option IDs changed)
      if (toPreserve.length > 0) {
        // Delete old links for these variants (one by one to avoid complex SQL)
        for (const variantId of toPreserve) {
          await tx
            .delete(variantAttributeLinks)
            .where(eq(variantAttributeLinks.variantId, variantId));
        }

        // Insert new links matching by attribute name + option value
        for (const variantId of toPreserve) {
          const ev = existingVariantMap.get(variantId);
          if (!ev) continue;
          for (const attr of insertedAttributes) {
            const optValue = ev.combination[attr.name];
            if (!optValue) continue;
            const matchedOption = attr.options.find((o) => o.value === optValue);
            if (matchedOption) {
              await tx
                .insert(variantAttributeLinks)
                .values({
                  id: crypto.randomUUID(),
                  variantId,
                  attributeOptionId: matchedOption.id,
                });
            }
          }
        }
      }

      // 5. Insert new variants for added combinations
      let baseSortOrder = 0;
      if (toPreserve.length > 0) {
        const maxResult = await tx
          .select({
            maxSort: sql`COALESCE(MAX(${productVariants.sortOrder}), 0)`,
          })
          .from(productVariants)
          .where(eq(productVariants.productId, productId));
        baseSortOrder = Number(maxResult[0]?.maxSort ?? 0);
      }

      for (const [vIndex, entry] of toAdd.entries()) {
        const existingData = fingerprintToExisting.get(
          variantFingerprint(entry.attributeCombination),
        );

        const [insertedVariant] = await tx
          .insert(productVariants)
          .values({
            id: crypto.randomUUID(),
            merchantId: merchant.id,
            productId,
            sku: existingData?.sku ?? entry.sku,
            pricePaisa: existingData?.pricePaisa ?? entry.price,
            stockCount: existingData?.stockCount ?? entry.stockCount,
            isActive: existingData?.isActive ?? entry.isActive,
            sortOrder: baseSortOrder + vIndex + 1,
          })
          .returning();

        for (const attr of insertedAttributes) {
          const optionValue = entry.attributeCombination[attr.name];
          const matchedOption = attr.options.find((o) => o.value === optionValue);
          if (matchedOption) {
            await tx
              .insert(variantAttributeLinks)
              .values({
                id: crypto.randomUUID(),
                variantId: insertedVariant.id,
                attributeOptionId: matchedOption.id,
              });
          }
        }
      }

      // 6. Update product flags
      const hasAnyAttributes = validatedAttributes.length > 0;
      await tx
        .update(products)
        .set({
          hasVariants: hasAnyAttributes,
          variantGeneration: hasAnyAttributes
            ? JSON.stringify(validatedAttributes)
            : null,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));
    });

    revalidatePath(`/dashboard/products/${productId}/edit`);

    // Audit log for cascade-delete events
    if (toDelete.length > 0) {
      console.log(
        `[AUDIT] Merchant ${merchant.id} cascade-deleted ${toDelete.length} variant(s)` +
        ` on product ${productId}. Reason: attribute/option removal.`,
      );
    }

    return { success: true as const, message: "Variants saved successfully." };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to save attributes.",
    };
  }
}

// ─── Update Single Variant ────────────────────────────────────────────────────

export async function updateVariantAction(variantId: string, data: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant();

    const parsed = variantUpdateSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message);
    }

    // Verify variant belongs to merchant
    const [existing] = await db
      .select({ id: productVariants.id, productId: productVariants.productId })
      .from(productVariants)
      .where(
        and(
          eq(productVariants.id, variantId),
          eq(productVariants.merchantId, merchant.id),
        ),
      );

    if (!existing) {
      throw new Error("Variant not found.");
    }

    await db
      .update(productVariants)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(productVariants.id, variantId));

    revalidatePath(`/dashboard/products/${existing.productId}/edit`);
    return { success: true as const, message: "Variant updated." };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update variant.",
    };
  }
}

// ─── Get Product Attributes & Variants ───────────────────────────────────────

export async function getProductAttributeOptionsAction(attributeId: string) {
  try {
    const merchant = await getAuthenticatedMerchant();
    const options = await getOptionsByAttributeId(attributeId);
    return {
      success: true as const,
      options: options.map((o) => ({
        id: o.id,
        label: o.label,
        value: o.value,
        swatchColor: o.swatchColor,
        sortOrder: o.sortOrder,
      })),
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch options.",
    };
  }
}

export async function getProductVariantsAction(productId: string) {
  try {
    const merchant = await getAuthenticatedMerchant();

    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(eq(products.id, productId), eq(products.merchantId, merchant.id)),
      );

    if (!product) throw new Error("Product not found.");

    // Use optimized join queries to avoid N+1
    const attributes = await getAttributesWithOptionsByProductId(productId);
    const variants = await getVariantsWithCombinationsByProductId(productId);

    return {
      success: true as const,
      attributes: attributes.map((a) => ({
        id: a.id,
        name: a.name,
        displayType: a.displayType,
        // Options are pre-loaded via a single join query — no N+1
        options: a.options.map((o) => ({
          id: o.id ?? "",
          label: o.label,
          value: o.value,
          swatchColor: o.swatchColor,
        })),
      })),
      variants: variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        pricePaisa: v.pricePaisa,
        stockCount: v.stockCount,
        isActive: v.isActive,
        sortOrder: v.sortOrder,
        attributeCombination: v.attributeCombination,
      })),
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch variants.",
    };
  }
}

// ─── Get Product Metadata ─────────────────────────────────────────────────────

export async function getProductMetadataAction(productId: string) {
  try {
    const merchant = await getAuthenticatedMerchant();

    const entries = await getMetadataByProductId(productId);

    // Filter to only entries belonging to this merchant (via product ownership)
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          eq(products.merchantId, merchant.id),
        ),
      );

    if (!product) {
      throw new Error("Product not found.");
    }

    return {
      success: true as const,
      metadata: entries.map((e) => ({
        key: e.key,
        value: e.value,
        sortOrder: e.sortOrder,
      })),
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch metadata.",
    };
  }
}

// ─── Save Product Metadata ────────────────────────────────────────────────────

export async function saveProductMetadataAction(
  productId: string,
  metadata: unknown,
) {
  try {
    const merchant = await getAuthenticatedMerchant();

    const parsed = saveMetadataSchema.safeParse({ productId, metadata });
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message);
    }

    // Verify product belongs to merchant
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          eq(products.merchantId, merchant.id),
        ),
      );

    if (!product) {
      throw new Error("Product not found.");
    }

    // Replace all metadata atomically
    await db.transaction(async (tx) => {
      await tx
        .delete(productMetadata)
        .where(
          and(
            eq(productMetadata.productId, productId),
            eq(productMetadata.merchantId, merchant.id),
          ),
        );

      if (parsed.data.metadata.length > 0) {
        await tx.insert(productMetadata).values(
          parsed.data.metadata.map((entry, index) => ({
            id: crypto.randomUUID(),
            productId,
            merchantId: merchant.id,
            key: entry.key,
            value: entry.value,
            sortOrder: entry.sortOrder ?? index + 1,
          })),
        );
      }

      await tx
        .update(products)
        .set({
          metadataCount: parsed.data.metadata.length,
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));
    });

    revalidatePath(`/dashboard/products/${productId}/edit`);
    return { success: true as const, message: "Metadata saved." };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to save metadata.",
    };
  }
}

// ─── Bulk Variant Update ──────────────────────────────────────────────────────

/**
 * Applies a bulk update to a set of selected variants.
 * Supported operations: price adjustment (fixed/±%/±amount), stock set,
 * activate/deactivate, and SKU prefix change.
 */
export async function bulkUpdateVariantsAction(data: unknown) {
  try {
    const merchant = await getAuthenticatedMerchant();

    const parsed = bulkVariantUpdateSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message);
    }

    const { variantIds, priceAdjustment, stockCount, isActive, skuPrefix } = parsed.data;

    // Verify all variants belong to this merchant (fetch one by one)
    const variants: Array<{
      id: string;
      productId: string;
      pricePaisa: number | null;
      sku: string;
    }> = [];

    for (const variantId of variantIds) {
      const [variant] = await db
        .select({
          id: productVariants.id,
          productId: productVariants.productId,
          pricePaisa: productVariants.pricePaisa,
          sku: productVariants.sku,
        })
        .from(productVariants)
        .where(
          and(
            eq(productVariants.id, variantId),
            eq(productVariants.merchantId, merchant.id),
          ),
        );

      if (!variant) {
        throw new Error("One or more variants not found or not owned by you.");
      }
      variants.push(variant);
    }

    if (variants.length !== variantIds.length) {
      throw new Error("One or more variants not found or not owned by you.");
    }

    const productId = variants[0]?.productId;
    if (!productId) throw new Error("No variants found.");

    // Apply updates
    for (const variant of variants) {
      const updateData: Record<string, unknown> = {};

      // Price adjustment
      if (priceAdjustment) {
        let currentPrice = variant.pricePaisa ?? 0;
        switch (priceAdjustment.type) {
          case "fixed":
            updateData.pricePaisa = Math.max(0, priceAdjustment.value);
            break;
          case "percent":
            updateData.pricePaisa = Math.max(
              0,
              Math.round(currentPrice * (1 + priceAdjustment.value / 100)),
            );
            break;
          case "add_amount":
            updateData.pricePaisa = Math.max(0, currentPrice + priceAdjustment.value);
            break;
        }
      }

      // Stock count
      if (stockCount !== undefined) {
        updateData.stockCount = stockCount;
      }

      // Active status
      if (isActive !== undefined) {
        updateData.isActive = isActive;
      }

      // SKU prefix
      if (skuPrefix) {
        const currentSku = variant.sku;
        const parts = currentSku.split("-");
        parts[0] = skuPrefix;
        updateData.sku = parts.join("-");
      }

      if (Object.keys(updateData).length > 0) {
        await db
          .update(productVariants)
          .set({ ...updateData, updatedAt: new Date() })
          .where(
            and(
              eq(productVariants.id, variant.id),
              eq(productVariants.merchantId, merchant.id),
            ),
          );
      }
    }

    revalidatePath(`/dashboard/products/${productId}/edit`);
    return {
      success: true as const,
      message: `${variantIds.length} variant${variantIds.length !== 1 ? "s" : ""} updated.`,
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update variants.",
    };
  }
}

// ─── Variant Image Upload ──────────────────────────────────────────────────────

export async function getVariantImagesAction(
  variantId: string,
): Promise<{ success: true; images: Array<{ id: string; storagePath: string; url: string }> } | { success: false; error: string }> {
  try {
    const images = await getVariantImages(variantId);
    const result = images.map((img) => ({
      id: img.id,
      storagePath: img.storagePath,
      url: supabaseAdmin.storage.from("product-images").getPublicUrl(img.storagePath).data.publicUrl,
    }));
    return { success: true, images: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch images." };
  }
}

export async function uploadVariantImageAction(
  variantId: string,
  formData: FormData,
): Promise<{ success: true; image: { id: string; storagePath: string; url: string } } | { success: false; error: string }> {
  try {
    const merchant = await getAuthenticatedMerchant();
    const merchantId = merchant.id;

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No file provided." };
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Invalid file type. Allowed: JPEG, PNG, WebP, AVIF." };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: "File too large. Maximum 5MB." };
    }

    // Check existing image count (max 5 per variant)
    const existing = await getVariantImages(variantId);
    if (existing.length >= 5) {
      return { success: false, error: "Maximum 5 images per variant." };
    }

    // Verify the variant belongs to this merchant
    const variant = await db.query.productVariants.findFirst({
      where: and(
        eq(productVariants.id, variantId),
        eq(productVariants.merchantId, merchantId),
      ),
    });
    if (!variant) {
      return { success: false, error: "Variant not found." };
    }

    // Get product ID for storage path
    const productId = variant.productId;

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const fileId = crypto.randomUUID();
    const storagePath = `${merchantId}/${productId}/variants/${variantId}/${fileId}.${ext}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("product-images")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("product-images")
      .getPublicUrl(storagePath);

    // Create DB record
    const imageId = crypto.randomUUID();
    const imageRecord = await createVariantImage({
      id: imageId,
      variantId,
      merchantId,
      storagePath,
      displayOrder: existing.length,
    });

    revalidatePath(`/dashboard/products/${productId}/edit`);

    return {
      success: true,
      image: {
        id: imageRecord.id,
        storagePath: imageRecord.storagePath,
        url: urlData.publicUrl,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image.",
    };
  }
}

export async function deleteVariantImageAction(
  imageId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const merchant = await getAuthenticatedMerchant();
    const merchantId = merchant.id;

    // Get the image record to find storage path
    const image = await db.query.variantImages.findFirst({
      where: and(
        eq(variantImages.id, imageId),
        eq(variantImages.merchantId, merchantId),
      ),
    });

    if (!image) {
      return { success: false, error: "Image not found." };
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from("product-images")
      .remove([image.storagePath]);

    if (deleteError) {
      console.error("Storage delete error:", deleteError);
      // Continue anyway — DB record should be cleaned up
    }

    // Get variant to find product ID for revalidation
    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, image.variantId),
      columns: { productId: true },
    });

    // Delete DB record
    await deleteVariantImage(imageId, merchantId);

    revalidatePath(`/dashboard/products/${variant?.productId ?? ""}/edit`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete image.",
    };
  }
}
