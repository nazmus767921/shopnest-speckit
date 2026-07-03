# Spec 15: Storefront Editor & Dynamic Storefront

## Goal

Extend the `merchants` schema with storefront customisation columns (`hero_image_url`, `subtitle`, `store_description`, `store_address`, `social_links`, `custom_faqs`), add a **"Storefront Layout" tab** to the existing `(dashboard)/settings` page so merchants can manage these fields, and update the customer-facing `(storefront)/[subdomain]/page.tsx` and `layout.tsx` to render the custom hero image, merchant subtitle/description, dynamic Featured and New Arrival product bands, custom FAQs accordion, and social links in the footer.

---

## Design

### Dashboard — "Storefront Layout" Tab (4th tab in `StoreSettingsForm`)

The settings page already has three tabs rendered by a pill tab bar (Profile, Mobile Banking, Inventory). A fourth **"Storefront Layout"** tab is added to the right of the existing three. The tab panel uses the same `Card + CardHeader + CardContent + CardFooter` pattern with a single `form` wrapping a TanStack Form instance.

**Tab icon:** `LayoutTemplate` from Lucide React.

**Sections inside the tab (vertical flex-col gap-8):**

1. **Hero Image** — Upload a single image to Supabase Storage bucket `merchant-assets/{merchant_id}/hero.{ext}`. Show a live preview thumbnail (aspect-video, `object-cover`, rounded-xl). Show a drag-and-drop zone that accepts JPG/PNG/WebP, max 2 MB. Show a "Remove Hero Image" danger link if an image is already set.

2. **Store Identity** — Two inputs side-by-side on desktop (`grid grid-cols-1 sm:grid-cols-2 gap-4`):
   - **Subtitle** (max 120 chars) — Displayed beneath the store name on the storefront header. Placeholder: `e.g. Handcrafted clothing for modern women`.
   - **Store Address** (max 200 chars) — Shown in the footer. Placeholder: `e.g. Dhaka, Bangladesh`.
   Below: a full-width **Store Description** `Textarea` (max 500 chars) — Displayed in the hero section below the subtitle on storefront. Placeholder: `Tell customers what makes your boutique special...`.

3. **Social Links** — Four `Input` fields in a `grid grid-cols-1 sm:grid-cols-2 gap-4`:
   - Facebook URL
   - Instagram URL
   - WhatsApp number (tel, not URL — displayed as `https://wa.me/{number}`)
   - TikTok URL
   All optional. Show error if URL fields do not match a basic URL pattern.

4. **Custom FAQs** — Dynamic list of FAQ entries. Each entry has:
   - **Question** (max 150 chars)
   - **Answer** (max 600 chars)
   Buttons: "Add FAQ" (max 8 FAQs), per-entry "Remove" (trash icon). FAQs are stored as JSON in `merchants.custom_faqs`. If no FAQs are set, show an empty-state prompt.

Submit CTA: **"Save Storefront Layout"** — calls a new `updateStorefrontLayoutAction` server action. Separate success/error state from the other tabs.

### Storefront — Customer-Facing Page

The `(storefront)/[subdomain]/page.tsx` is updated to pull the new merchant fields and render the following layout (in order):

1. **Hero Banner** — Full-width section (max-w-7xl). If `hero_image_url` is set: display the image in an `aspect-[3/1]` container with `object-cover` and a subtle dark gradient overlay at the bottom. Overlay the store name and subtitle in white text on top. If no hero image: render the existing editorial header (store name + default subtitle copy), dynamically replacing the hardcoded description with `merchant.subtitle` if available.

2. **Featured Products Slider** — Unchanged from Spec 14. Conditionally rendered if `featuredProducts.length > 0`.

3. **New Arrivals Slider** — Unchanged from Spec 14. Conditionally rendered if `newArrivalProducts.length > 0`.

4. **All Collections / Boutique Catalog** — separate page for catalog named /products. On products page will have filters sidebar and search input (server side).

5. **Custom FAQs Accordion** — Conditionally rendered if `merchant.custom_faqs` has entries. A clean accordion using Tailwind`s `details`/`summary` HTML elements or a minimal client component. Section heading: "Frequently Asked Questions". Each FAQ renders as an expand/collapse panel with smooth `max-height` transition.

### Storefront — Layout Navbar

The `(storefront)/[subdomain]/layout.tsx` navbar is updated:
- A responsive navbar that includes links to the current storefront paths: Home (`/`), Products (`/products`), Cart (`/cart`), Orders (`/orders`). (Checkout is accessed via cart)
- On mobile, there should be a hamburger menu to toggle the navigation links.

### Storefront — Layout Footer

The `(storefront)/[subdomain]/layout.tsx` footer is updated:
- a modern real world responsive footer.

---

## Implementation

### 1. Database Schema

**File:** `db/schema.ts`

Add the following nullable text columns to the `merchants` table:

```ts
heroImageUrl: text("hero_image_url"),
subtitle: text("subtitle"),
storeDescription: text("store_description"),
storeAddress: text("store_address"),
socialLinks: text("social_links"),   // JSON string: { facebook?, instagram?, whatsapp?, tiktok? }
customFaqs: text("custom_faqs"),     // JSON string: Array<{ question: string; answer: string }>
```

**Why `text` for JSON columns:** Use `text` and parse/stringify in the query layer to avoid needing `jsonb` type imports. The query layer will serialize/deserialize.

### 2. Migration

Run:
```
pnpm dlx drizzle-kit generate
pnpm dlx drizzle-kit migrate
```

### 3. Supabase Storage Bucket

Create a new Supabase Storage bucket `merchant-assets` (public read, authenticated write scoped to merchant). This is done via Supabase MCP `execute_sql` or dashboard — not via script.

File naming convention: `merchant-assets/{merchant_id}/hero.{ext}`

Only one hero image per merchant. Uploading a new one replaces the previous path.

### 4. Zod Validation Schema

**File:** `lib/validations/storefront.ts` *(new file)*

```ts
import { z } from "zod"

export const socialLinksSchema = z.object({
  facebook: z.string().url("Invalid Facebook URL.").optional().or(z.literal("")),
  instagram: z.string().url("Invalid Instagram URL.").optional().or(z.literal("")),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
  tiktok: z.string().url("Invalid TikTok URL.").optional().or(z.literal("")),
})

export const faqItemSchema = z.object({
  question: z.string().min(3, "Question too short.").max(150, "Question too long."),
  answer: z.string().min(3, "Answer too short.").max(600, "Answer too long."),
})

export const storefrontLayoutSchema = z.object({
  heroImageUrl: z.string().url().optional().nullable(),
  subtitle: z.string().max(120, "Subtitle must be under 120 characters.").optional().or(z.literal("")),
  storeDescription: z.string().max(500, "Description must be under 500 characters.").optional().or(z.literal("")),
  storeAddress: z.string().max(200, "Address must be under 200 characters.").optional().or(z.literal("")),
  socialLinks: socialLinksSchema.optional(),
  customFaqs: z.array(faqItemSchema).max(8, "Maximum 8 FAQs allowed.").optional(),
})

export type StorefrontLayoutValues = z.infer<typeof storefrontLayoutSchema>
export type SocialLinks = z.infer<typeof socialLinksSchema>
export type FaqItem = z.infer<typeof faqItemSchema>
```

### 5. Merchant Query Layer

**File:** `db/queries/merchants.ts`

Add a new function:

```ts
export async function updateStorefrontLayout(
  merchantId: string,
  data: {
    heroImageUrl?: string | null
    subtitle?: string | null
    storeDescription?: string | null
    storeAddress?: string | null
    socialLinks?: string | null   // pre-serialized JSON string
    customFaqs?: string | null    // pre-serialized JSON string
  }
)
```

Calls `db.update(merchants).set(data).where(eq(merchants.id, merchantId)).returning()`.

`getMerchantBySubdomain` and `getMerchantByOwnerId` return types now include the new columns automatically (Drizzle infers from the schema — no query change needed).

### 6. Server Action

**File:** `app/actions/settings.ts`

Add `updateStorefrontLayoutAction(values: unknown)`:
- Authenticates via `auth.api.getSession()`, resolves merchant.
- Parses with `storefrontLayoutSchema.safeParse(values)`.
- Serializes `socialLinks` and `customFaqs` to JSON string before passing to `updateStorefrontLayout`.
- Calls `revalidatePath("/dashboard/settings")`.
- Returns `{ success: true }` or `{ success: false, error: string }`.

The hero image URL is passed as `heroImageUrl` in the action payload. The image is uploaded **client-side** to Supabase Storage (same pattern as `ProductForm`) and only the resulting public URL is sent to the server action. The server action never handles binary file data.

### 7. Dashboard Settings Form — New Tab

**File:** `app/(dashboard)/dashboard/settings/components/StoreSettingsForm.tsx`

- Extend `type Tab` to `"profile" | "payments" | "inventory" | "storefront"`.
- Add a 4th pill tab button with `LayoutTemplate` icon, label "Storefront Layout".
- Add a `storefrontForm` TanStack Form instance with default values sourced from new merchant columns. Deserialize `socialLinks` and `customFaqs` from JSON in `defaultValues` (use `JSON.parse` wrapped in `try/catch` with fallback to `{}` / `[]`).
- The hero image section uses `useState<File | null>` for the pending upload and `useState<string | null>` for the current preview URL (initialized to `merchant.heroImageUrl ?? null`). On submit, if a new file is staged, upload it to `merchant-assets/{merchant_id}/hero.{ext}` first using the Supabase Storage client, then include the resulting public URL in the action payload.
- The FAQs section is managed via `storefrontForm.Field name="customFaqs"`. Render each FAQ entry as two inputs (Question + Answer) with a `Trash2` icon button to remove. An "Add FAQ" button calls `field.pushValue({ question: "", answer: "" })` (disabled when length === 8).
- Update the `Merchant` interface at the top of the file to include all new columns (all nullable strings).
- **Tab bar layout:** widen the pill container from `max-w-lg` to `max-w-2xl` to accommodate 4 tabs. On mobile, add `overflow-x-auto` to the pill bar container.

### 8. Storefront Page

**File:** `app/(storefront)/[subdomain]/page.tsx`

- Fetch the full merchant record via `getMerchantById(merchantId)` to access new columns. Parse `socialLinks` and `customFaqs` from JSON with `try/catch` fallback.
- **Hero Banner (replace existing editorial header):**
  - If `merchant.heroImageUrl`: render a `relative aspect-[3/1] overflow-hidden rounded-2xl w-full` container. Inside: `<Image fill object-cover>` + an absolutely positioned `div` with `bg-gradient-to-t from-black/60 to-transparent inset-0 absolute` + bottom-anchored store name (`text-white`) and subtitle.
  - If no hero image: render the existing editorial header. Replace the hardcoded description with `merchant.subtitle ?? "Browse our boutique clothing collections and order directly online."`.
- **FAQ section:** render after the catalog section if `parsedFaqs.length > 0`:
  ```tsx
  <section className="flex flex-col gap-4">
    <h2 className="text-heading-lg font-semibold text-ink uppercase tracking-tight">
      Frequently Asked Questions
    </h2>
    <div className="flex flex-col divide-y divide-hairline-light border border-hairline-light rounded-2xl overflow-hidden">
      {parsedFaqs.map((faq, i) => (
        <details key={i} className="group p-5 cursor-pointer">
          <summary className="flex items-center justify-between font-semibold text-body-strong text-ink list-none">
            {faq.question}
            <span className="text-shade-40 group-open:rotate-45 transition-transform duration-200 text-xl leading-none">+</span>
          </summary>
          <p className="mt-3 text-body-md text-shade-55 font-light leading-relaxed">{faq.answer}</p>
        </details>
      ))}
    </div>
  </section>
  ```
- `export const revalidate = 60` remains unchanged.
- Import `Image` from `next/image` for the hero banner.

### 9. Storefront Layout Footer

**File:** `app/(storefront)/[subdomain]/layout.tsx`

- Call `getMerchantById(merchantId)` inside the layout (server component DB call is fine).
- Parse `socialLinks` from JSON with `try/catch` fallback to `{}`.
- Update the footer:
  ```tsx
  <footer className="border-t border-hairline-light bg-canvas-light py-8 px-6">
    <div className="max-w-6xl mx-auto flex flex-col items-center gap-3 text-center">
      <p className="text-caption text-shade-40">© 2026 {merchantName}. Powered by ShopNest.</p>
      {merchant?.storeAddress && (
        <p className="text-micro text-shade-40">{merchant.storeAddress}</p>
      )}
      {/* Social icons */}
      {hasSocialLinks && (
        <div className="flex items-center gap-4 mt-1">
          {parsedSocialLinks.facebook && (
            <a href={parsedSocialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-shade-40 hover:text-ink transition-colors">
              <Facebook className="h-4 w-4" />
            </a>
          )}
          {/* ... instagram, whatsapp (wa.me), tiktok */}
        </div>
      )}
    </div>
  </footer>
  ```

### 10. next.config Remote Patterns

**File:** `next.config.ts` (check existing file first)

Confirm `*.supabase.co` is in `images.remotePatterns`. If only a specific Supabase project hostname is listed (e.g. `xyz.supabase.co`) and `merchant-assets` lives in the same project, no change is needed. If a wildcard is not already present, add:
```ts
{
  protocol: "https",
  hostname: "*.supabase.co",
  pathname: "/storage/v1/object/public/**",
}
```

---

## Dependencies

No new npm packages required. All features use the existing stack:
- `next/image` — already available.
- Supabase Storage JS client (`@/lib/supabase/client.ts`) — already used in `ProductForm`.
- TanStack Form — already installed.
- Zod v4 — already installed.
- Lucide React (`LayoutTemplate`, `Facebook`, `Instagram`, `MessageCircle`, `Music`, `Trash2`) — already installed, just new icon imports.

**New Supabase Storage bucket** (manual setup, not npm):
- Bucket name: `merchant-assets`
- Public read: `true`
- Authenticated write: scoped to merchant via RLS or storage policy

---

## Verification Checklist

### Schema & Migration
- [ ] `merchants` table has all six new nullable columns after migration: `hero_image_url`, `subtitle`, `store_description`, `store_address`, `social_links`, `custom_faqs`.
- [ ] `getMerchantByOwnerId` and `getMerchantBySubdomain` return all new fields without additional query changes (Drizzle infers automatically).
- [ ] `updateStorefrontLayout` query function updates only the storefront fields and does NOT touch `subdomain` (Invariant 5 compliance).

### Server Action
- [ ] `updateStorefrontLayoutAction` rejects unauthenticated requests.
- [ ] `socialLinks` and `customFaqs` are correctly serialized to JSON string before DB write, and parsed from JSON when forming form default values.
- [ ] Action calls `revalidatePath("/dashboard/settings")`.

### Dashboard Tab
- [ ] A 4th "Storefront Layout" tab appears in the settings pill bar.
- [ ] Hero image upload: selecting a file shows a live preview; submitting uploads to `merchant-assets/{merchant_id}/hero.{ext}` and saves the public URL.
- [ ] "Remove Hero Image" sets `heroImageUrl` to `null` and clears the preview.
- [ ] Subtitle, store description, and store address inputs save and reload correctly on revisit.
- [ ] Social link URL fields show inline Zod validation errors for invalid URLs.
- [ ] FAQs: "Add FAQ" appends a new entry. "Add FAQ" is disabled when 8 FAQs exist. Each entry has working Question + Answer inputs. Trash icon removes the entry. Saving persists the FAQ list.
- [ ] Success/error feedback is tab-local (does not bleed into other tabs).
- [ ] Files larger than 2 MB are rejected client-side before upload attempt.

### Storefront Hero Banner
- [ ] When `heroImageUrl` is set: hero image renders with gradient overlay and store name/subtitle text on top in white.
- [ ] When no `heroImageUrl`: editorial header renders with `merchant.subtitle` or fallback copy.
- [ ] `next/image` renders with correct `fill` + `object-cover` — no layout shift or broken image.

### Storefront FAQ Accordion
- [ ] FAQ section only renders when `customFaqs` is non-empty after parsing.
- [ ] Each FAQ expands/collapses on click via native `<details>`/`<summary>`.
- [ ] No JavaScript required for expand/collapse behaviour.

### Storefront Footer
- [ ] Store address renders in footer when set, hidden when not set.
- [ ] Social icons render only for non-empty link values.
- [ ] All social links open in a new tab with `rel="noopener noreferrer"`.
- [ ] Footer renders cleanly on mobile (icons do not overflow).

### Edge Cases
- [ ] Merchant with zero FAQs: FAQ section is entirely absent from the storefront.
- [ ] Merchant with no hero image and no subtitle: storefront shows store name + fallback copy — no blank sections.
- [ ] Corrupt or missing `social_links`/`custom_faqs` JSON in DB gracefully defaults to empty object/array (parse in `try/catch`).
- [ ] Hero image with wrong MIME type is rejected client-side.
