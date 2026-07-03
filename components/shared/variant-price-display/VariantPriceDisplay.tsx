"use client";

/**
 * Shared variant price display component.
 * Shows variant price with base price fallback rendering.
 */

interface VariantPriceDisplayProps {
  /** Variant price in paisa, or null to inherit base price */
  pricePaisa: number | null;
  /** Base product price in paisa (fallback) */
  basePricePaisa: number;
  /** Optional label */
  className?: string;
}

export function VariantPriceDisplay({
  pricePaisa,
  basePricePaisa,
  className = "",
}: VariantPriceDisplayProps) {
  const displayPaisa = pricePaisa ?? basePricePaisa;
  const isInherited = pricePaisa === null;

  return (
    <span className={className}>
      <span className="font-bold">৳{(displayPaisa / 100).toFixed(2)}</span>
      {isInherited && (
        <span className="ml-1 text-xs text-shade-40">(base price)</span>
      )}
    </span>
  );
}
