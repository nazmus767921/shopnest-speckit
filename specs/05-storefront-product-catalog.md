# Spec Unit 5: Storefront Product Catalog

## Goal

Build the fully functional customer-facing storefront: refine the existing `(storefront)/[subdomain]/layout.tsx` and `page.tsx`, then implement the new `(storefront)/[subdomain]/product/[slug]/page.tsx` product detail page — all scoped per merchant subdomain via proxy-injected headers.

---

## Design

### Visual Direction

The storefront lives on the **light transactional canvas track** (`canvas-cream` → `canvas-light`). This means:
- Background: `bg-canvas-cream` page shell, `bg-canvas-light` cards and header.
- Text: `text-ink` (#000000) for all primary text; `text-shade-40` / `text-shade-50` for secondary/tertiary text.
- Accent: `aloe-10` / `pistachio-10` for status pills and UI chips; never on backgrounds behind extended body text.
- No drop shadows — depth is achieved via `border border-hairline-light` on cards.
- All buttons use `rounded.pill` shape exclusively. "Add to Cart" is `button-primary-pill` (black fill, white label). Out-of-stock variant is the same pill shape, disabled, with reduced opacity.

### Typography

- Store name hero headline: `font-display text-display-xl font-light tracking-tight uppercase` — the thin 330-weight signature.
- Product names on the card: `text-body-strong font-semibold` (Inter 550, 16px).
- Price: `text-body-strong font-bold` with Taka symbol `৳`.
- Status pills (Low Stock, Out of Stock): `text-eyebrow-cap tracking-widest font-semibold` in amber-700 / ink respectively.
- Supporting body copy: `text-body-md text-shade-50`.

### Structural Layout

```
(storefront)/
└── [subdomain]/
    ├── layout.tsx              ← sticky header + footer shell (EXISTS, needs refinement)
    ├── page.tsx                ← product catalog (EXISTS, needs cleanup + SEO)
    └── product/
        └── [slug]/
            └── page.tsx        ← product detail page [NEW]
```

- **Header (layout.tsx):** Sticky top bar with merchant store name (from `x-merchant-name` header). Right-side cart icon placeholder for Unit 6. Clean footer "Powered by ShopNest" on `canvas-light`.
- **Catalog (page.tsx):** Editorial header with store name in `display-xl`, subtitle tagline. Product grid: `1 → 2 → 3 → 4` columns at `sm / md / lg` breakpoints. Empty state when no published products. Dev debug block removed.
- **Product Detail ([slug]/page.tsx):** Left: image gallery (primary + thumbnails). Right: name, price, stock status, description, "Add to Cart" pill CTA. Breadcrumb: `Store → Product Name`.

---

## Implementation

### 1. Resolve Merchant Context from Proxy Headers

Both `layout.tsx` and page components read merchant context injected by `proxy.ts` via HTTP headers:

| Header | Value |
|--------|-------|
| `x-merchant-id` | UUID of the resolved merchant |
| `x-merchant-name` | Display name of the merchant's store |
| `x-merchant-subdomain` | The subdomain slug |

- All three must be extracted server-side using `import { headers } from "next/headers"`.
- If `x-merchant-id` is missing or empty, do not attempt a DB query — render gracefully. The 404 path is already handled upstream by `proxy.ts`, but the component must be defensive.
- **Do NOT** accept merchant identification from URL params or request bodies. Invariant 1 applies: `merchantId` always comes from the server context, never from a client-supplied value.

### 2. Storefront Layout (`[subdomain]/layout.tsx`)

**Status: Exists — requires targeted refinements.**

1. **Clean up unused imports** — remove `ArrowLeft` and unused `Link`.
2. **Cart icon placeholder** — add a `ShoppingCart` icon button (non-functional placeholder) in the header nav with `aria-label="Cart"`. Stub navigates to `/${subdomain}/cart`. Comment: `{/* TODO Unit 6: wire to cart state */}`.
3. **`generateMetadata` export** — add:

```ts
export async function generateMetadata(): Promise<Metadata> {
  const merchantName = (await headers()).get("x-merchant-name") ?? "Boutique Store"
  return {
    title: `${merchantName} — Shop Online`,
    description: `Browse ${merchantName}'s boutique clothing collections and order online.`,
  }
}
```

### 3. Catalog Page (`[subdomain]/page.tsx`)

**Status: Exists — requires targeted refinements.**

1. **Remove dev debug block** — delete the `<div>` at the bottom showing `subdomain=` / `id=`.
2. **Add `export const revalidate = 60`** — aligns with architecture's declared `staleTime: 60s` for storefront product data.
3. **Heading structure** — ensure the merchant name `<h1>` is the only `<h1>` on the page. `ProductCard` names must remain `<h3>`.
4. **Replace inline price formatting** — remove `p.pricePaisa / 100` transform in the page component. Import and use `formatTaka(pricePaisa)` from `lib/utils.ts` instead. Pass `pricePaisa` raw to `ProductCard` and let the card call `formatTaka`.
5. **ProductCard prop update** — update `FormattedProduct` interface in `ProductCard.tsx`: replace `price: number` with `pricePaisa: number` and update the display line to call `formatTaka(product.pricePaisa)`.

### 4. `getPublishedProductBySlug` Query

Add a new query function to `db/queries/products.ts`:

```ts
export async function getPublishedProductBySlug(
  merchantId: string,
  slug: string
): Promise<ProductWithImages | null>
```

- WHERE: `isPublished = true`, `deletedAt IS NULL`, `merchantId = $merchantId`, `slug = $slug`.
- Include `images` relation ordered by `displayOrder ASC`.
- Returns `null` if not found — never throws.
- The `merchantId` parameter is mandatory — enforces Invariant 1.

### 5. `formatTaka` Utility

Add to `lib/utils.ts`:

```ts
export function formatTaka(pricePaisa: number): string {
  return (
    "৳" +
    (pricePaisa / 100).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}
```

Used in both `ProductCard` and the product detail page. No other price-formatting logic anywhere.

### 6. Product Detail Page (`[subdomain]/product/[slug]/page.tsx`)

**[NEW FILE]**

```ts
type Props = {
  params: Promise<{ subdomain: string; slug: string }>
}

export default async function ProductDetailPage({ params }: Props)
```

**Data flow:**
- Await `params` and `headers()`.
- Read `x-merchant-id` from headers.
- Call `getPublishedProductBySlug(merchantId, slug)`.
- If `null`, call `notFound()` from `next/navigation`.

**Page layout (two-column on md+, stacked on mobile):**

```
md: grid grid-cols-2 gap-12
mobile: flex flex-col gap-8

Left column:
  <StorefrontImageGallery images={product.images} productName={product.name} />

Right column:
  Breadcrumb: <Link href="/{subdomain}">Store</Link> › <span>Product Name</span>
  <h1> product name (heading-xl)
  Price: formatTaka(product.pricePaisa)  (display-md weight)
  Stock status pill (same logic as ProductCard)
  Description: product.description (body-md, text-shade-50)
  "Add to Cart" pill button — full-width, disabled if out of stock
    stub: console.log on click, comment "// TODO Unit 6: wire to cart state"
```

**`generateMetadata`:**
```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // reads x-merchant-name and fetches product name via getPublishedProductBySlug
  return {
    title: `${product.name} — ${merchantName}`,
    description: product.description ?? `Shop ${product.name} at ${merchantName}.`,
  }
}
```

### 7. `StorefrontImageGallery` Component

**[NEW FILE]** `components/storefront/StorefrontImageGallery.tsx`

```ts
"use client"

interface Props {
  images: { storagePath: string }[]
  productName: string
}
```

- Resolves public URLs via `supabase.storage.from("product-images").getPublicUrl(storagePath)`.
- `useState<number>(0)` for selected thumbnail index.
- **Primary image:** `aspect-square rounded-xl overflow-hidden border border-hairline-light object-cover`.
- **Thumbnail strip:** `flex gap-2 mt-3`. Each thumbnail: `aspect-3/4 rounded-md cursor-pointer border-2 overflow-hidden`. Active: `border-ink`. Inactive: `border-hairline-light`.
- **Fallback (no images):** centered `ImageIcon` in `bg-canvas-cream rounded-xl aspect-square flex items-center justify-center`.
- Compose from `components/ui` where applicable (Invariant 8 — no ad-hoc Tailwind duplication of existing patterns).

---

## Dependencies

No new packages required. All are already present from Units 1–4:

| Package | Status |
|---------|--------|
| `next` (App Router, `headers`, `notFound`, `Metadata`) | ✅ Unit 1 |
| `@supabase/supabase-js` (storage public URL) | ✅ Unit 4 |
| `lucide-react` (icons) | ✅ Unit 1 |
| `react` (`useState` for gallery) | ✅ Unit 1 |
| `drizzle-orm` (query layer) | ✅ Unit 2 |

---

## Verification Checklist

- [x] Visiting `[subdomain].localhost:3000` (or the live subdomain) renders the correct merchant's storefront with their store name in the header and hero.
- [x] The catalog page `<title>` reads `"[Store Name] — Shop Online"` in the browser tab.
- [x] Only products where `isPublished = true` AND `deletedAt IS NULL` appear in the catalog grid.
- [x] The product grid is responsive: 1 column on mobile, 2 on `sm`, 3 on `md`, 4 on `lg`.
- [x] An in-stock product shows the "Add to Cart" pill CTA (enabled).
- [x] An out-of-stock product (`stockCount === 0`) shows the "OUT OF STOCK" overlay and a disabled CTA.
- [x] A low-stock product (`0 < stockCount <= lowStockThreshold`) shows the "Only N left" amber warning.
- [x] Clicking a `ProductCard` navigates to `/[subdomain]/product/[slug]`.
- [x] The product detail page renders name, price (`৳X,XXX.00`), description, and images.
- [x] `StorefrontImageGallery` switches the primary image when a thumbnail is clicked.
- [x] If a product has no images, the `ImageIcon` placeholder is shown in both catalog card and detail page.
- [x] Visiting `/[subdomain]/product/invalid-slug` calls `notFound()` and shows the 404 page.
- [x] The product detail page `<title>` reads `"[Product Name] — [Store Name]"`.
- [x] The dev debug block (subdomain/id display) is absent from all pages.
- [x] `formatTaka` is the only price-formatting logic — no inline `pricePaisa / 100` in JSX.
- [x] `export const revalidate = 60` is present in the catalog page.
- [x] No Tailwind utility duplication — all recurring patterns use `components/ui` (Invariant 8).
- [x] No merchant data is fetched without an explicit `merchantId` filter (Invariant 1).
- [x] `x-merchant-id` header is sourced from `headers()` server-side, never from URL params or request bodies.
