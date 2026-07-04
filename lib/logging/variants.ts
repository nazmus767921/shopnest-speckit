/**
 * Audit logging for variant lifecycle events.
 *
 * All cascade-delete operations should be logged for traceability.
 * Logs are written to server-side console/stdout for now.
 * In the future, these could be routed to a structured logging service.
 */

type CascadeDeleteEvent = {
  merchantId: string;
  productId: string;
  action: "attribute_deleted" | "option_removed";
  attributeName?: string;
  optionValue?: string;
  deletedVariantCount: number;
};

/**
 * Logs a cascade-delete event for audit trail purposes.
 * This is fire-and-forget — failures should not block the operation.
 */
export function logCascadeDelete(event: CascadeDeleteEvent): void {
  const { merchantId, productId, action, attributeName, optionValue, deletedVariantCount } = event;

  const detail =
    action === "attribute_deleted"
      ? `deleted attribute "${attributeName}"`
      : `removed option "${optionValue}"`;

  console.log(
    `[AUDIT][${new Date().toISOString()}] ` +
    `Merchant ${merchantId} ${detail} on product ${productId}, ` +
    `cascade-deleting ${deletedVariantCount} variant(s).`,
  );
}

/**
 * Logs auto-revert event when last attribute is deleted.
 */
export function logAutoRevert(merchantId: string, productId: string): void {
  console.log(
    `[AUDIT][${new Date().toISOString()}] ` +
    `Merchant ${merchantId} auto-reverted product ${productId} to non-variant mode ` +
    `(last attribute cascade-deleted).`,
  );
}
