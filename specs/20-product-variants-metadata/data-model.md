# Data Model: Product Variants & Custom Metadata

**Branch**: `20-product-variants-metadata` | **Date**: 2026-07-03

## New Tables

### product_attributes

Defines a custom attribute dimension on a product (e.g., Color, Size, Material).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | `uuid` | PK, default `gen_random_uuid()` | Unique identifier |
| merchant_id | `uuid` | FK → merchants.id, NOT NULL, NOT NULL | Multi-tenant scope |
| product_id | `uuid` | FK → products.id, NOT NULL | Parent product |
| name | `text` | NOT NULL | Attribute name (e.g., "Color", "Size") |
| display_type | `text` | NOT NULL, default `'dropdown'` | `'swatch'` \| `'dropdown'` \| `'radio'` |
| sort_order | `integer` | NOT NULL, default 0 | Display ordering |
| created_at | `timestamptz` | NOT NULL, default `now()` | — |
| updated_at | `timestamptz` | NOT NULL, default `now()` | — |

**Indexes**:
- `idx_product_attributes_product` ON (`product_id`, `sort_order`)
- `idx_product_attributes_merchant` ON (`merchant_id`)

**Constraints**:
- Max 3 attributes per product (application-enforced)
- `display_type` limited to `swatch`, `dropdown`, `radio` (Zod enum)

---

### attribute_options

A single option value within a product attribute (e.g., "Red" for Color, "M" for Size).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | `uuid` | PK, default `gen_random_uuid()` | Unique identifier |
| attribute_id | `uuid` | FK → product_attributes.id, NOT NULL, ON DELETE CASCADE | Parent attribute |
| label | `text` | NOT NULL | Display label (e.g., "Red", "Medium") |
| value | `text` | NOT NULL | Machine value (e.g., "red", "m") |
| swatch_color | `text` | nullable | Hex color for swatch display (e.g., "#FF0000") |
| sort_order | `integer` | NOT NULL, default 0 | Display ordering |
| created_at | `timestamptz` | NOT NULL, default `now()` | — |

**Indexes**:
- `idx_attribute_options_attribute` ON (`attribute_id`, `sort_order`)

**Constraints**:
- Max 10 options per attribute (application-enforced)
- `(attribute_id, value)` must be unique within an attribute

---

### product_variants

A single variant generated from the attribute matrix. Represents one specific
combination of attribute options (e.g., Color=Red, Size=M).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | `uuid` | PK, default `gen_random_uuid()` | Unique identifier |
| merchant_id | `uuid` | FK → merchants.id, NOT NULL | Multi-tenant scope |
| product_id | `uuid` | FK → products.id, NOT NULL, ON DELETE CASCADE | Parent product |
| sku | `text` | NOT NULL | Unique SKU (auto-generated, overrideable) |
| price | `numeric(10,2)` | nullable | Override price; null = inherit base price |
| stock_count | `integer` | NOT NULL, default 0 | Current stock |
| low_stock_threshold | `integer` | nullable, default null | Alert threshold (inherits from product if null) |
| is_active | `boolean` | NOT NULL, default true | Soft delete / hide variant |
| sort_order | `integer` | NOT NULL, default 0 | Display ordering |
| created_at | `timestamptz` | NOT NULL, default `now()` | — |
| updated_at | `timestamptz` | NOT NULL, default `now()` | — |

**Indexes**:
- `idx_product_variants_product` ON (`product_id`, `sort_order`)
- `idx_product_variants_merchant` ON (`merchant_id`)
- `idx_product_variants_sku` ON (`sku`) — UNIQUE
- `idx_product_variants_active` ON (`product_id`, `is_active`) WHERE `is_active = true`

**Constraints**:
- `sku` must be unique across all variants (application + DB unique index)
- `stock_count` must never go below zero (DB check or application + transaction guard)

---

### variant_attribute_links

Maps a variant to its attribute options. Each variant has one link per attribute
(e.g., variant "Red/M" links to option "Red" for attribute "Color" and option "M"
for attribute "Size").

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | `uuid` | PK, default `gen_random_uuid()` | — |
| variant_id | `uuid` | FK → product_variants.id, NOT NULL, ON DELETE CASCADE | Variant |
| attribute_option_id | `uuid` | FK → attribute_options.id, NOT NULL, ON DELETE CASCADE | Selected option |
| created_at | `timestamptz` | NOT NULL, default `now()` | — |

**Indexes**:
- `idx_variant_links_variant` ON (`variant_id`)
- `idx_variant_links_option` ON (`attribute_option_id`)
- **UNIQUE** ON (`variant_id`, `attribute_option_id`)

**Constraints**:
- Each variant must have exactly one link per attribute defined on the product
  (application-enforced at matrix generation time)

---

### variant_images

Variant-specific images stored in Supabase Storage with metadata in Postgres.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | `uuid` | PK, default `gen_random_uuid()` | — |
| variant_id | `uuid` | FK → product_variants.id, NOT NULL, ON DELETE CASCADE | Variant |
| merchant_id | `uuid` | FK → merchants.id, NOT NULL | Multi-tenant scope |
| storage_path | `text` | NOT NULL | Supabase Storage path |
| display_order | `integer` | NOT NULL, default 0 | Sort order |
| created_at | `timestamptz` | NOT NULL, default `now()` | — |

**Indexes**:
- `idx_variant_images_variant` ON (`variant_id`, `display_order`)

**Constraints**:
- Max images per variant follows plan limits (Starter: 2, Growth/Pro: 5)
- Storage path format: `product-images/{merchant_id}/{product_id}/variants/{variant_id}/{uuid}.{ext}`

---

### product_metadata

Custom key-value metadata entries displayed on the storefront product page.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | `uuid` | PK, default `gen_random_uuid()` | — |
| product_id | `uuid` | FK → products.id, NOT NULL, ON DELETE CASCADE | Product |
| merchant_id | `uuid` | FK → merchants.id, NOT NULL | Multi-tenant scope |
| key | `text` | NOT NULL | Metadata key (e.g., "Fabric", "Care") |
| value | `text` | NOT NULL | Metadata value (e.g., "Cotton", "Machine Wash") |
| sort_order | `integer` | NOT NULL, default 0 | Display ordering |
| created_at | `timestamptz` | NOT NULL, default `now()` | — |
| updated_at | `timestamptz` | NOT NULL, default `now()` | — |

**Indexes**:
- `idx_product_metadata_product` ON (`product_id`, `sort_order`)
- UNIQUE ON (`product_id`, `key`)

**Constraints**:
- Max 20 metadata entries per product (application-enforced)

## Modified Tables

### products (existing)

New column to mark variant-capable products:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| has_variants | `boolean` | NOT NULL, default false | When true, only variants are orderable, not the base product |
| variant_generation | `text` | nullable | JSON snapshot of attribute config at last matrix generation |
| metadata_count | `integer` | NOT NULL, default 0 | Denormalized count for listing queries |

### order_items (existing)

New column to track which variant was ordered:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| variant_id | `uuid` | nullable, FK → product_variants.id | Set when the item is a variant; null for base products |
| variant_label | `text` | nullable | Human-readable variant summary (e.g., "Color: Red, Size: M") |

## State Transitions

### Product Variant Lifecycle

```
Product Created (has_variants=false)
  │
  ├── Attributes Added → has_variants=true
  │     │
  │     └── Matrix Auto-Generated (inline table populates instantly)
  │           │
  │           ├── Merchant edits per-variant via inline cell editing (SKU, price, stock)
  │           │   └── Each change auto-saves on Enter/blur
  │           │
  │           ├── Attribute option removed → cascade-delete:
  │           │   ├── Warning dialog: "Removing '{option}' will delete {N} variants with custom pricing"
  │           │   ├── ON DELETE CASCADE removes variant_attribute_links → product_variants
  │           │   ├── Active carts show "No longer available", must remove before checkout
  │           │   └── Historical orders retain their variant snapshot (price snapshotted at checkout)
  │           │
  │           ├── Attribute deleted → cascade-delete:
  │           │   ├── Warning dialog: "Delete '{attribute}' and its {N} associated variants? Cannot be undone."
  │           │   ├── ON DELETE CASCADE removes attribute_options → variant_attribute_links → product_variants
  │           │   ├── Active carts show "No longer available", must remove before checkout
  │           │   └── If last attribute: auto-revert (has_variants=false)
  │           ├── Attribute option added → smart merge:
  │           │   ├── New variants generated for new option × all existing options
  │           │   ├── Existing variant prices/SKU/stock overrides preserved
  │           │   └── New variants inherit defaults (base price, auto SKU, stock=0)
  │           │
  │           ├── Bulk operations via toolbar:
  │           │   ├── Set price (fixed, ±%, ±amount) on selected variants
  │           │   ├── Set stock on selected variants
  │           │   ├── Bulk activate/deactivate selected variants
  │           │   └── Bulk SKU prefix change
  │           │
  │           └── Search/filter: by attribute combo, SKU, stock level
  │
  └── (no variants) → behaves as existing product
```

### Smart Merge Algorithm (Conceptual)

```
Input:  oldAttributes[], newAttributes[], existingVariants[]
Output: { toAdd: VariantEntry[], toDelete: variantId[], toPreserve: variantId[] }

1. Compute old matrix (Cartesian product of oldAttributes options)
2. Compute new matrix (Cartesian product of newAttributes options)
3. For each variant in new matrix:
   - If variant combination EXISTS in old matrix with a matching variant:
     → PRESERVE (keep existing id, price, stock, SKU overrides)
   - If variant combination is NEW:
     → ADD (generate new variant with defaults)
4. For each existing variant:
   - If its combination is NOT in new matrix:
     → DELETE (cascade-delete via ON DELETE CASCADE — DB handles cleanup)
5. All other existing variants → PRESERVE as-is

Note: is_active is still used for manual merchant control (bulk activate/deactivate).
Cascade-delete only triggers on attribute/option removal, not on the manual toggle.
```

### `variant_generation` JSON Schema

Stored as `JSONB` on `products.variant_generation`, snapshots the attribute
configuration at last generation. Used by smart merge to detect what changed.

```json
{
  "attributes": [
    {
      "name": "Color",
      "displayType": "swatch",
      "options": ["Red", "Blue", "Green"]
    },
    {
      "name": "Size",
      "displayType": "dropdown",
      "options": ["S", "M", "L", "XL"]
    }
  ],
  "generatedAt": "2026-07-03T12:00:00Z"
}
```

### Variant Stock Transitions

```
stock_count > 0 → Available on storefront
stock_count = 0 → Marked "Out of Stock", unselectable
stock_count decremented → Atomic Postgres transaction with WHERE guard
```

## Validation Rules

| Field | Rule | Enforced |
|-------|------|----------|
| Product attributes | Max 3 per product | Application (Server Action) |
| Attribute options | Max 10 per attribute | Application (Server Action) |
| Variant SKU | Unique across all variants; auto-generated | DB unique index + Application |
| Variant stock | Must never go below zero | Postgres transaction guard |
| Variant price | If set, must be ≥ 0; null = inherit base | Application (Zod) + DB check |
| Metadata entries | Max 20 per product | Application (Server Action) |
| Attribute values | Unique within attribute | DB unique constraint |
| Variant-option links | Exactly one per attribute per variant | Application (matrix generation) |
| Variant images | Max per plan limit (2/5) | Application (Server Action) |
| Attribute deletion | Cascade-deletes options, variant links, and variants | DB ON DELETE CASCADE (attribute_options → variant_attribute_links → product_variants) |
| Option removal | Cascade-deletes variant links and variants | DB ON DELETE CASCADE (variant_attribute_links → product_variants) |
| Cart with deleted variant | Shows "No longer available", blocks checkout | Application (Server Action — checkout guard) |
| Auto-revert on last attribute delete | Sets has_variants = false | Application (Server Action after delete) |
