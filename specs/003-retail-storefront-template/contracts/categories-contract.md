# Category API Contracts: Image Support

This contract documents the server actions used to manage category images.

## 1. Create Category Server Action

* **Identifier**: `createCategoryAction`
* **File Location**: [app/actions/categories.ts](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/app/actions/categories.ts)
* **Payload Schema (Zod)**:
  ```typescript
  const categorySchema = z.object({
    name: z.string().min(2, "Category name must be at least 2 characters."),
    slug: z.string().min(2, "Slug must be at least 2 characters.")
      .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens."),
    parentId: z.string().nullable().optional(),
    imageUrl: z.string().url().or(z.string().regex(/^\/storage\/.+/)).nullable().optional(), // <-- NEW: image url/path
  })
  ```
* **Response**:
  * **Success**: `{ success: true, category: Category }`
  * **Failure**: `{ success: false, error: string }`

---

## 2. Update Category Server Action

* **Identifier**: `updateCategoryAction`
* **File Location**: [app/actions/categories.ts](file:///c:/Users/Admin/Desktop/Projects/running/shopnest-speckit/app/actions/categories.ts)
* **Arguments**:
  * `categoryId`: string (UUID of target category)
  * `values`: unknown (matching Zod schema above)
* **Response**:
  * **Success**: `{ success: true, category: Category }`
  * **Failure**: `{ success: false, error: string }`
