## 1. Test Infrastructure Setup

- [x] 1.1 Create `components/ui/primitives/__tests__/Select.test.tsx` with Vitest + React Testing Library test harness
- [x] 1.2 Verify test runner can execute the test file (vitest run) — red phase confirmed

## 2. Write Failing Tests (TDD — Red Phase)

- [x] 2.1 Write test: renders trigger button with placeholder when no value is selected
- [x] 2.2 Write test: renders trigger button with selected option label when value is provided
- [x] 2.3 Write test: opens dropdown on trigger click and closes on outside click
- [x] 2.4 Write test: closes dropdown on Escape key press
- [x] 2.5 Write test: keyboard navigation — ArrowDown opens dropdown and highlights first option
- [x] 2.6 Write test: keyboard navigation — ArrowDown/ArrowUp moves active index through options
- [x] 2.7 Write test: selects active option on Enter and calls onChange
- [x] 2.8 Write test: renders custom option content via renderOption prop
- [x] 2.9 Write test: shows check icon on selected option only
- [x] 2.10 Write test: custom getOptionLabel extracts display label correctly
- [x] 2.11 Write test: custom getOptionValue extracts comparison value correctly
- [x] 2.12 Write test: iconLeft renders before the label in the trigger
- [x] 2.13 Write test: iconRight renders after the clear button but before the chevron
- [x] 2.14 Write test: calls onSearch("") after debounceMs when dropdown opens (async mode)
- [x] 2.15 Write test: cancels debounced fetch when dropdown closes before debounceMs elapses
- [x] 2.16 Write test: resets debounce timer on rapid open/close cycles
- [x] 2.17 Write test: uses custom debounceMs value
- [x] 2.18 Write test: disables debounce when debounceMs={0}
- [x] 2.19 Write test: shows loading spinner when isLoading is true
- [x] 2.20 Write test: shows noOptionsMessage when options array is empty
- [x] 2.21 Write test: clear button appears when value is selected and calls onChange(null)
- [x] 2.22 Write test: shows error styling and error message when error prop is provided
- [x] 2.23 Write test: disables interaction when disabled prop is true

## 3. Implement Select Component (TDD — Green Phase)

- [x] 3.1 Create `components/ui/primitives/Select.tsx` with `"use client"` directive and TypeScript interface (`SelectProps<T>`)
- [x] 3.2 Implement trigger button rendering with placeholder/selected label, chevron icon, and pill-style rounded classes
- [x] 3.3 Implement dropdown open/close state management with click outside detection
- [x] 3.4 Implement options list rendering with keyboard navigation (ArrowDown, ArrowUp, Enter, Escape, Tab)
- [x] 3.5 Implement active index tracking with scroll-into-view behavior
- [x] 3.6 Implement option selection with onChange callback and dropdown close
- [x] 3.7 Implement renderOption prop for custom option content
- [x] 3.8 Implement check icon display on selected option with DESIGN.md token (`text-emerald-800`)
- [x] 3.9 Implement getOptionLabel and getOptionValue default extraction logic
- [x] 3.10 Implement iconLeft and iconRight props in the trigger button
- [x] 3.11 Implement debounced async mode: onSearch("") after debounceMs on dropdown open, cancel on close, with isLoading loading spinner
- [x] 3.12 Implement debounceMs prop with default 300ms
- [x] 3.13 Implement empty state with noOptionsMessage fallback
- [x] 3.14 Implement clear selection (X) button with stopPropagation
- [x] 3.15 Implement error state with red border and error message
- [x] 3.16 Implement disabled state with opacity, cursor, and interaction blocking
- [x] 3.17 Ensure all DESIGN.md constraints: no shadow classes, hairline-light borders, canvas-cream hover, emerald-800 accent
- [x] 3.18 Add JSDoc comment: "Keep visual appearance in sync with Combobox.tsx"

## 4. Verify and Refactor

- [x] 4.1 Run `vitest run` to confirm all tests pass — 28/28 passing
- [x] 4.2 Review component for type-safety and edge cases (empty options, null value, rapid open/close)
- [x] 4.3 Verify the component exports from `components/ui/primitives/index.ts` (create barrel export if needed)

## 5. Shared Hook: useDropdownPosition

- [x] 5.1 Create `components/ui/primitives/useDropdownPosition.ts` — shared internal hook
- [x] 5.2 Implement `useDropdownPosition(dropdownRef, triggerRef, isOpen)` returns `{ style: React.CSSProperties, flip: boolean }`
- [x] 5.3 Hook computes `getBoundingClientRect()` on each `isOpen` transition to `true`
- [x] 5.4 Hook detects viewport collision: if `triggerRect.bottom + maxDropdownHeight > window.innerHeight`, set `flip = true`
- [x] 5.5 Hook applies horizontal offset correction if dropdown extends beyond viewport edges
- [x] 5.6 Hook returns `position: fixed` with left/top (or bottom) coordinates as a CSS style object
- [x] 5.7 Hook does NOT recalculate on scroll/resize — only on open

## 6. Apply to Select

- [x] 6.1 Integrate `useDropdownPosition` into Select component
- [x] 6.2 Replace `position: absolute` + `top-full` in dropdown with `position: fixed` + coordinates from hook, and use `flip` boolean to choose bottom vs. top alignment
- [x] 6.3 Remove old `w-full` class on dropdown; apply `min-w-full w-max max-w-[calc(100vw-2rem)]` via the hook's style object or className
- [x] 6.4 Apply `z-50` to the dropdown element (via className or inline style)
- [x] 6.5 Verify Select dropdown correctly opens upward near viewport bottom, and stays within horizontal bounds ✓ (tested in 8.1–8.2)
- [x] 6.6 Verify Select dropdown is not clipped by parent `overflow-hidden` ✓ (fixed positioning + tests)

## 7. Apply to Combobox

- [x] 7.1 Integrate `useDropdownPosition` into Combobox component
- [x] 7.2 Replace Combobox's existing dropdown positioning (`absolute` + `top-full` + `w-full`) with `fixed` positioning from the hook
- [x] 7.3 Remove `w-full` from Combobox dropdown; apply `min-w-full w-max` (width cap handled by hook's maxWidth style)
- [x] 7.4 Apply `z-50` to Combobox dropdown
- [x] 7.5 Verify Combobox dropdown correctly opens upward near viewport bottom, and stays within horizontal bounds ✓ (tested in 9.1–9.2)
- [x] 7.6 Verify Combobox dropdown is not clipped by parent `overflow-hidden` ✓ (fixed positioning + tests)

## 8. Tests for Select

- [x] 8.1 Add test: dropdown flips upward when insufficient space below trigger
- [x] 8.2 Add test: dropdown adjusts horizontal offset when extending beyond viewport
- [x] 8.3 Add test: dropdown uses fixed positioning (check inline style contains `position: fixed`)
- [x] 8.4 Add test: dropdown has z-50 z-index
- [x] 8.5 Add test: dropdown width is independent from trigger (min-w-full, w-max, viewport cap)
- [x] 8.6 Verify all existing 28+ tests still pass after position/z-index changes ✓ (35/35 passing)

## 9. Tests for Combobox

- [x] 9.1 Add test: dropdown flips upward when insufficient space below trigger
- [x] 9.2 Add test: dropdown adjusts horizontal offset when extending beyond viewport
- [x] 9.3 Add test: dropdown uses fixed positioning
- [x] 9.4 Add test: dropdown has z-50 z-index
- [x] 9.5 Add test: dropdown width is independent from trigger
- [x] 9.6 Verify all existing Combobox tests still pass after position/z-index changes ✓ (7/7 passing)
