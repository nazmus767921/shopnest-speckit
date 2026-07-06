# Next.js 16 Caching & Routing Rules

> **System Directive:** Strict adherence required to prevent build errors and route blocking under `cacheComponents: true` (Next.js 15/16).

## 1. Core Caching Paradigm

* **Default:** All fetches and components are **uncached (dynamic)** by default.
* **Opt-In Static:** Apply the `'use cache'` directive at the top of a file (scopes all exports) or inline within an `async` function/component to cache its return value.

## 2. Preventing Static Prerendering Errors

* **Async Dynamic APIs:** `cookies()`, `headers()`, `params`, and `searchParams` are asynchronous. You must `await` them (e.g., `const c = await cookies()`).
* **De-optimize Grating:** Never call dynamic APIs at the root layout/page level. Push calls deep into the specific leaf components requiring them.
* **Suspense Isolation:** Wrap any component accessing dynamic data (cookies, headers, uncached fetches) or runtime-dependent code (`new Date()`) in a `<Suspense>` boundary with a fallback UI.

## 3. Contextual Isolation

* Do not mix `'use cache'` with real-time user-specific streams.
* **Pattern:** Extract user context (e.g., ID via `await cookies()`) in an uncached parent component. Pass the extracted primitive values as serializable arguments to a cached child component or data function. Arguments automatically act as cache keys.

## 4. Cache Invalidation & Mutations

Always invalidate stale data inside Server Actions or Route Handlers post-mutation:

* **`revalidateTag` (Precision):** Inject tags inside a `'use cache'` scope using `cacheTag('tag-name')`. Invalidate via `revalidateTag('tag-name')`. (Preferred method).
* **`revalidatePath` (Sweep):** Use to purge a route structure when tags are unknown.
* Specific: `revalidatePath('/dashboard')`
* Dynamic: `revalidatePath('/blog/[slug]', 'page')`
* Global: `revalidatePath('/', 'layout')`



## 5. Explicit Anti-Patterns

* **CRITICAL:** Do not use legacy segment configs (e.g., `export const revalidate = 3600`). Use `'use cache'` + `cacheLife()`.
* **CRITICAL:** Do not pass non-serializable data (classes, streams, Functions) into cached functions.