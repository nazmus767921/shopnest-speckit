# Server Actions Contracts: Storefront Customer Portal & Admin Management

This document defines the public TypeScript signatures and payload schemas for the new Server Actions.

## 1. Storefront Customer Authentication Actions

### `signUpCustomer`
Registers a new customer account for the current storefront.

*   **Signature**:
    ```typescript
    export async function signUpCustomer(payload: SignUpInput): Promise<AuthResult>
    ```
*   **Input Schema (Zod)**:
    ```typescript
    const signUpSchema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
    })
    ```
*   **Response**:
    ```typescript
    type AuthResult = { success: true } | { error: string }
    ```

### `signInCustomer`
Authenticates an existing customer on the current storefront.

*   **Signature**:
    ```typescript
    export async function signInCustomer(payload: SignInInput): Promise<AuthResult>
    ```
*   **Input Schema (Zod)**:
    ```typescript
    const signInSchema = z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(1, "Password is required"),
    })
    ```
*   **Response**:
    ```typescript
    type AuthResult = { success: true } | { error: string }
    ```

---

## 2. Customer Address Book Actions

### `saveCustomerAddress`
Adds or updates a shipping address for the logged-in customer.

*   **Signature**:
    ```typescript
    export async function saveCustomerAddress(payload: AddressInput): Promise<ActionResult>
    ```
*   **Input Schema (Zod)**:
    ```typescript
    const addressInputSchema = z.object({
      id: z.string().optional(), // Provided when editing
      name: z.string().min(2, "Contact name is required"),
      phone: z.string().min(10, "Phone number is required"),
      address: z.string().min(5, "Address must be at least 5 characters"),
      city: z.string().min(1, "City is required"),
      isDefault: z.boolean().default(false),
    })
    ```
*   **Response**:
    ```typescript
    type ActionResult = { success: true; addressId: string } | { error: string }
    ```

---

## 3. Merchant Admin Customer Moderation Actions

### `updateCustomerStatus`
Suspends or reactivates a storefront customer.

*   **Signature**:
    ```typescript
    export async function updateCustomerStatus(payload: UpdateStatusInput): Promise<ActionResult>
    ```
*   **Input Schema (Zod)**:
    ```typescript
    const updateStatusSchema = z.object({
      customerId: z.string(),
      banned: z.boolean(),
      banReason: z.string().optional(),
    })
    ```

### `banIpAddress`
Blacklists a specific IP address for the merchant's store.

*   **Signature**:
    ```typescript
    export async function banIpAddress(payload: BanIpInput): Promise<ActionResult>
    ```
*   **Input Schema (Zod)**:
    ```typescript
    const banIpSchema = z.object({
      ipAddress: z.string().ip(),
      reason: z.string().optional(),
    })
    ```
