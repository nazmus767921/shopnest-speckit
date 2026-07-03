# Spec: 02 - Authentication Flow & Core Database

## Goal
Implement Supabase Postgres and Drizzle ORM configuration to define the core database schema (merchants, users). Integrate Better Auth with the email/password provider to handle authentication, and implement the `(auth)/login` and `(auth)/register` UI using the previously built components.

## Design
- **Aesthetic:** Clean, minimal authentication forms using the modern, premium SaaS aesthetic (shopify like). Clear visual hierarchy with proper spacing and accessible color contrast.
- **Form Layout:** Centered cards (`Card` component) on a subtle background, with clear form labels, inputs, and a primary submit button.
- **Validation Feedback:** Real-time inline error states on form fields (via Zod and TanStack Form) with descriptive error messages.
- **Authentication Pages:**
  1. **Register Page (`(auth)/register`):** Form capturing Name, Email, and Password. Includes a link to the Login page. (Note: capturing the store name and subdomain will happen in the subsequent onboarding step, as per Unit 3).
  2. **Login Page (`(auth)/login`):** Form capturing Email and Password. Includes a link to the Register page.
- **Component Usage:** Utilize `Card`, `Input`, `Button`, `FormLabel`, and `Stack` components from the `components/ui` library.

## Implementation
### 1. Database & ORM Setup
- [x] Install `drizzle-orm`, `drizzle-kit`, and `postgres` (or equivalent PostgreSQL driver for Supabase).
- [ ] Create `db/schema.ts` to define the foundational tables.
- [ ] Add `merchants` table definition: `id`, `name`, `subdomain`, `owner_id`, `plan`, `subscription_status`, `trial_expiry`.
- [ ] Integrate Better Auth schema requirements into `db/schema.ts` (using `better-auth/adapters/drizzle`).
- [ ] Configure `drizzle.config.ts` with connection string logic to map to Supabase via environment variables.

### 2. Better Auth Configuration
- [x] Install `better-auth`.
- [ ] Create `lib/auth/auth.ts` and initialize the Better Auth server instance.
- [ ] Configure the Better Auth Drizzle adapter (`better-auth/adapters/drizzle`), linking it to the Drizzle DB instance.
- [ ] Enable the `emailAndPassword` provider.
- [ ] Add the Next.js API route handler for Better Auth at `app/api/auth/[...all]/route.ts`.
- [ ] Create the client-side instance in `lib/auth/auth-client.ts` to expose `signIn`, `signUp`, and session methods.

### 3. Authentication UI
- [ ] Set up `app/(auth)/layout.tsx` for a consistent auth shell (e.g., logo, centered container).
- [ ] Implement `app/(auth)/register/page.tsx`:
  - Form state management for Name, Email, and Password.
  - Zod schema integration for robust client-side validation.
  - On submit, call `signUp.email()` from `auth-client.ts` and redirect to the onboarding flow on success.
- [ ] Implement `app/(auth)/login/page.tsx`:
  - Form state management for Email and Password.
  - Zod schema for client-side validation.
  - On submit, call `signIn.email()` and redirect to the dashboard (or onboarding if incomplete) on success.

## Dependencies
> all installed
- `drizzle-orm`
- `drizzle-kit`
- `postgres` (or `pg`)
- `better-auth`
- `zod`
- `@tanstack/react-form`

## Verification Checklist
- [x] `db/schema.ts` accurately represents the core tables without syntax errors.
- [x] Schema applies successfully to Supabase Postgres (e.g., via `drizzle-kit generate and drizzle-kit migrate`).
- [x] `GET /api/auth/ok` returns `{ status: "ok" }`.
- [x] User can successfully register at `/register` (persists to DB via Better Auth).
- [x] User can successfully log in at `/login` and receive a valid session cookie.
- [x] Client-side validation prevents submission of empty or invalid data.
