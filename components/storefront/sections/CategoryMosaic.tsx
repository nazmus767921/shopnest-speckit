import React from "react"
import Link from "next/link"
import { CategoryShowcaseContent } from "@/lib/storefront-sections/types"
import { getCategories } from "@/db/queries/categories"

export async function CategoryMosaic({ content, merchantId }: { content: CategoryShowcaseContent, merchantId: string }) {
  const { title, layout = "grid" } = content
  
  // Fetch active categories for the merchant
  const allCategories = await getCategories(merchantId)
  // Limit to 4-5 categories for the best layout
  const categories = allCategories.slice(0, 5)

  if (categories.length === 0) return null

  return (
    <section className="py-24 md:py-32 px-4 md:px-8 max-w-screen-2xl mx-auto w-full">
      <div className="flex flex-col gap-16">
        <div className="flex flex-col md:flex-row items-baseline justify-between gap-6">
          <h2 className="text-4xl md:text-5xl font-sans font-light tracking-tight text-ink">{title}</h2>
          <Link href="/products" className="text-sm font-sans font-medium uppercase tracking-widest text-zinc-500 hover:text-ink transition-colors">
            Explore Collection
          </Link>
        </div>

        {layout === "mosaic" ? (
          /* Editorial Accordion Layout (Mosaic) */
          <div className="flex flex-col md:flex-row w-full h-[600px] md:h-[700px] gap-4">
            {categories.map((category, idx) => (
              <Link 
                key={category.id} 
                href={`/products?category=${category.slug}`}
                className={`group relative overflow-hidden rounded-xl bg-zinc-200 flex-1 hover:flex-[3] transition-[flex] duration-700 ease-out flex items-end p-8`}
              >
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-700" />
                
                {/* Content */}
                <div className="relative z-10 w-full overflow-hidden">
                  <div className="flex items-center gap-4">
                    <span className="text-white/60 font-sans text-sm font-light tracking-widest tabular-nums">
                      0{idx + 1}
                    </span>
                    <h3 className="text-white font-sans font-medium text-2xl md:text-3xl tracking-wide whitespace-nowrap transform md:origin-bottom-left md:group-hover:scale-110 transition-transform duration-700">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Grid Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
            {categories.map((category, idx) => (
              <Link 
                key={category.id} 
                href={`/products?category=${category.slug}`}
                className="group relative overflow-hidden rounded-xl bg-[var(--color-surface-product)] p-8 min-h-[220px] flex flex-col justify-between hover:bg-[var(--color-surface-hover)] transition-all duration-300 border border-[var(--color-hairline-warm)]/10 hover:border-[var(--color-hairline-warm)]/30"
              >
                <div className="text-zinc-500 font-sans text-xs font-light tracking-widest tabular-nums">
                  0{idx + 1}
                </div>
                <div>
                  <h3 className="text-ink font-sans font-medium text-xl md:text-2xl tracking-wide transform group-hover:translate-x-1 transition-transform duration-300">
                    {category.name}
                  </h3>
                  <span className="text-zinc-500 font-sans text-xs font-light uppercase tracking-wider block mt-4 opacity-70 group-hover:opacity-100 transition-opacity">
                    Shop Category →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
