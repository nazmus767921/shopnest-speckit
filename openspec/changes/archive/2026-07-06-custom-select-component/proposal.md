## Why

The native HTML `<select>` element is used extensively across the dashboard, admin, and storefront areas (at least 16+ direct usages in components like `VariantBulkToolbar`, `VariantFilterBar`, `VariantSelector`, `SubscriptionsClient`, `OrdersClient`, `ProductsClient`, `StoreSettingsForm`). Native selects suffer from:

- **Inconsistent styling** across browsers and OS — cannot be reliably styled to match the ShopNest design system
- **Poor UX** — no custom option rendering, no icon support, no loading/async states
- **Design system violation** — native selects don't use DESIGN.md tokens (`hairline-light`, `canvas-cream`, `rounded-full`, pill buttons, etc.)

Meanwhile, the Combobox component already has the desired visual language (dropdown, options list, keyboard navigation, check marks, loading/empty states). A dedicated Select component that reuses the same UI chrome but removes the search input will provide a consistent, design-system-native replacement everywhere a simple selection is needed.

## What Changes

- **New component**: `Select` primitive — a search-less dropdown selector with the same visual identity as the existing Combobox
- **Replace native selects**: Gradually migrate existing `<select>` usages across the codebase to the new `Select` component
- **Features**:
  - Custom option rendering via `renderOption` prop
  - Custom option label/value keys via `getOptionLabel` / `getOptionValue`
  - Custom placeholder text
  - Custom icon slots (left and/or right of the trigger) via prop
  - Async option fetching with `onSearch` / `isLoading` (server-side search without client filter)
  - Empty state message
  - Client-side filtering fallback (via `searchKeys`) when no async search is provided
  - Keyboard navigation (Arrow keys, Enter, Escape, Tab)
  - Clear selection button
  - Error state
  - Disabled state
  - Same design tokens as Combobox (hairline borders, pill styling, cream/light canvas, emerald accent)

## Capabilities

### New Capabilities
- `custom-select`: The standalone Select primitive component with full feature set, sharing visual DNA with Combobox but without client-side search input

### Modified Capabilities
- *(No existing capabilities are being modified — this is a new primitive)*

## Impact

- **New file**: `components/ui/primitives/Select.tsx` — the new component
- **No breaking changes** to existing components — native `<select>` replacements will be done incrementally in separate changes
- **Design system**: Extends the existing UI primitive set, consistent with Combobox
- **Dependencies**: Uses `lucide-react` icons (already present), same Tailwind class conventions
