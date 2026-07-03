# Spec: 03 - Merchant Onboarding & Subdomain Proxy

## Goal
Implement the `(auth)/onboarding` flow where newly registered merchants define their store name and unique subdomain, and implement `proxy.ts` (Next.js middleware equivalent) to intercept requests, resolve subdomains, check authentication sessions, and route traffic to the appropriate application context (`(storefront)` vs `(dashboard)`).

## Design
- **Aesthetic:** Clean, step-by-step onboarding experience. Minimal friction, building on the authentication card design. 
- **Form Layout:** 
  - Centered `Card` with a clear progress indicator or welcoming header.
  - **Store Name Input:** Standard text input.
  - **Subdomain Input:** A specialized input group where the prefix is editable but the `.shopnest.com.bd` suffix is fixed and visible as an addon to provide immediate visual feedback. 
  - Subdomain validation should ensure it's alphanumeric and uses hyphens, displaying real-time availability/error states.
- **Routing & Proxy Structure:**
  - `proxy.ts` acts as the traffic controller. It operates silently, analyzing the `Host` header.
  - If a subdomain is detected, it acts as a reverse proxy, rewriting the URL to serve `(storefront)` views.
  - If the main domain is detected and the user accesses `(dashboard)` or `(admin)`, it acts as an auth guard, checking Better Auth session state and roles.

## Implementation

### 1. Merchant Onboarding UI & Logic
- [x] Create `app/(auth)/onboarding/page.tsx`.
- [x] Build a form using TanStack Form and Zod for validation.
  - Zod schema for subdomain: lowercase letters, numbers, and hyphens only, no spaces, min 3 characters, max 63 characters.
- [x] Implement a server action `createMerchantAction`:
  - Validate the Better Auth session to ensure the user is logged in.
  - Check if the chosen subdomain already exists in the `merchants` table (must be globally unique).
  - Insert a new record into the `merchants` table with the user as `owner_id`.
  - Set `subscription_status` to `'trial'` and `trial_expiry` to 7 days from now.
  - Enforce **Invariant 5**: Ensure the database logic and future update queries prevent modification of the `subdomain` column after this initial insertion.
- [x] On successful submission, redirect the user to the `(dashboard)`.

### 2. The Proxy / Subdomain Router (`proxy.ts`)
- [x] Implement `proxy.ts` (Next.js Middleware at the project root).
- [x] **Subdomain Extraction:** Parse the `Host` header to determine if the request is on the main domain (or `localhost`) versus a merchant subdomain (e.g., `nihas-boutique.shopnest.com.bd`).
- [x] **Storefront Routing (Subdomain detected):**
  - Query the `merchants` table using the extracted subdomain. *(Note: If running in Next.js Edge runtime, ensure the database query uses an Edge-compatible fetch/HTTP client or rewrites to a server component layout that performs the DB check).*
  - If the merchant is not found, rewrite to a `404` or "store-not-found" page.
  - If `subscription_status` is `'suspended'`, rewrite to a `402` or "store-suspended" page.
  - If valid and active, pass the merchant context (e.g., via headers) and rewrite the request to the `(storefront)` route group.
- [x] **Dashboard/Admin Auth Guard (Main domain detected):**
  - For requests to `/dashboard/*` or `/admin/*`, call `auth.api.getSession({ headers: request.headers })`.
  - Verify the session exists. If not, redirect to `/login`.
  - Check the user role (`merchant` for dashboard, `admin` for admin). If unauthorized, return a `403 Forbidden` response.

## Dependencies
- No new external packages required.
- Utilizes existing `better-auth`, `@tanstack/react-form`, `zod`, and `drizzle-orm` packages from prior units.

## Verification Checklist
- [x] Merchant onboarding form properly validates subdomain formatting and uniqueness in real-time or upon submission.
- [x] Completing the onboarding form creates a valid `merchants` record in the database with the correct `owner_id` and trial status.
- [x] `proxy.ts` successfully extracts the subdomain from the `Host` header.
- [x] Accessing a valid merchant subdomain correctly rewrites the URL to serve the `(storefront)` application.
- [x] Accessing an invalid subdomain displays a 404/not-found experience.
- [x] Accessing a suspended merchant subdomain displays a 402/suspended experience.
- [x] Accessing `(dashboard)` without a valid session redirects to `/login`.
- [x] Attempting to change a subdomain after creation fails (enforcing Invariant 5).
