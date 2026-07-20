# Feature Specification: Customer CRM Upgrade

## 1. Description
The merchant dashboard's customer details view will be upgraded from a basic page to a production-grade CRM experience. This includes a major UX overhaul using a tabbed Shadcn layout and new CRM functionalities like private notes, password resets, and GDPR-compliant account deletion.

## 2. Business Value
- Improved Merchant UX: Tabbed organization reduces cognitive load.
- Better Customer Support: Private notes allow merchants to keep track of interactions.
- Compliance & Security: Data export, deletion, and password reset functions give admins essential tools.

## 3. Scope & Requirements

### In Scope
- Left sidebar with high-level stats (AOV, Total Spend, Orders, Account Status).
- Main content area with 4 tabs: Orders, Addresses, Private Notes, Security/Actions.
- Database table for Private Notes (`customer_notes`).
- Password reset functionality (triggering an email).
- Hard delete account functionality.
- GDPR Data Export (CSV format).

### Out of Scope
- Public facing customer changes (this is admin dashboard only).
- Sending custom emails (only standard password reset).

## 4. User Scenarios
- **Scenario 1**: Merchant clicks a customer -> sees the new tabbed layout with sidebar stats.
- **Scenario 2**: Merchant goes to Notes tab -> adds a note -> sees it immediately in the chronological feed.
- **Scenario 3**: Merchant goes to Security tab -> clicks "Delete Account" -> confirms hard deletion -> user is removed and merchant redirected to directory.
- **Scenario 4**: Merchant clicks "Export Data" -> CSV downloads containing orders and profile info.

## 5. Success Criteria
- The new CRM layout fully renders without layout shifts.
- AOV and metrics are calculated accurately.
- Private notes persist in the DB and are listed in correct chronological order.
- Hard deletion successfully cascades or nulls out data and removes the user record.
