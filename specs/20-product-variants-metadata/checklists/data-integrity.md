# Data Integrity & Lifecycle Requirements Checklist: Product Variants & Custom Metadata

**Purpose**: Validates requirements quality for cascade-delete behavior, cart/checkout integrity, auto-revert state transitions, smart merge alignment, and data lifecycle edge cases
**Created**: 2026-07-04
**Feature**: `specs/20-product-variants-metadata/spec.md`
**Focus**: Data integrity, cascade-delete completeness, state transitions, edge case coverage

## Cascade-Delete Requirements Completeness

- [ ] CHK001 Are ALL attribute deletion paths specified with cascade-delete behavior — both (a) deleting an entire attribute via the three-dot menu and (b) removing a single option via chip ×? [Completeness, Spec §FR-018 & FR-019, US5 AS5 & AS2]
- [ ] CHK002 Are warning dialogs specified for every cascade-delete path with exact dialog content, button labels (Cancel/Confirm), and the variant count summary? [Clarity, Spec §FR-018: "Delete '{attribute_name}' and its {N} associated variants?"; §FR-019: "Removing '{option_value}' will delete {N} variants with custom pricing"]
- [ ] CHK003 Is the ON DELETE CASCADE foreign key chain specified consistently across all affected junction tables — attribute_options → variant_attribute_links → product_variants — and is it documented in both spec and data-model.md? [Completeness, Spec §FR-018, data-model.md §variant_attribute_links]
- [ ] CHK004 Are requirements specified for cleanup of variant images in Supabase Storage when a variant is cascade-deleted — are orphaned storage files deleted, or only the DB row? [Gap]
- [ ] CHK005 Is the behavior specified for the `variant_generation` JSON snapshot on `products` when cascade-delete occurs — is it cleared, updated, or left stale? [Gap, data-model.md §variant_generation]
- [ ] CHK006 Are requirements specified for the product's `metadata_count` and `has_variants` fields when all variants are cascade-deleted? [Completeness, Spec §FR-021 covers has_variants but metadata_count is a denormalized field with no lifecycle specified]

## Cart & Checkout Integrity

- [ ] CHK007 Are requirements specified for ALL cart surfaces where a cascade-deleted variant may appear (mini-cart popover, full cart page, checkout review, "Buy Now" temporary cart)? FR-020 covers the cart item display, but is the "Buy Now" flow explicitly addressed? [Completeness, Spec §FR-020 vs Assumptions "Buy Now flow must handle variants"]
- [ ] CHK008 Is the checkout rejection behavior specified with exact error message content when an order references a deleted variant? FR-020 says "MUST reject" but does not specify the error message or UX treatment. [Clarity, Spec §FR-020]
- [ ] CHK009 Are requirements specified for how the customer is notified when a variant they had in cart is cascade-deleted — does the cart poll for deleted variants, check on page load, or check on checkout attempt? [Gap, Spec §FR-020]
- [ ] CHK010 Are consistency requirements specified between the cart unavailable notice in US5 AS2 (option removal cascade-delete) and US5 AS5 (attribute deletion cascade-delete) — should the same "No longer available" notice appear in both? [Consistency, Spec US5 AS2 & AS5]
- [ ] CHK011 Are requirements specified for what happens to a customer's variant selection (dropdown/swatch state) when the variant they had selected is cascade-deleted after page load? [Edge Case, Gap]

## Auto-Revert & State Transition Requirements

- [ ] CHK012 Is the auto-revert behavior completely specified — does setting `has_variants = false` restore the base product's price, SKU, and stock_count as the primary surface, or are there additional state changes needed? [Clarity, Spec §FR-021]
- [ ] CHK013 Are requirements specified for the re-entry path — can a merchant re-add attributes to a product that auto-reverted to non-variant mode, and what happens to any residual variant data (if cascade-delete didn't clean everything)? [Gap]
- [ ] CHK014 Are requirements specified for the transition when ALL attributes but exactly ONE variant remain (e.g., 1 attribute × 1 option = 1 variant) — does deleting the last attribute trigger auto-revert even for this single-variant product? [Edge Case, Spec §FR-021]
- [ ] CHK015 Are requirements specified for variant images when auto-revert occurs — are leftover variant images (if storage cleanup is not implemented) ever shown on the reverted base product? [Gap, Edge Case]
- [ ] CHK016 Is the state transition from variant mode → non-variant mode → back to variant mode consistent between spec, data-model.md lifecycle diagram, and plan.md constraints? [Consistency]

## Smart Merge & Cascade-Delete Alignment

- [ ] CHK017 Does the `smartMergeVariants` contract consistently return `toDelete` (not `toDeactivate`) across all contracts, data-model algorithm, and tasks references? [Consistency, contracts/variant-matrix.md, data-model.md, tasks.md T074]
- [ ] CHK018 Is the boundary between smart merge (identifies which variants to delete) and cascade-delete (DB-level enforcement) clearly specified — does the smart merge function return the variant IDs to delete, while the delete operation relies on ON DELETE CASCADE for atomic cleanup? [Clarity, contracts/variant-matrix.md]
- [ ] CHK019 Are surviving variant overrides (price, SKU, stock) preserved across ALL smart merge paths — both option addition AND option removal? FR-002 implies preservation for additions; is it explicitly stated for survivors after cascade-delete? [Completeness, Spec §FR-002, Clarifications 2026-07-03]
- [ ] CHK020 Are requirements specified for the order of operations when both option additions AND removals happen in a single save — is the smart merge applied correctly when a merchant simultaneously adds "Green" and removes "Blue"? [Edge Case, Spec §FR-002]

## Edge Cases & Boundary Conditions

- [ ] CHK021 Is the behavior specified for cascade-delete when the variant has a FK reference in `order_items` (historical orders) — does the `variant_id` column have ON DELETE SET NULL or a different constraint, since historical orders must be preserved? [Gap, data-model.md shows `variant_id` as nullable FK → product_variants.id without CASCADE]
- [ ] CHK022 Are requirements specified for concurrent operations — e.g., merchant deletes an attribute while a customer is checking out with one of its variants? Does the checkout's stock decrement race against the cascade? [Edge Case, Gap]
- [ ] CHK023 Is the behavior specified when cascade-delete would violate a merchant's plan limits (e.g., plan limits are checked at variant table edit time but the cascade-delete happens later)? [Edge Case, Gap]
- [ ] CHK024 Are requirements specified for what happens when a product has `has_variants = false` but still has residual variant rows in the DB (inconsistent state) — is there a cleanup invariant or guard? [Edge Case, Gap, data-model.md §products.has_variants]

## Non-Functional & Observability Requirements

- [ ] CHK025 Are requirements specified for observability of cascade-delete operations — should deletion events be logged for audit purposes (merchant deleted attribute X → N variants cascade-deleted)? [Gap]
- [ ] CHK026 Are performance requirements quantified for cascade-delete at scale — cleaning up 1000 variants across 3 junction tables must complete within a reasonable transaction timeout? [Gap, Spec §SC-001/SC-003 apply to happy path only]
- [ ] CHK027 Is the atomicity of the cascade-delete operation guaranteed — does the ON DELETE CASCADE chain run in a single Postgres transaction, or could partial failure leave the data model in an inconsistent state? [Clarity, Spec §FR-018 mentions "atomic cleanup"]

## Cross-Document Consistency

- [ ] CHK028 Does the plan.md Technical Context constraint section (now "Cascade-delete constraint") align with the spec's FR-018 through FR-021 without contradiction? [Consistency, plan.md]
- [ ] CHK029 Does the research.md Decision #9 (cascade-delete) correctly match the cascade-delete behavior in spec FR-018–021, including the rationale that supersedes the old "deactivate" approach? [Consistency, research.md]
- [ ] CHK030 Does the tasks.md accurately reflect cascade-delete in T056, T060, T074, and T076, with no remaining references to "deactivate" for attribute/option removal paths? [Consistency, tasks.md]
- [ ] CHK031 Do the contracts (server-actions.md and variant-matrix.md) consistently reference cascade-delete and `toDelete` without residual "deactivate" language? [Consistency, contracts/]
- [ ] CHK032 Does the quickstart.md Scenario 5 (Cascade-Delete) match the expected behavior described in the spec's US5 AS2? [Consistency, quickstart.md vs Spec §US5 AS2]

## Dependencies & Assumptions

- [ ] CHK033 Is the assumption that `order_items.variant_id` uses a nullable FK without ON DELETE CASCADE (so historical orders survive cascade-delete) explicitly documented as a design decision? [Assumption, Gap — not stated in spec assumptions or data-model.md]
- [ ] CHK034 Is the dependency on Postgres ON DELETE CASCADE behavior for atomic multi-table cleanup documented as a prerequisite for the feature? [Dependency, Gap]
- [ ] CHK035 Is the assumption that cascade-delete and cart-blocking behave identically for both logged-in customers and guest (anonymous) customers documented? [Assumption, Gap]
