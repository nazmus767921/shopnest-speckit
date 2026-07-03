# Next.js Cache Components & Dynamic Routing

When Next.js Cache Components are enabled, follow these guidelines to prevent build-time static prerendering errors and route blocking:

1. **Wrap the Component in <Suspense>**
   Move code that accesses dynamic data (cookies, headers, or uncached fetch calls) or uses dynamic time (like `new Date()`) into its own nested Server Component. Wrap that component in a `<Suspense>` boundary in the parent component and provide a fallback like a loading spinner/skeleton.

2. **Use the "use cache" Directive**
   If you do not need the data to be perfectly fresh on every request and want to make the component static, add `'use cache'` at the top of the file.

3. **Move Dynamic Functions Deeper**
   If you are calling `cookies()` or `headers()` at the very top of a layout or page, move that call deeper into your component tree to the specific components that require them.
