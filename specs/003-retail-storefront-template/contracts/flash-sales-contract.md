# Flash Sales API Contracts

This contract documents the new Server Actions introduced to create, read, update, and toggle merchant flash sales.

## 1. Create Flash Sale Server Action

* **Identifier**: `createFlashSaleAction`
* **File Location**: `app/actions/flash-sales.ts`
* **Payload Schema (Zod)**:
  ```typescript
  const flashSaleCreateSchema = z.object({
    productId: z.string().uuid("Invalid product reference."),
    salePricePaisa: z.number().int().positive("Price must be a positive integer in Paisa."),
    limitQuantity: z.number().int().positive("Limit count must be greater than zero."),
    startTime: z.coerce.date().refine(val => val > new Date(), {
      message: "Start time must be in the future."
    }),
    endTime: z.coerce.date(),
  }).refine(data => data.endTime > data.startTime, {
    message: "End time must be after the start time.",
    path: ["endTime"]
  })
  ```
* **Response**:
  * **Success**: `{ success: true, flashSale: FlashSale }`
  * **Failure**: `{ success: false, error: string }`

---

## 2. Update Flash Sale Server Action

* **Identifier**: `updateFlashSaleAction`
* **File Location**: `app/actions/flash-sales.ts`
* **Arguments**:
  * `id`: string (UUID of flash sale)
  * `values`:
    ```typescript
    const flashSaleUpdateSchema = z.object({
      salePricePaisa: z.number().int().positive().optional(),
      limitQuantity: z.number().int().positive().optional(),
      endTime: z.coerce.date().optional(),
      isActive: z.boolean().optional(),
    })
    ```
* **Response**:
  * **Success**: `{ success: true, flashSale: FlashSale }`
  * **Failure**: `{ success: false, error: string }`

---

## 3. End Flash Sale Server Action

* **Identifier**: `endFlashSaleAction`
* **File Location**: `app/actions/flash-sales.ts`
* **Arguments**:
  * `id`: string (UUID of flash sale)
* **Response**:
  * **Success**: `{ success: true }`
  * **Failure**: `{ success: false, error: string }`

---

## 4. Get Active Flash Sales Action

* **Identifier**: `getActiveFlashSalesAction`
* **File Location**: `app/actions/flash-sales.ts`
* **Arguments**: none (dynamically resolved merchant tenancy context via headers session)
* **Response**:
  * **Success**: `{ success: true, flashSales: FlashSale[] }`
  * **Failure**: `{ success: false, error: string }`
