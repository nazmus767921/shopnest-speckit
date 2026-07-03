# UX Requirements Checklist: Product Variants & Metadata

**Purpose**: Validates quality, clarity, completeness, and consistency of the dashboard UX requirements for the inline variant table editor
**Created**: 2026-07-03
**Feature**: `specs/20-product-variants-metadata/spec.md`
**Focus**: Dashboard UX — Attribute chip input, inline variant table, cell editing, bulk toolbar, filter bar

## Requirement Completeness

- [ ] CHK001 Are all visual states of the inline variant table specified — empty (no attributes defined), populated (variants visible), loading, and error states? [Gap]
- [X] CHK002 Are chip input interaction requirements fully documented — type + Enter to add, click × to remove, keyboard support (Delete/Backspace to remove last chip)? [Completeness, Spec §FR-001]
- [ ] CHK003 Is the interaction between chip input and the variant table specified — does the table update on every chip add/remove or debounce after a pause? [Gap, Spec §FR-002]
- [ ] CHK004 Are requirements defined for what happens when the chip input limit is reached (3 attributes, 10 options per attribute)? [Completeness, Spec §FR-013]
- [ ] CHK005 Is the bulk toolbar's visibility state specified — hidden when 0 selected, shown when ≥1 variant checked? [Gap, Spec §FR-015]
- [ ] CHK006 Are requirements defined for the bulk toolbar's disabled conditions (e.g., no selection, action not applicable)? [Gap]
- [ ] CHK007 Are requirements specified for the filter bar's clear/reset behavior? [Gap, Spec §FR-016]
- [X] CHK008 Are requirements defined for inline cell save feedback — visual confirmation (brief green flash), error state (red highlight), validation message? [Gap, Spec §FR-004]
- [X] CHK009 Are requirements specified for inline cell edit cancellation — does Escape revert to the original value? [Gap, Spec §FR-004]
- [ ] CHK010 Are requirements defined for the relationship between the chip input and the "Enable Variants" toggle (first-time enable vs. existing variants)? [Gap]
- [ ] CHK011 Are requirements documented for the variant count display — total variant count, filtered count, selected count? [Gap]

## Requirement Clarity

- [ ] CHK012 Is "instantly populates" (FR-002) quantified with a maximum acceptable latency? [Clarity, Spec §FR-002 → Plan §Performance: <50ms]
- [X] CHK013 Is the click-to-edit inline editing flow fully specified — does click switch to input, Enter/blur confirm save, Escape cancel? [Clarity, Spec §FR-004]
- [ ] CHK014 Are chip input validation rules specified — duplicate detection, empty value rejection, allowed characters, maximum length? [Clarity, Spec §FR-001]
- [ ] CHK015 Is the bulk price adjustment (±% and ±amount) specified with exact calculation semantics — e.g., "+10%" on price 500 = 550, +10 = 510? [Clarity, Spec §FR-015]
- [ ] CHK016 Are filter bar behaviors clearly specified — exact match vs. partial match, AND vs. OR between multiple filters, case sensitivity? [Clarity, Spec §FR-016]
- [ ] CHK017 Is the "price inherits base product when null" behavior (FR-003) clearly indicated in the table UI — does the cell show the inherited value with a visual cue or remain blank? [Clarity, Spec §FR-003]
- [ ] CHK018 Is the "smart merge" attribute change behavior (add/remove option) clearly specified for how the table updates — does it prompt, auto-update instantly, or require a confirmation? [Clarity, Clarifications 2026-07-03]
- [ ] CHK019 Is the interaction between bulk toolbar selection and filter results specified — does selecting all filtered variants select only visible rows or all matching the filter? [Clarity, Gap]

## Requirement Consistency

- [X] CHK020 Does the chip input requirement (FR-001: type + Enter to add pill) align with the acceptance scenario (US1 SC1: click "Add option like Size" and type chips)? [Consistency, Spec §FR-001 & US1 SC1]
- [X] CHK021 Does FR-004 "auto-save on blur" conflict with the acceptance scenario "confirm with Enter/Tab"? (Confirm vs. auto-save — are these the same behavior?) [Consistency, Spec §FR-004 vs US1 SC2]
- [ ] CHK022 Does the filter bar requirement (FR-016: filter by attribute combination) align with the bulk toolbar (FR-015: actions on selected variants) — can a merchant filter and then bulk-select all filtered results? [Consistency, Spec §FR-015 & FR-016]
- [ ] CHK023 Are terms used consistently between clarifications and requirements — "chips" vs "pills" vs "tags" vs "removable pills"? [Consistency, Spec §FR-001 vs Clarifications]
- [ ] CHK024 Does SC-001's "2 minutes" timeline align with FR-015 (bulk toolbar) and FR-016 (filter bar) — are bulk tools implicitly needed to meet this timeline? [Consistency, Spec §SC-001 & FR-015/FR-016]
- [ ] CHK025 Is the variant table component structure (VariantsSection, VariantRowEditor, VariantBulkToolbar, VariantFilterBar) consistent with the acceptance scenarios — are all named components referenced in scenarios? [Consistency, Plan §Structure vs Spec §User Stories]

## Acceptance Criteria Quality

- [X] CHK026 Can US1 acceptance scenario 1 (inline chips → instant table population) be objectively measured without quantifying "instantly"? [Acceptance Criteria, Spec §FR-002 & §US1 SC1]
- [X] CHK027 Is US1 acceptance scenario 2 (click cell → edit → Enter/Tab) testable without specifying the save feedback mechanism? [Acceptance Criteria, Spec §US1 SC2 & §FR-004]
- [ ] CHK028 Is SC-001 (2 minutes, specific actions) a measurable acceptance criterion? (Yes — it defines specific actions and a time constraint) [Measurability, Spec §SC-001 ✅]
- [ ] CHK029 Is the "This item has been updated" notice in US5 AC2 defined with specific content, placement, and dismissal behavior? [Clarity, Spec §US5 AC2]
- [ ] CHK030 Are acceptance criteria for bulk operations (FR-015) defined in any user story acceptance scenario? [Gap — FR-015 has no matching acceptance scenario]

## Scenario Coverage

- [ ] CHK031 Are requirements specified for the variant table when variant count exceeds viewport capacity (e.g., scroll behavior, virtual scrolling, pagination)? [Gap]
- [ ] CHK032 Is the interaction between filter bar and bulk toolbar defined — does applying a filter clear the current selection? [Gap]
- [ ] CHK033 Are requirements defined for what happens when the merchant modifies chip input while inline cell edits are unsaved? [Gap]
- [ ] CHK034 Are requirements defined for the variant table's initial state when a product already has variants (has_variants=true, existing data)? [Gap]
- [ ] CHK035 Are requirements specified for reverting/undoing a bulk operation after it's applied? [Gap]
- [ ] CHK036 Are requirements defined for keyboard navigation within the variant table (Tab between cells, arrow keys, Enter to edit)? [Gap]

## Edge Case Coverage

- [ ] CHK037 Is duplicate option value handling in chip input specified — reject, show error, or silently ignore? [Edge Case, Gap]
- [ ] CHK038 Is the behavior specified when a chip is removed while inline edits for that option's variant rows are in progress? [Edge Case, Gap]
- [ ] CHK039 Are requirements defined for concurrent edit conflicts (same product variant edited in two browser tabs)? [Gap]
- [ ] CHK040 Is the behavior specified when the browser is refreshed while inline cell edits are unsaved? [Edge Case, Gap]
- [ ] CHK041 Is the behavior specified when all attribute options are removed (chip × for all) — does the variant table empty, disable variants, or revert to base product? [Edge Case, Gap]
- [ ] CHK042 Are error messages for validation failures (duplicate SKU, invalid price, stock < 0) specified with content and placement? [Edge Case, Gap]

## Non-Functional UI Requirements

- [ ] CHK043 Are accessibility requirements defined for the inline variant table — ARIA roles (grid, row, cell), keyboard navigation (Tab, Enter, Escape), screen reader announcements (row count, edit state)? [Gap]
- [ ] CHK044 Are responsive behavior requirements defined for the variant table on mobile viewports — does the table become a card list, is the inline editing adapted? [Gap]
- [ ] CHK045 Are requirements defined for the inline table on the dashboard product edit page within the existing page layout (does it replace or supplement existing tabs)? [Assumption, Spec §Assumptions]
- [ ] CHK046 Are performance requirements for chip → matrix population quantified? (Plan §Performance: <50ms, Spec §SC-001: 2 minutes total) [Non-Functional, Plan §Performance]
- [ ] CHK047 Are visual focus indicators specified for all interactive elements (chip × buttons, filter inputs, table cells, toolbar buttons)? [Gap]

## Dependencies & Assumptions

- [ ] CHK048 Is the assumption that the inline table is integrated into the existing product edit page ("section" rather than separate page) documented and validated? [Assumption, Spec §Assumptions]
- [ ] CHK049 Are requirements for the relationship between chip changes and server-side persistence specified — auto-save on chip change, or require explicit action? [Gap]
- [ ] CHK050 Are requirements defined for the interaction between inline cell edits and the existing product "Save" button (do inline edits auto-save independently, or are they collected?) [Gap]
