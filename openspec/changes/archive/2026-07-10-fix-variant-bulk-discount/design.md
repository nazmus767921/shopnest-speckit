## Context

The product variant bulk price adjustment allows setting prices, adding/subtracting amounts, or adjusting by percentages. 
The front-end client passes the inputs to a server action `bulkUpdateVariantsAction` in `app/actions/variants.ts`.
In `VariantBulkToolbar.tsx`, the `NumberInput` component is used to collect the inputs. Because `NumberInput` uses `minValue = 0` as a default fallback property in its function definition, it implicitly restricts any inputs below `0` even if `minValue={undefined}` is supplied. 

## Goals / Non-Goals

**Goals:**
- Update `VariantBulkToolbar.tsx` to conditionally pass `minValue` constraints to `NumberInput` based on the active adjustment type (percent allows down to `-100`, fixed allows down to `0`, and add/subtract amount allows any number/negative values).
- Verify that users can type and submit negative numbers for percentage discounts (e.g. `-10` or `-20`).
- Ensure quick discount presets work seamlessly.

**Non-Goals:**
- Changing the generic `NumberInput` component's default property `minValue = 0`, as it might affect other sections of the dashboard.
- Modifying the server-side action validation or calculations since the backend already supports negative percent/add_amount values.

## Decisions

### Decision 1: Conditional `minValue` properties at call sites in `VariantBulkToolbar.tsx`
- **Choice**: Set `minValue` based on `priceType` / `compareAtPriceType`:
  - `fixed` -> `0`
  - `percent` -> `-100`
  - `add_amount` -> `undefined`
- **Alternatives considered**:
  - *Modify NumberInput's default value to undefined*: Rejected because it changes standard component behaviors elsewhere in the app (e.g., stock count edit, simple pricing) and is high risk without testing all sites.
- **Rationale**: Setting call-site limits keeps the scope isolated to the toolbar component and respects local adjustment rules without side effects.

## Risks / Trade-offs

- **Risk**: A user could type an arbitrarily large negative number (e.g., `-200%` discount or `-10000৳` price adjustment).
- **Mitigation**: The database/server action protects pricing by wrapping calculated outputs with `Math.max(0, calculatedPricePaisa)`, so it is impossible to set negative final prices on the variants.
