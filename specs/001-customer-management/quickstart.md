# Quickstart & Verification Guide: Storefront Customer Portal & Admin Management

This guide provides end-to-end verification scenarios to validate storefront customer portals, admin directories, suspension controls, and IP-level bans.

## Verification Scenario 1: Customer Signup and Profile Management

### Setup
1. Run the dev server (`bun dev`).
2. Visit a valid merchant storefront subdomain, e.g., `http://fashion.localhost:3000/`.

### Steps
1. Navigate to `/register` (e.g. `http://fashion.localhost:3000/register`).
2. Fill out the registration form:
   - **Name**: Jane Doe
   - **Email**: jane.doe@example.com
   - **Password**: SecureP@ss123
3. Click "Create Account".
4. **Verification**: Verify you are redirected to the customer dashboard (`/dashboard` or `/profile`). The page should load profile details and shipping address options.
5. Click "Add Address" and save an address in Dhaka.
6. **Verification**: Verify that the address saves correctly and shows in the list.

---

## Verification Scenario 2: Admin Moderation & Account Suspension

### Setup
1. Log in to the main admin/merchant dashboard at `http://localhost:3000/login` with your merchant credentials.
2. Go to the dashboard Customers page: `http://localhost:3000/dashboard/customers`.

### Steps
1. Locate **Jane Doe** in the customer list.
2. Click to open her Customer Details page (`/dashboard/customers/[id]`).
3. Under moderation actions, click **Suspend Account**. Enter a reason: "Suspicious checkout attempts".
4. **Verification**: Verify that the account status updates to **Suspended** in the dashboard.
5. Attempt to visit the storefront customer dashboard again at `http://fashion.localhost:3000/profile` (as Jane Doe).
6. **Verification**: Verify that the active session is revoked, the user is redirected to `/login`, and attempting to log back in shows the error message: "Your account has been suspended by the merchant."

---

## Verification Scenario 3: IP Address Ban Enforcement

### Setup
1. Go to Jane Doe's details page in the merchant dashboard: `http://localhost:3000/dashboard/customers/[id]`.
2. Locate her last login IP from the "Login History" table.
3. Click **Ban IP Address**.

### Steps
1. Perform any HTTP request or refresh the page on `http://fashion.localhost:3000/` from the banned IP address.
2. **Verification**: Verify that the page rendering is instantly blocked at the middleware layer, and the browser displays a custom **Access Denied (403)** screen indicating that the IP has been banned.
