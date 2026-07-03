# Spec: 11. Super Admin Panel & 2FA

## Goal
Build a heavily restricted super admin panel protected by Better Auth's `admin` and `twoFactor` (TOTP) plugins, enabling administrators to manage merchants, suspend stores, override free trials, and manually record bKash/Nagad subscription payments.

## Design
- **Layout (`(admin)/layout.tsx`)**: A dedicated, restricted shell that only permits users with the `admin` role and completed 2FA. Non-admins will receive a 403 Forbidden or be redirected to login.
- **Navigation**: A simple sidebar with "Merchants", "Subscriptions", and "Settings" links.
- **Merchants View**: A data table displaying all merchants (store name, subdomain, owner, plan, status, trial expiry). Includes row-level actions to Suspend/Activate the store and override the trial expiry date.
- **Subscriptions View**: A view to review pending subscription renewals, manually record bKash/Nagad payments (transaction IDs), and view payment history.

## Implementation

### 1. Better Auth Plugins Configuration
- Update `lib/auth/auth.ts` to include the `admin()` and `twoFactor()` plugins.
- Configure the TOTP provider within the `twoFactor` plugin settings.
- Implement a utility script or one-off route to create the initial super admin user, assign the `admin` role, and generate their TOTP setup URI.

### 2. Route Protection & Middleware (`proxy.ts`)
- Update `proxy.ts` to enforce strict checks for any route under the `(admin)` group.
- Fetch the session via `auth.api.getSession`.
- Verify that `session.user.role === 'admin'`.
- Verify that the 2FA is verified for the session (if required by Better Auth's session object).
- Return a 403 response if the user lacks the `admin` role, or redirect to a 2FA verification page if TOTP is pending.

### 3. Database Queries (`db/queries/admin.ts`)
- `getMerchants()`: Fetch all merchants joined with their subscription status and owner details.
- `updateMerchantStatus(merchantId, status)`: Activate or suspend a merchant store.
- `overrideTrialExpiry(merchantId, newExpiryDate)`: Update the `trial_expiry` column for a specific merchant.
- `recordSubscriptionPayment(payload)`: Insert a new record into `subscription_payments` (amount, payment method, transaction ID, recorded_by, paid_at) and update the `subscriptions` table to extend the current period end date.

### 4. Admin UI Views
- **`(admin)/login/page.tsx`** or **`(auth)/login`**: Ensure the login flow prompts for a TOTP code after email/password validation if the user has 2FA enabled.
- **`(admin)/layout.tsx`**: Renders the admin sidebar and header. Wraps children.
- **`(admin)/merchants/page.tsx`**: Implements the merchant data table and action modals (Suspend, Override Trial).
- **`(admin)/subscriptions/page.tsx`**: Form to record manual bKash/Nagad payments and a table displaying the payment history.

## Dependencies
- `qrcode.react` installed (for rendering the TOTP setup QR code during initial admin setup).
- Requires Unit 10 (Subscriptions) to be completed for the subscription tables.
- Requires Unit 2 (Better Auth) for the base auth setup.

## Verification Checklist
- [ ] Better Auth `admin` and `twoFactor` plugins are correctly configured.
- [ ] Accessing `(admin)` routes without an active admin session redirects to login or returns 403.
- [ ] Accessing `(admin)` routes with an admin session but pending 2FA prompts for the TOTP code.
- [ ] Super admin can successfully view a list of all merchants.
- [ ] Super admin can suspend a merchant store (the storefront should return a 402 status if visited).
- [ ] Super admin can override a merchant's free trial expiry date.
- [ ] Super admin can manually record a subscription payment via bKash/Nagad transaction ID.
- [ ] Recording a payment correctly updates the merchant's subscription period in the database.
