# Research & Architecture Decisions: Storefront Customer Portal & Admin Management

This document outlines the architectural research, options evaluated, and final design decisions for implementing storefront customer authentication and merchant customer management.

## 1. Multi-Tenant Customer Account Isolation

### Decision
Store customer accounts in the global `user` table, but isolate them using an email suffix pattern (`email:merchant_id`) and a nullable `merchant_id` column.

### Rationale
- **Better Auth Compatibility**: Better Auth looks up users by the `email` field. Since email must be unique in Better Auth, appending the tenant ID (e.g., `customer@example.com:shopA`) guarantees global uniqueness across tenants while allowing customers to register the same email across multiple shops.
- **Minimal Schema Churn**: Rather than replacing the unique constraint on the `user.email` column (which is referenced globally by various modules and libraries), we keep the default structure and add conditional indexes in Drizzle:
  - One unique index on `email` where `merchant_id IS NULL` (ensuring uniqueness for global/merchant admin users).
  - One unique index on `(email, merchant_id)` where `merchant_id IS NOT NULL` (ensuring uniqueness for storefront customers scoped to a merchant).
- **Authentication simplicity**: Login and registration forms on `shopA.localhost:3000` automatically append the current merchant's ID suffix (`:shopA`) to the user-entered email during authentication requests, keeping the process transparent to the end-user.

### Alternatives Considered
- *Shared Global Accounts*: Customers use a single global login. If they sign up on Shop A, they can log into Shop B. However, this violates the user requirement for "fully isolated customer accounts" and creates privacy issues where merchants can see details of customers registered on other storefronts.
- *Custom Better Auth Adapter*: Override the drizzle adapter's lookup queries. This was rejected due to risk of breaking auth library internal state machines, session validation, and plugin integration.

---

## 2. IP Ban Enforcement

### Decision
Enforce manual IP bans at the Next.js middleware proxy level (`proxy.ts`).

### Rationale
- **Performance**: Blocking malicious traffic immediately at the proxy layer prevents loading layout trees, performing DB checks inside React Server Components (RSCs), or running unnecessary API requests.
- **Robustness**: Request IP parsing using standard header forwarding (`x-forwarded-for`) is already available in the middleware. Checking a cache/DB-backed blocklist takes <10ms and immediately halts execution with a 403 status and custom page.

### Alternatives Considered
- *Application-level checks*: Perform IP verification in page layouts. This was rejected because layout rendering is too late in the request cycle, allowing database queries to execute and wasting server resources.

---

## 3. Storefront-Scoped Authentication Pages

### Decision
Implement sign-in, sign-up, and account management directly under the dynamic storefront subdomain route structure (`app/(storefront)/[subdomain]/**`).

### Rationale
- **White-Labeling**: Keeps the storefront experience cohesive and branded per merchant (e.g., `test-store.localhost:3000/login`).
- **Context Injection**: Allows easy resolution of the active merchant from the request path or proxy-injected headers, enabling custom CSS theme settings to apply to the auth pages.

### Alternatives Considered
- *Centralized Main-Domain Login*: Redirecting storefront customers to the main admin login page (`localhost:3000/login`) and back. Rejected due to poor customer user experience and lack of branding isolation.

---

## 4. SMS OTP Verification for Phone Binding

### Decision
We will use the `phoneNumber` plugin in Better Auth to handle phone number verification and OTP sending during registration. We will mock the SMS gateway for now (logging OTPs to the console).

### Rationale
The `phoneNumber` plugin integrates seamlessly with our existing Better Auth setup and provides built-in OTP generation, verification, and rate-limiting.

### Alternatives Considered
- *Custom OTP generation using Upstash Redis*: Rejected because leveraging the built-in Better Auth plugin reduces security risks and boilerplate.
