# template-auto-assignment

## Purpose
This capability defines the automatic template assignment during merchant onboarding based on business type selection, and the resolution fallback logic.

## ADDED Requirements

### Requirement: Business Type Selection During Onboarding
The onboarding flow MUST include a "What does your store sell?" step that presents the merchant with a list of business type options (e.g., Clothing & Apparel, Shoes & Footwear, Accessories & Jewelry, Electronics, Beauty & Perfume, Food & Grocery, Other / General). The selected business type MUST be stored on the merchant record.

#### Scenario: Merchant selects business type during onboarding
- **WHEN** a new merchant reaches the business type selection step and chooses "Clothing & Apparel"
- **THEN** the merchant's business type is recorded as "clothing" and the flow proceeds to the next step.

### Requirement: Automatic Template Assignment from Business Type
After the merchant selects their business type, the system MUST automatically assign the best-fit template by querying the `store_templates` table for active templates whose `business_types` JSONB array contains the selected type, filtered by the merchant's subscription tier. The assigned template slug MUST be saved to `merchants.template`.

#### Scenario: Clothing merchant gets fashion template
- **WHEN** a merchant selects "Clothing & Apparel" during onboarding and the "fashion" template is active with "clothing" in its `business_types` and the merchant's tier in its `allowed_tiers`
- **THEN** the merchant's `template` is set to "fashion".

#### Scenario: Electronics merchant gets general template (no electronics template exists)
- **WHEN** a merchant selects "Electronics" during onboarding and no active template has "electronics" in its `business_types`
- **THEN** the system falls back to the default template (the one with `is_default = true`), and the merchant's `template` is set to "general".

#### Scenario: Fashion template locked for starter tier
- **WHEN** a starter-plan merchant selects "Clothing & Apparel" but the "fashion" template's `allowed_tiers` does not include "starter"
- **THEN** the system falls back to the default template and assigns "general".

### Requirement: Template Resolution Fallback Chain
The template resolution MUST follow this fallback chain: (1) match business type → active template with matching tier, (2) if no match, use the template with `is_default = true`. If even the default template is somehow unavailable, the system MUST hard-fallback to the `"general"` slug.

#### Scenario: Fallback chain to default template
- **WHEN** no template matches the merchant's business type and tier combination
- **THEN** the system assigns the `is_default` template, guaranteeing every merchant always has a valid template.
