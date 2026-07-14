# Feature Specification: Storefront Customer Portal & Admin Management

**Feature Branch**: `001-customer-management`

**Created**: 2026-07-14

**Status**: Draft

**Input**: User description: "i want a customer management system and feature for the merchants dashboard. currently there is no sign in and signup feature for the storefront customer. so we need that feature too. then a merchant admin panel customers page and customer details page so that the merchant can manage their storefront customers, like view details, take actions, ban them manually (account and IP) etc whats the industry standard things. and need sign up and sign in feature for thte storefront customers so that they can create account and login to view their orders, info, addresses etc."

## Clarifications

### Session 2026-07-14
- Q: Should guest checkouts using only a phone number still function? → A: Yes, guest checkout using only a phone number must remain fully functional without requiring registration.
- Q: How are guest orders handled if the customer registers an account later? → A: If a customer signs up with an email/phone matching their past guest checkout orders, those orders must be automatically bound/associated with their new user account, allowing them to view their history.
- Q: How should we verify the phone number during registration to securely bind past guest orders? → A: Send an OTP via SMS to verify the phone number during registration before binding the orders.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Storefront Customer Registration & Authentication (Priority: P1)

As a storefront visitor, I want to create an account and log in so that I can access my profile, save shipping details, and view my order history.

**Why this priority**: Critical MVP gate. Customers must be authenticated before they can access personalized spaces, secure order histories, or manage personal profiles.

**Independent Test**: A visitor can sign up with their email and password, log out, log back in, and access their authenticated dashboard area.

**Acceptance Scenarios**:

1. **Given** a new visitor on the storefront sign-up page, **When** they provide a valid name, email, and password and click submit, **Then** they are logged in automatically and redirected to their customer dashboard.
2. **Given** an existing customer on the sign-in page, **When** they enter correct credentials, **Then** they are logged in and redirected to their dashboard.
3. **Given** an unauthenticated visitor, **When** they attempt to navigate to a protected customer URL, **Then** they are redirected to the sign-in page.

---

### User Story 2 - Customer Portal Dashboard (Profile, Addresses, & Orders) (Priority: P1)

As a logged-in storefront customer, I want to manage my profile details, configure my shipping addresses, and review my historical orders.

**Why this priority**: Essential customer self-service capability that reduces support tickets and improves buyer confidence.

**Independent Test**: A logged-in customer can update their first/last name, add or remove addresses, and view a list of their past purchases.

**Acceptance Scenarios**:

1. **Given** a logged-in customer on their dashboard, **When** they edit their profile details (e.g., name) and save, **Then** the updated details are persisted.
2. **Given** a logged-in customer on their address page, **When** they add a new shipping address, **Then** it is saved as their default address.
3. **Given** a customer with previous orders, **When** they view their orders tab, **Then** they see a list of all past orders with status, date, and order total.

---

### User Story 3 - Merchant Admin Customer Directory (Priority: P2)

As a merchant administrator, I want to view a search and filter table of all registered storefront customers so that I can monitor user activity and manage customer relationships.

**Why this priority**: High priority administrative function. Merchants need oversight of their customer database to manage issues.

**Independent Test**: The merchant admin can access the customers directory page, search for a customer by email, and see matching results.

**Acceptance Scenarios**:

1. **Given** a merchant admin logged into the management dashboard, **When** they navigate to the "Customers" page, **Then** they see a table listing all registered customers with name, email, join date, order count, and status.
2. **Given** a merchant admin on the "Customers" page, **When** they type a customer name or email into the search bar, **Then** the customer list filters in real-time to match the search query.

---

### User Story 4 - Merchant Admin Customer Details & Moderation (Priority: P2)

As a merchant administrator, I want to view a specific customer's detailed history and have the ability to suspend the customer manually (account-level or IP-level ban) to mitigate fraud or abuse.

**Why this priority**: High priority security and operational requirement for managing malicious behavior and chargebacks.

**Independent Test**: An admin can view a customer's detail view, click to ban their account/IP, and verify that the customer can no longer access storefront features.

**Acceptance Scenarios**:

1. **Given** a merchant admin viewing a specific customer's details, **When** they click "Suspend Account" and confirm, **Then** the customer is instantly logged out of any active storefront sessions and blocked from logging in.
2. **Given** a merchant admin viewing customer details, **When** they click "Ban IP Address", **Then** the customer's last known IP address is blacklisted, preventing any requests from that IP to the storefront.

---

### User Story 5 - Link Past Guest Orders upon Registration (Priority: P2)

As a storefront customer who previously checked out as a guest using my phone number or email, I want my historical guest orders to automatically link to my new account when I register, so that I can see all my past orders in my profile dashboard.

**Why this priority**: Enhances customer retention and experience, letting guest users easily transition to a full account without losing order history visibility.

**Independent Test**: Register a customer account with a phone number or email that has existing guest orders, and verify that the past orders are listed under the new customer's order history dashboard.

**Acceptance Scenarios**:

1. **Given** a customer who has completed previous guest orders using the phone number `01712345678`, **When** they register a new account and provide the same phone number, **Then** all past guest orders matching that phone number are automatically associated with their new customer account ID.

---

### Edge Cases

- **Access from Banned IP**: A visitor accessing the site from a banned IP must be shown a clean "Access Denied" page instead of a generic server crash.
- **Account Deletion Request**: When a customer deletes their account, their personal identifiable information (PII) is removed/anonymized, but past orders remain preserved for tax/reporting purposes.
- **Concurrent Session Revocation**: When an admin suspends a customer account, active login sessions on any device are immediately invalidated.
- **Retroactive Guest Order Merging**: If a user signs up using a phone number or email that matches past guest orders under different names or addresses, the system links the orders under the new user account without altering the original order delivery address snapshot details.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Customers MUST be able to sign up using email and password with password strength validation.
- **FR-002**: Customers MUST be able to initiate a secure password reset process via email.
- **FR-003**: Customers MUST have a profile section to manage names and default billing/shipping address books.
- **FR-004**: Customers MUST be able to view their complete order history, including item breakdowns, payment totals, and fulfillment status.
- **FR-005**: Merchant admins MUST be able to view a paginated list of all customers.
- **FR-006**: Merchant admins MUST be able to view individual customer profiles containing lifetime spend, order details, and device/location sign-in history (IP address log).
- **FR-007**: Merchant admins MUST have the capability to manually change a customer's status (Active, Suspended).
- **FR-008**: Merchant admins MUST have the capability to add a customer's IP address to a blocklist.
- **FR-009**: The storefront MUST reject logins and block requests from suspended accounts or blacklisted IPs.
- **FR-010**: Storefront guest checkouts using only a phone number MUST remain fully functional without requiring account registration.
- **FR-011**: When a storefront customer registers a new account, the system MUST check for any existing orders matching the customer's email or guest phone number and automatically bind those orders to the new customer's user ID. For phone numbers, this MUST be gated by OTP SMS verification to prevent unauthorized order history access.

### Key Entities

- **Storefront Customer**: Represents a registered user on the storefront. Attributes include name, email, status (active/suspended), and registration date.
- **Address**: A customer's saved physical location for shipping/billing.
- **IP Blacklist Record**: An entry tracking banned IP addresses, reason for the ban, and date of the ban.
- **Login Activity Log**: Logs details of customer authentication events including timestamps and IP addresses for audit purposes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of suspended customer accounts are logged out and blocked within 10 seconds of the admin action.
- **SC-002**: Storefront customers can complete sign-up or sign-in in less than 3 steps.
- **SC-003**: Merchant admin searches across 10,000+ customer records return matching results in under 500 milliseconds.
- **SC-004**: 100% of requests originating from a blacklisted IP address are blocked with a user-friendly access restriction page.

## Assumptions

- **Stable Auth Framework**: The existing merchant dashboard security configuration will serve as the base for building customer authentication boundaries.
- **Standard IP Tracking**: We assume standard HTTP request header forwarding (e.g., `X-Forwarded-For`) is available to reliably identify customer IP addresses.
- **No Self-Service Ban Appeals**: Suspended customers must contact store support directly; there is no automated self-service appeal portal.
