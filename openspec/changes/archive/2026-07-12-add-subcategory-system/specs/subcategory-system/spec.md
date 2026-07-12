## ADDED Requirements

### Requirement: 1-Level Category Hierarchy
The system SHALL allow merchants to organize categories into a 1-level deep hierarchy (Parent -> Child). A category can optionally have one parent. The system MUST NOT allow a subcategory to act as a parent to another category (enforced max depth of 1).

#### Scenario: Creating a top-level category
- **WHEN** a merchant creates a category without selecting a parent
- **THEN** the category is saved as a top-level category

#### Scenario: Creating a subcategory
- **WHEN** a merchant creates a category and selects an existing top-level category as its parent
- **THEN** the category is saved as a child of the selected parent

#### Scenario: Preventing deep nesting
- **WHEN** a merchant attempts to assign a parent category that is already a subcategory itself
- **THEN** the system rejects the action to enforce the 1-level depth limit

### Requirement: Flexible Product Placement
The system SHALL allow a product to belong to any category, regardless of whether it is a top-level category or a subcategory. 

#### Scenario: Product in a top-level category
- **WHEN** a merchant assigns a product to a top-level category (e.g., "Clothing")
- **THEN** the product is displayed when a user views the "Clothing" category

#### Scenario: Product in a subcategory
- **WHEN** a merchant assigns a product to a subcategory (e.g., "Shirts")
- **THEN** the product is displayed when a user views the "Shirts" category

#### Scenario: Viewing a parent category displays subcategory products
- **WHEN** a user views a top-level category (e.g., "Clothing") that has subcategories (e.g., "Shirts")
- **THEN** the storefront displays all products assigned directly to "Clothing" AND all products assigned to its subcategories (e.g., "Shirts")
