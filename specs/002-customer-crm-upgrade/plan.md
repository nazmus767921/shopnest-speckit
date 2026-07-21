# Technical Plan: Customer CRM Upgrade

## 1. Database Schema
- New Table: `customer_notes`
  - `id`: text (PK)
  - `merchant_id`: text (FK -> merchants)
  - `customer_id`: text (FK -> user)
  - `author_id`: text (FK -> user)
  - `content`: text
  - `created_at`, `updated_at`: timestamps

## 2. Data Queries (`db/queries/customers.ts`)
- `getCustomerNotes(merchantId, customerId)`
- `addCustomerNote(merchantId, customerId, authorId, content)`
- `deleteCustomerAccount(merchantId, customerId)`

## 3. Server Actions (`app/actions/customers.ts`)
- `addCustomerNoteAction(customerId, content)`
- `deleteCustomerAction(customerId)`
- `triggerPasswordResetAction(email)`
- `exportCustomerDataCsvAction(customerId)`: Generates CSV of orders and profile.

## 4. Frontend UI (`customer-details.tsx`)
- Implement a two-column grid. Left column for stats (Profile image, AOV, Spend, Status).
- Right column for Tabs (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from Shadcn).
- **Orders Tab**: Implement a `DataTable` or simple table for their orders history.
- **Addresses Tab**: Move existing address grid into this tab.
- **Notes Tab**: A `<textarea>` and submit button, followed by a mapped feed of `customer_notes`.
- **Security Tab**: Buttons for Password Reset, Export CSV, and Delete Account (with `AlertDialog` confirmation).
