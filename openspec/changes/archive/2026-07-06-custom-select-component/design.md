## Context

The native `<select>` element is used in 16+ locations across the dashboard, admin, and storefront areas (product variant editor, order filters, subscription management, settings forms, etc.). These cannot be reliably styled to match the ShopNest design system — they vary across browsers, ignore DESIGN.md tokens, and lack advanced features like custom option rendering, icon slots, async loading, and keyboard navigation.

The Combobox component (`components/ui/primitives/Combobox.tsx`) already provides the desired visual language: dropdown with pill-style trigger, chevron icon, check marks, hover/active states, keyboard navigation, loading/empty states — all using DESIGN.md tokens. The Select will reuse this same UI chrome but remove the client-side search input, making it a pure selection dropdown.

## Goals / Non-Goals

**Goals:**
- Deliver a `Select<T>` primitive component at `components/ui/primitives/Select.tsx`
- Visually identical to Combobox (trigger button, chevron, dropdown with options, check marks, pill styling, emerald accent)
- Remove the search bar/input from the dropdown — no client-side text filtering displayed in the UI
- Support the same advanced features as Combobox:
  - Custom option rendering via `renderOption`
  - Custom label/value keys via `getOptionLabel` / `getOptionValue`
  - Custom placeholder text
  - Custom icon slots (left and/or right of the trigger) via optional `iconLeft` / `iconRight` props
  - Async fetching with debounced `onSearch` (triggered on open, configurable via `debounceMs`) + `isLoading`
  - Client-side filtering fallback via `searchKeys` (internal filtering, no search UI)
  - Empty state message (`noOptionsMessage`)
  - Clear selection button
  - Error and disabled states
  - Full keyboard navigation (Arrow keys, Enter, Escape, Tab)
- Follow all DESIGN.md constraints (pill buttons, no shadows, cream/light canvas, emerald-800 accent, Inter/NeueHaasGrotesk typography)
- Upgrade the existing Combobox component with the same viewport collision detection, overflow protection (fixed positioning + high z-index), and independent dropdown width behavior, so both components remain visually and behaviorally in sync

**Non-Goals:**
- Not a Combobox replacement — Combobox stays for search-and-select use cases
- No migration of existing native `<select>` usages in this change (will be done in follow-up changes)
- No multi-select mode (future enhancement if needed)
- No portal/popover customization beyond the existing dropdown pattern

## Decisions

### 1. New component vs. extending Combobox with a `showSearch` prop

**Decision:** New `Select` component — do not add a `showSearch` prop to Combobox.

**Rationale:**
- A `showSearch` prop would add conditional branches inside Combobox's rendering, increasing complexity for both components
- The two components have different keyboard behavior (Combobox focuses search input on open; Select focuses the first option)
- If the search input is hidden but the filtering logic still runs internally (`searchKeys`), users would be confused by invisible search controls
- A separate component allows each to evolve independently without risk of breaking the other
- The shared dropdown logic (options list, keyboard nav, scroll, click outside) can be extracted to a shared hook if duplication becomes an issue — but for now, the duplication is small and clear

### 2. Architecture: standalone vs. hook-based extraction

**Decision:** Standalone `Select.tsx` that duplicates the dropdown rendering logic from Combobox, but without the search input.

**Rationale:**
- The dropdown logic (list rendering, keyboard navigation, active index tracking, click-outside) is tightly coupled to the component's JSX
- Extracting a shared hook (`useSelectDropdown`) would be premature — Combobox and Select differ in enough details (search input, focus management, filtering display) that the abstraction would require escape hatches
- If a third dropdown primitive emerges, extraction becomes justified
- Duplication is acceptable at this scale (~200 lines vs. Combobox's ~250 lines)

### 3. Custom icon slots

**Decision:** Use `iconLeft?: React.ReactNode` and `iconRight?: React.ReactNode` props on the trigger button.

**Rationale:**
- Consistent with the existing `lucide-react` icon usage across the codebase
- `iconLeft` appears before the selected label text inside the trigger
- `iconRight` appears after the clear button but before the chevron (or replaces the chevron if set)
- Both accept any React node, allowing SVG icons, badges, or custom elements
- The trigger always shows a chevron by default; if `iconRight` is set, it appears between clear button and chevron

### 4. Async fetching behavior

**Decision:** When `onSearch` is provided, call `onSearch("")` on dropdown open to trigger initial fetch. The call SHALL be debounced by `debounceMs` milliseconds (default 300ms) to prevent rapid open/close cycles from triggering unnecessary fetches. The internal client-side filtering (`searchKeys`) is bypassed when `onSearch` is set — the parent is fully responsible for filtering.

**Rationale:**
- Mirrors the Combobox's existing async pattern — consumers call an API on open and pass back filtered options
- No search input means no debounced query from typing — but debouncing the open-triggered fetch prevents spurious requests when users rapidly toggle the dropdown (e.g., accidental clicks, keyboard navigation)
- A default of 300ms keeps the UI feeling responsive while avoiding redundant fetches for quick open/close cycles
- The loading state is driven by `isLoading` prop (parent controls this based on the fetch lifecycle)
- This keeps the component mostly stateless and the parent in control of data fetching

### 5. Test strategy

**Decision:** Unit + interaction tests using Vitest + React Testing Library.

**Rationale:**
- The component is a pure UI primitive — no DB, no API calls in the component itself
- Tests cover: rendering options, selection, keyboard navigation, disabled state, error state, async loading placeholder, icon rendering, custom option rendering, empty state
- No integration tests needed (no external service boundaries)
- Follows the project's TDD convention

## Risks / Trade-offs

- **[Duplication] → Mitigation:** Select duplicates ~30-40% of Combobox's JSX. If a third dropdown variant emerges, extract to a shared `useSelectList` hook or render-prop pattern.
- **[Feature drift] → Mitigation:** Select and Combobox should remain visually identical. Any visual update to one should be applied to both. Add a comment at the top of both files: "Keep visual appearance in sync with Select.tsx / Combobox.tsx"
- **[Async footgun] → Mitigation:** If `onSearch` is provided but `isLoading` is not managed correctly, users may see stale options. Document in the component JSDoc that consumers must pair `onSearch` with `isLoading` state management.
- **[Debounce latency] → Mitigation:** The 300ms debounce default may be perceptible in fast-paced UIs. Consumers can set `debounceMs={0}` to disable debouncing entirely, or increase it for expensive fetches.

## Resolved Questions

### 6. Dropdown collision detection (viewport-aware positioning)

**Decision:** Implement viewport collision detection that flips the dropdown to open upward when there's insufficient space below the trigger, and adjusts horizontal offset to stay within the viewport. Applied to both Select and Combobox.

**Rationale:**
- The dropdown should never render partially outside the viewport, regardless of scroll position or form location
- A simple collision detection check runs on open: compare `triggerRect.bottom + estimatedDropdownHeight` against `window.innerHeight`. If insufficient space below, flip to open upward (via `bottom-full` on the dropdown)
- No external dependency (Popper.js / Floating UI) — the logic is small enough to inline (~30 lines)
- On resize or scroll while open, position is NOT recalculated — only on open. Recalculation on scroll/resize can be added later if needed.
- Horizontal collision: if the dropdown extends beyond `window.innerWidth`, offset it leftward to stay within viewport
- Both Select and Combobox use the same injected collision detection logic to remain visually in sync

### 7. Z-index and overflow protection

**Decision:** Use `fixed` positioning for the dropdown (relative to the viewport via `getBoundingClientRect()`) with a high z-index (`z-50`). Do NOT use `createPortal`. Applied to both Select and Combobox.

**Rationale:**
- `fixed` positioning completely bypasses any parent `overflow-hidden` because fixed elements are positioned relative to the viewport, not the containing block — no portal needed
- `createPortal` would detach the dropdown from the trigger's DOM tree, complicating focus management, scroll position tracking, and click-outside handling
- `z-50` is high enough to render above the project's existing stacking contexts (Dialog/Modal uses `z-40`)
- If a deeper stacking context issue arises in the future, a portal-based solution can be introduced for both Select and Combobox simultaneously
- Computing position from `getBoundingClientRect()` on each open ensures correct placement regardless of trigger scroll position
- Both Select and Combobox use the same approach so they behave identically in modals, drawers, and overflow-hidden containers

### 8. Dropdown width independent from trigger

**Decision:** The dropdown container width is decoupled from the trigger button width — it uses `min-w-full` (at least as wide as the trigger), `w-max` (expand to fit content), and `max-w-[calc(100vw-2rem)]` (cap at viewport for mobile). Applied to both Select and Combobox.

**Rationale:**
- Previously both components used `w-full` on the dropdown, matching the trigger width — causing long option text to be truncated
- The new sizing prevents text cutoff while keeping the dropdown usable on mobile viewports
- The trigger remains at its natural width; only the dropdown expands

### 9. Shared dropdown infrastructure extraction

**Decision:** Extract the new collision detection, fixed-positioning, and width-independence logic into a shared internal hook (`useDropdownPosition`) used by both Select and Combobox, rather than duplicating the code.

**Rationale:**
- The three features (collision flip, fixed positioning, independent width) are purely mechanical — no component-specific logic involved
- Duplicating 50+ lines of position math across two files creates a maintenance burden
- A shared hook keeps both components in sync automatically
- The hook lives at `components/ui/primitives/useDropdownPosition.ts` (internal, not exported from barrel)

### 10. Debounce application

**Decision:** Applied on every open transition — the debounce timer resets each time the dropdown closes before the timer fires, so rapid open/close cycles cancel the fetch entirely.
