# Tasks: Customer CRM Upgrade

- [ ] T001 Define `customer_notes` schema and relations in `db/schema.ts` and run Drizzle push
- [ ] T002 Implement note fetching and insertion queries in `db/queries/customers.ts`
- [ ] T003 Implement account deletion and CSV export queries in `db/queries/customers.ts`
- [ ] T004 Create server actions (`addCustomerNoteAction`, `deleteCustomerAction`, `triggerPasswordResetAction`, `exportCustomerDataCsvAction`) in `app/actions/customers.ts`
- [ ] T005 Update `app/(dashboard)/dashboard/customers/[id]/page.tsx` to fetch orders and notes and pass them to the client component
- [ ] T006 Refactor `customer-details.tsx` into the new Tabbed layout with Sidebar (Stats, AOV)
- [ ] T007 Implement Orders Tab in `customer-details.tsx`
- [ ] T008 Implement Addresses Tab in `customer-details.tsx`
- [ ] T009 Implement Private Notes Tab in `customer-details.tsx`
- [ ] T010 Implement Security & Actions Tab (Password Reset, Delete, CSV Export) in `customer-details.tsx`
