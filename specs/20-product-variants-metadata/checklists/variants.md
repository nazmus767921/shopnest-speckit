# Product Variants & Custom Metadata — Requirements Quality Checklist

**Purpose**: Formal release-gate validation of requirements quality for the product variants feature
**Created**: 2026-07-03
**Feature**: `specs/20-product-variants-metadata/spec.md`

## Requirement Completeness

- [ ] CHK001 Are requirements defined for all 5 user stories (attribute definition, metadata, cart integration, stock tracking, dashboard management)? [Completeness]
- [ ] CHK002 Are requirements specified for how attribute option changes (add/remove) propagate to existing variants? [Gap, Spec §FR-001–FR-004]
- [ ] CHK003 Are requirements defined for the variant matrix regeneration when attributes are edited after initial generation? [Gap, Spec §FR-002]
- [ ] CHK004 Are requirements specified for variant image upload, including file size limits, accepted formats, and deletion? [Completeness, Spec §FR-014]
- [ ] CHK005 Are plan-limit interactions documented — does variant creation respect product count limits per plan? [Gap, Spec §FR-003]
- [ ] CHK006 Are requirements defined for bulk variant operations (e.g., apply price increase to all variants)? [Gap, Spec US5]
- [ ] CHK007 Are requirements specified for the `has_variants` flag lifecycle — can a product with variants be converted back to non-variant? [Gap, Spec §FR-005]
- [ ] CHK008 Are requirements defined for variant sorting and display order on the storefront? [Gap, Spec §FR-008]
- [ ] CHK009 Are requirements specified for variant-level low-stock alerts and thresholds? [Gap, Spec §FR-010]
- [ ] CHK010 Are requirements defined for the auto-generated SKU naming convention and its overrideability? [Completeness, Spec §FR-003]

## Requirement Clarity

- [ ] CHK011 Is "attribute display type" (`swatch` vs `dropdown` vs `radio`) defined with selection criteria for when each is used? [Clarity, Spec §FR-001]
- [ ] CHK012 Is the variant price inheritance model specified unambiguously — does "defaults to base product price" mean dynamic inheritance or a one-time copy? [Clarity, Spec §FR-003]
- [ ] CHK013 Is "variant images" storage path convention precisely defined, including directory structure and naming? [Clarity, Spec §FR-014]
- [ ] CHK014 Is the behavior specified when max attribute count (3) or max option count (10) is exceeded? Is it a hard block or a warning? [Clarity, Spec §FR-013]
- [ ] CHK015 Is "metadata displayed in a structured metadata section" precisely defined — is it a table, key-value list, or accordion? [Clarity, Spec §FR-007]
- [ ] CHK016 Is "handled gracefully" for existing carts/orders when variants are removed (US5) quantified with specific behavior? [Ambiguity, Spec US5 AC2]
- [ ] CHK017 Is the variant selector UI behavior for disabled/unavailable options specified (greyed out, hidden, or strikethrough)? [Clarity, Spec §FR-008]
- [ ] CHK018 Is "per-variant pricing in bulk" (US5) quantified — what bulk operations are supported (select all, price range, percentage)? [Clarity, Spec US5]
- [ ] CHK019 Is the relationship between `variant_images` and `product_images` clarified — can a variant share the base product's images? [Clarity, Spec §FR-014]
- [ ] CHK020 Is the automatic SKU generation pattern explicitly defined with examples across 2-attribute and 3-attribute products? [Clarity, Spec §FR-003]

## Requirement Consistency

- [ ] CHK021 Do variant stock decrement requirements (FR-010) consistently apply the same atomicity invariant as base product stock? [Consistency, Spec §FR-010 vs §V-2]
- [ ] CHK022 Do cart integration requirements (FR-009) consistently reference variant_id across cart, checkout, and order_items without gaps? [Consistency, Spec §FR-009]
- [ ] CHK023 Does the "Buy Now" assumption consistently extend to variants — is the temporary cart override expected to carry variant selection? [Consistency, Spec Assumptions vs US3]
- [ ] CHK024 Do the success criteria (SC-001 through SC-004) consistently map to the user stories they validate? [Consistency, Spec §SC vs User Stories]
- [ ] CHK025 Are the attribute limit rules (FR-013) consistent across the spec, data model, and validation rules? [Consistency]
- [ ] CHK026 Is the image limit behavior consistent — does the plan-based cap (2/5 images) apply per variant or across all variants of a product? [Consistency, Spec §FR-014]
- [ ] CHK027 Are the "out of stock" display requirements consistent between US1 AC3 and US4 AC2? [Consistency]

## Acceptance Criteria Quality

- [ ] CHK028 Are the success criteria objectively measurable — can "in under 5 minutes" (SC-001) be verified? [Measurability, Spec §SC-001]
- [ ] CHK029 Can "without ambiguity about which variant they ordered" (SC-002) be objectively verified in acceptance testing? [Measurability, Spec §SC-002]
- [ ] CHK030 Does "no race conditions allow negative stock" (SC-003) have a specific concurrency test criteria? [Measurability, Spec §SC-003]
- [ ] CHK031 Is "continues to work without modification" (SC-004) defined — does it mean same UI, same API surface, or same queries? [Measurability, Spec §SC-004]
- [ ] CHK032 Are the acceptance scenarios in each user story complete enough to serve as testable exit criteria? [Acceptance Criteria]

## Scenario Coverage

- [ ] CHK033 Are requirements defined for the primary flow (merchant adds attributes → variants auto-generated → customer selects variant → checkout reflects variant)? [Coverage, Spec US1→US3]
- [ ] CHK034 Are alternate flow requirements defined for when the variant matrix generation encounters duplicate SKUs? [Coverage, Gap]
- [ ] CHK035 Are exception flow requirements defined for when a variant's attribute option is deleted while the variant is referenced in active orders? [Coverage, Spec US5 AC2]
- [ ] CHK036 Are exception flow requirements defined for when variant stock update fails during checkout (DB constraint violation)? [Coverage, Gap]
- [ ] CHK037 Are recovery flow requirements defined for variant matrix regeneration failures (e.g., partial save of 1000 variants)? [Coverage, Gap]
- [ ] CHK038 Are non-functional requirements specified for variant matrix generation performance (max computation time for 1000 variants)? [Coverage, Gap]

## Edge Case Coverage

- [ ] CHK039 Is the behavior specified when a product has exactly 1 attribute with 1 option (1×1 = single variant)? Does it still show as "has_variants"? [Edge Case, Spec §FR-002]
- [ ] CHK040 Is the behavior specified when the variant matrix reaches exactly 1000 variants (max allowed)? [Edge Case, Spec §FR-013]
- [ ] CHK041 Is the behavior specified for a product with 0 attributes but `has_variants = true` (inconsistent state)? [Edge Case, Spec §FR-005]
- [ ] CHK042 Is the behavior specified when a merchant saves attributes but the matrix generation produces 0 variants (no options defined)? [Edge Case]
- [ ] CHK043 Is the behavior specified when variant price override is set to 0 (free variant)? Is that allowed? [Edge Case, Spec §FR-004]
- [ ] CHK044 Is the behavior specified when variant stock is set to a negative value (should be rejected)? [Edge Case, Spec §FR-010]
- [ ] CHK045 Is the behavior specified for a variant with null price when the base product is deleted? [Edge Case]
- [ ] CHK046 Is the behavior specified when all variants of a product are deactivated (`is_active = false`)? Does the product show as "sold out"? [Edge Case]
- [ ] CHK047 Is the behavior specified for metadata keys with special characters or excessive length? [Edge Case, Spec §FR-006]
- [ ] CHK048 Is the behavior specified for concurrent attribute edits from two dashboard tabs? [Edge Case, Conflict resolution]

## Dependencies & Assumptions

- [ ] CHK049 Is the assumption "existing Supabase Storage bucket reused" validated — does the bucket's RLS policy support the variant path structure? [Assumption]
- [ ] CHK050 Is the assumption "Buy Now flow handles variants" explicit in the requirements, or is it a deferred implementation concern? [Assumption, Spec Assumptions]
- [ ] CHK051 Is the assumption that "existing non-variant products work unchanged" testable — are there specific regression scenarios? [Assumption, Spec §FR-011]
- [ ] CHK052 Is the dependency on Drizzle migrations for new variant tables documented as a prerequisite? [Dependency, Gap]
- [ ] CHK053 Is the dependency on plan-limit enforcement for variant images documented? [Dependency, Spec §FR-014]

## Ambiguities & Conflicts

- [ ] CHK054 Does "defaults to base product price" (FR-003) create ambiguity when base product price changes after variant creation? The research.md says variants with explicit price retain it, but "inherit" variants update dynamically — is this clear in the spec? [Ambiguity]
- [ ] CHK055 Does "handled gracefully" (US5 AC2) leave too much implementation discretion for how existing carts reference deleted variants? [Ambiguity]
- [ ] CHK056 Is there a potential conflict between FR-005 (when variants exist, base product not orderable) and the assumption that "Buy Now" cart override still works for variant products? [Conflict]
- [ ] CHK057 Is there a conflict between per-variant image limits (FR-014) and the total storage the merchant can use across all variants? [Conflict]
- [ ] CHK058 Does the term "auto-generated" in US1 imply immediate on-screen feedback during attribute editing, or is it a save-triggered operation? [Ambiguity]
- [ ] CHK059 Is there a conflict between max 3 attributes (FR-013) and products that legitimately need 4 attributes (e.g., Color × Size × Material × Pattern)? [Conflict, Flexibility]
