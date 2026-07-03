/**
 * Storefront Product Metadata Display
 *
 * Renders custom metadata key-value pairs on the product detail page.
 * Only renders when there are metadata entries.
 */

interface ProductMetadataProps {
  metadata: Array<{
    key: string;
    value: string;
    sortOrder: number;
  }>;
}

export function ProductMetadata({ metadata }: ProductMetadataProps) {
  if (!metadata || metadata.length === 0) {
    return null;
  }

  // Sort by sortOrder
  const sorted = [...metadata].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mt-6 border-t border-hairline-light pt-6">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-shade-50">
        Product Details
      </h3>
      <dl className="divide-y divide-hairline-light">
        {sorted.map((entry, index) => (
          <div key={index} className="flex gap-4 py-2">
            <dt className="min-w-[100px] text-sm font-medium text-shade-50">
              {entry.key}
            </dt>
            <dd className="text-sm text-ink">{entry.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
