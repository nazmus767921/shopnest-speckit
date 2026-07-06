## ADDED Requirements

> **Note:** The collision detection, overflow protection (fixed positioning + z-index), and independent dropdown width requirements in this section also apply to the existing `Combobox` component. Both Select and Combobox use the same shared implementation (`useDropdownPosition` hook) to stay visually and behaviorally in sync.

### Requirement: Select component renders a trigger button with selected value or placeholder

The system SHALL provide a `<Select>` component that renders a trigger button showing either the selected option label (when a value is set) or the placeholder text (when no value is selected).

#### Scenario: Shows placeholder when no value is selected
- **WHEN** the Select component is rendered with a `placeholder` prop but no `value`
- **THEN** the trigger button SHALL display the placeholder text using `text-shade-40` styling

#### Scenario: Shows selected option label
- **WHEN** a `value` is provided and a matching option exists
- **THEN** the trigger button SHALL display `getOptionLabel(value)` in `text-ink font-medium`

#### Scenario: Uses default label extraction when getOptionLabel is omitted
- **WHEN** `getOptionLabel` is not provided and the option has a `label` property
- **THEN** the component SHALL use `option.label` as the display label
- **WHEN** the option has no `label` property but has a `name` property
- **THEN** the component SHALL fall back to `option.name`
- **WHEN** the option has neither `label` nor `name`
- **THEN** the component SHALL fall back to `String(option)`

### Requirement: Select component opens a dropdown on click

The system SHALL open a dropdown list of options when the trigger button is clicked, and close it when clicking outside, pressing Escape, or selecting an option.

#### Scenario: Opens dropdown on trigger click
- **WHEN** the trigger button is clicked
- **THEN** a dropdown container SHALL appear below the trigger with a list of options

#### Scenario: Closes dropdown on outside click
- **WHEN** the dropdown is open and the user clicks outside the component container
- **THEN** the dropdown SHALL close

#### Scenario: Closes dropdown on Escape key
- **WHEN** the dropdown is open and the user presses Escape
- **THEN** the dropdown SHALL close

#### Scenario: Closes dropdown on option selection
- **WHEN** the dropdown is open and the user selects an option
- **THEN** the dropdown SHALL close and `onChange` SHALL be called with the selected option

### Requirement: Select supports keyboard navigation

The system SHALL support full keyboard navigation through the options list using Arrow keys, Enter for selection, and Tab for closing.

#### Scenario: Opens dropdown with ArrowDown key
- **WHEN** the trigger button is focused and the user presses ArrowDown
- **THEN** the dropdown SHALL open and the first option SHALL be highlighted as active

#### Scenario: Navigates options with Arrow keys
- **WHEN** the dropdown is open and the user presses ArrowDown
- **THEN** the active index SHALL move to the next option, scrolling it into view if needed
- **WHEN** the dropdown is open and the user presses ArrowUp
- **THEN** the active index SHALL move to the previous option, scrolling it into view if needed

#### Scenario: Selects active option with Enter
- **WHEN** the dropdown is open, an option is active, and the user presses Enter
- **THEN** `onChange` SHALL be called with the active option and the dropdown SHALL close

#### Scenario: Closes dropdown with Tab
- **WHEN** the dropdown is open and the user presses Tab
- **THEN** the dropdown SHALL close

### Requirement: Select supports custom option rendering

The system SHALL allow consumers to customize option rendering via a `renderOption` prop.

#### Scenario: Renders custom option content
- **WHEN** `renderOption` is provided
- **THEN** each option SHALL be rendered using `renderOption(option, { selected, active })` instead of the default label text

#### Scenario: Default rendering shows option label
- **WHEN** `renderOption` is not provided
- **THEN** each option SHALL display `getOptionLabel(option)` as text content

### Requirement: Select marks the selected option with a check icon

The system SHALL display a check mark icon next to the currently selected option in the dropdown.

#### Scenario: Shows check on selected option
- **WHEN** the dropdown is open and an option matches the current `value` (by `getOptionValue` comparison)
- **THEN** that option SHALL display a `Check` icon from `lucide-react` with `text-emerald-800` styling

#### Scenario: Does not show check on unselected options
- **WHEN** the dropdown is open and an option does not match the current `value`
- **THEN** that option SHALL NOT display the check icon

### Requirement: Select supports custom option value extraction

The system SHALL allow consumers to define how option values are compared via a `getOptionValue` prop.

#### Scenario: Uses custom key for value comparison
- **WHEN** `getOptionValue` is provided as `(opt) => opt.id`
- **THEN** the component SHALL use `option.id` to determine if an option is selected

#### Scenario: Default value extraction
- **WHEN** `getOptionValue` is not provided
- **THEN** the component SHALL use `option?.value ?? option?.id ?? option` as the value

### Requirement: Select supports custom icon slots on the trigger

The system SHALL allow consumers to place custom icons to the left and/or right of the selected label via `iconLeft` and `iconRight` props.

#### Scenario: Renders icon on the left of the trigger label
- **WHEN** `iconLeft` is provided with a React node (e.g., a lucide-react icon component)
- **THEN** the icon SHALL appear inside the trigger button, before the selected label text

#### Scenario: Renders icon on the right of the trigger label
- **WHEN** `iconRight` is provided with a React node
- **THEN** the icon SHALL appear inside the trigger button, after the clear button (if visible) but before the chevron icon

#### Scenario: Custom icons do not interfere with clear or chevron
- **WHEN** both `iconLeft` and `iconRight` are provided and a value is selected
- **THEN** the trigger button SHALL display, in order: iconLeft, selected label, clear button, iconRight, chevron

### Requirement: Select supports debounced async option fetching with loading state

The system SHALL support asynchronous option fetching triggered when the dropdown opens, with a configurable debounce to prevent redundant fetches during rapid open/close cycles.

#### Scenario: Calls onSearch with debounce when dropdown opens
- **WHEN** `onSearch` is provided and the dropdown opens
- **THEN** the component SHALL wait `debounceMs` milliseconds (default `300`) before calling `onSearch("")`

#### Scenario: Cancels debounced fetch when dropdown closes before timer fires
- **WHEN** `onSearch` is provided, the dropdown opens, and the dropdown closes again before `debounceMs` elapses
- **THEN** the component SHALL NOT call `onSearch("")` — the pending debounced call SHALL be cancelled

#### Scenario: Resets debounce timer on rapid open/close
- **WHEN** `onSearch` is provided and the user opens and closes the dropdown repeatedly within `debounceMs`
- **THEN** the debounce timer SHALL reset each time the dropdown opens, so `onSearch` is only called once the dropdown stays open for `debounceMs`

#### Scenario: Uses custom debounceMs value
- **WHEN** `debounceMs` is set to `1000` and the dropdown opens
- **THEN** the component SHALL wait 1000ms before calling `onSearch("")`

#### Scenario: Disables debounce with debounceMs={0}
- **WHEN** `debounceMs={0}` is provided and the dropdown opens
- **THEN** the component SHALL call `onSearch("")` immediately without any delay

#### Scenario: Shows loading indicator
- **WHEN** `isLoading` is `true` and the dropdown is open
- **THEN** the dropdown SHALL display a `Loader2` spinner icon with `animate-spin` and the text "Loading options..." centered in the options area

#### Scenario: Bypasses client-side filtering when onSearch is set
- **WHEN** `onSearch` is provided
- **THEN** the component SHALL NOT apply any client-side filtering via `searchKeys` — the parent is fully responsible for filtering

### Requirement: Select supports client-side filtering fallback

The system SHALL support client-side filtering of options via `searchKeys` when no async search is configured.

#### Scenario: Filters options by searchKeys
- **WHEN** a query is constructed internally (from the selected state) but no client search input is shown
- **THEN** the component SHALL filter options where at least one key in `searchKeys` contains the query

#### Scenario: Falls back to label filtering without searchKeys
- **WHEN** `searchKeys` is not provided and no `onSearch` is set
- **THEN** the component SHALL display all options without filtering

### Requirement: Select shows empty state message

The system SHALL display a configurable empty state message when the options list is empty.

#### Scenario: Shows noOptionsMessage
- **WHEN** the options array is empty and the dropdown is open
- **THEN** the dropdown SHALL display the `noOptionsMessage` text centered and italicized with `text-shade-40` styling
- **WHEN** `noOptionsMessage` is not provided
- **THEN** the default message "No options found." SHALL be displayed

### Requirement: Select supports clearing the selection

The system SHALL display a clear (X) button on the trigger when a value is selected and the component is not disabled.

#### Scenario: Shows clear button when value is selected
- **WHEN** a `value` is selected and the component is not disabled
- **THEN** an X icon button SHALL appear on the right side of the trigger, before the chevron

#### Scenario: Clears selection on clear button click
- **WHEN** the clear button is clicked
- **THEN** `onChange(null)` SHALL be called and the dropdown SHALL NOT open

### Requirement: Select supports error and disabled states

The system SHALL support error styling and disabled state for the Select component.

#### Scenario: Shows error styling
- **WHEN** an `error` string prop is provided
- **THEN** the trigger border SHALL be styled with `border-red-500` and the error message SHALL appear below the trigger in `text-micro text-red-500`

#### Scenario: Disables interaction
- **WHEN** `disabled` is `true`
- **THEN** the trigger button SHALL have `opacity-50`, `cursor-not-allowed`, and SHALL NOT respond to click or keyboard events
- **THEN** the clear button SHALL NOT be visible

### Requirement: Select uses DESiGN.md design tokens

The system SHALL follow the project's DESIGN.md constraints for all visual styling.

#### Scenario: Uses pill-style rounded corners
- **WHEN** the trigger button is rendered
- **THEN** it SHALL use the `rounded-md` class (consistent with existing primitives)

#### Scenario: Does not use shadow classes
- **WHEN** the dropdown container is rendered
- **THEN** it SHALL NOT use Tailwind `shadow-*` classes

#### Scenario: Uses DESIGN.md color tokens
- **WHEN** the trigger button is rendered in default state
- **THEN** it SHALL use `border-hairline-light`, `bg-canvas-light`, `text-ink` and `text-shade-40` for secondary text
- **WHEN** an option is hovered or active
- **THEN** it SHALL use `bg-canvas-cream/50` background
- **WHEN** an option is selected
- **THEN** it SHALL use `text-emerald-800` with `font-semibold`

### Requirement: Select and Combobox dropdowns use viewport collision detection for smart positioning

The system SHALL detect viewport boundaries on dropdown open and adjust position to prevent the dropdown from rendering partially outside the viewport. Applies to both Select and Combobox.

#### Scenario: Flips upward when insufficient space below the trigger
- **WHEN** the dropdown (Select or Combobox) opens and the available space below the trigger is less than the estimated dropdown height (based on options count)
- **THEN** the dropdown SHALL open upward (positioned above the trigger) instead of downward
- **WHEN** there IS sufficient space below
- **THEN** the dropdown SHALL open downward (default)

#### Scenario: Adjusts horizontal offset to stay within viewport
- **WHEN** the dropdown opens and its right edge extends beyond `window.innerWidth`
- **THEN** the dropdown SHALL shift leftward so its right edge aligns with the viewport right edge (minus a small margin)
- **WHEN** the dropdown opens and its left edge extends beyond the viewport left edge
- **THEN** the dropdown SHALL shift rightward so its left edge aligns with the viewport left edge (minus a small margin)

#### Scenario: Uses `fixed` positioning to escape parent overflow containers
- **WHEN** the dropdown is open
- **THEN** it SHALL use `position: fixed` relative to the viewport (coordinates computed from `trigger.getBoundingClientRect()`)
- **BECAUSE** `fixed` positioning renders the dropdown outside any parent's clipping context, preventing `overflow-hidden` from cutting off the dropdown

#### Scenario: Uses high z-index to render above overlapping content
- **WHEN** the dropdown is open
- **THEN** it SHALL use `z-50` (Tailwind, equivalent to `z-index: 50`)
- **BECAUSE** `z-50` is higher than the project's Dialog/Modal stacking context (`z-40`), ensuring the dropdown renders above overlays and modals

#### Scenario: Recalculates position on each open
- **WHEN** the dropdown opens
- **THEN** the component SHALL call `trigger.getBoundingClientRect()` to compute the current position
- **WHEN** the user scrolls or resizes the window while the dropdown is open
- **THEN** the dropdown position SHALL NOT change until it closes and reopens

### Requirement: Dropdown width is independent from trigger width

The system SHALL decouple the dropdown container width from the trigger button width so that option text is never truncated. Applies to both Select and Combobox.

#### Scenario: Dropdown width is at least as wide as the trigger
- **WHEN** the dropdown is open
- **THEN** its width SHALL be at minimum the trigger width (`min-w-full`)

#### Scenario: Dropdown expands to fit content
- **WHEN** the dropdown is open and option text is wider than the trigger
- **THEN** the dropdown SHALL expand to fit the content (`w-max`)

#### Scenario: Dropdown width is capped to viewport on mobile
- **WHEN** the dropdown is open and the content would extend beyond the viewport edges
- **THEN** the dropdown SHALL be capped at `max-w-[calc(100vw-2rem)]` to stay within the screen with 1rem margin on each side
- **BECAUSE** the dropdown should never truncate option text; it should expand to fit content up to the viewport boundary
