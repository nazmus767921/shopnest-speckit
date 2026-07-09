# global-theme-settings Specification

## Purpose
TBD - created by archiving change dynamic-templates-v2. Update Purpose after archive.
## Requirements
### Requirement: Global Theme Configuration
The system SHALL allow merchants to configure global theme settings, including primary color, secondary color, background color, text color, heading font, body font, and border radius.

#### Scenario: Merchant updates theme colors
- **WHEN** merchant saves new theme colors in the dashboard
- **THEN** the store's storefront immediately updates to use the new colors via CSS variables injected at the layout level

### Requirement: Theme Settings Injection
The storefront layout SHALL inject the merchant's saved `theme_settings` as CSS variables onto the root HTML element.

#### Scenario: Storefront renders with custom theme
- **WHEN** a customer visits a store with configured theme settings
- **THEN** the Next.js layout renders `<html style={{ '--color-primary': '...' }}>` based on the saved settings

