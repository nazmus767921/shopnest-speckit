import fs from "fs"
import path from "path"
import { execSync } from "child_process"

const templateName = process.argv[2]

if (!templateName) {
  console.error("Usage: bun run scaffold:template <template-slug>")
  process.exit(1)
}

const slug = templateName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
const TemplateName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())

const baseDir = path.join(process.cwd(), "templates", slug)

if (fs.existsSync(baseDir)) {
  console.error(`Template ${slug} already exists at ${baseDir}`)
  process.exit(1)
}

const dirs = [
  "",
  "/sections",
  "/__tests__",
]

dirs.forEach((dir) => {
  fs.mkdirSync(path.join(baseDir, dir), { recursive: true })
})

// 1. Generate index.ts
const indexTs = `import { TemplateModule } from "../types"
import { ${TemplateName}Shell } from "./Shell"

// Pages
import { ${TemplateName}HomePage } from "./${TemplateName}HomePage"
import { ${TemplateName}PLP } from "./${TemplateName}PLP"
import { ${TemplateName}PDP } from "./${TemplateName}PDP"
import { ${TemplateName}StandardPage } from "./${TemplateName}StandardPage"

// Sections
import { HeroSection } from "./sections/HeroSection"
import { FeaturedProducts } from "./sections/FeaturedProducts"
import { CategoryShowcase } from "./sections/CategoryShowcase"
import { PromoBanner } from "./sections/PromoBanner"
import { BrandStory } from "./sections/BrandStory"
import { Testimonials } from "./sections/Testimonials"
import { Newsletter } from "./sections/Newsletter"
import { FAQSection } from "./sections/FAQSection"
import { AnnouncementBar } from "./sections/AnnouncementBar"
import { FooterSection } from "./sections/FooterSection"

export const ${slug}Template: TemplateModule = {
  metadata: {
    slug: "${slug}",
    name: "${TemplateName}",
    description: "A new custom template.",
    defaultTheme: {
      colors: {
        primary: "#000000",
        background: "#ffffff",
      },
      fonts: {
        display: "sans",
        sans: "sans",
      },
      radius: "md",
    },
    layoutConfig: {
      hasSidebar: false,
      maxWidth: "standard",
    },
  },
  Shell: ${TemplateName}Shell,
  pages: {
    home: ${TemplateName}HomePage,
    plp: ${TemplateName}PLP,
    pdp: ${TemplateName}PDP,
    standard: ${TemplateName}StandardPage,
  },
  sections: {
    hero: HeroSection,
    featured_products: FeaturedProducts,
    category_showcase: CategoryShowcase,
    promo_banner: PromoBanner,
    brand_story: BrandStory,
    testimonials: Testimonials,
    newsletter: Newsletter,
    faq: FAQSection,
    announcement_bar: AnnouncementBar,
    footer: FooterSection,
  },
}
`

// 2. Generate Shell.tsx
const shellTsx = `import React from "react"
import { ShellProps } from "../types"

export function ${TemplateName}Shell({ children, store }: ShellProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* TODO: Add Header/Navbar here */}
      <header className="p-4 border-b border-zinc-200">
        <h1 className="text-xl font-bold">{store.name}</h1>
      </header>
      
      <main>{children}</main>
    </div>
  )
}
`

// 3. Generate page stubs
const homePage = `import React from "react"
import { HomePageProps } from "../types"
import { SectionRenderer } from "@/components/storefront/sections/SectionRenderer"

export function ${TemplateName}HomePage({ store, sections }: HomePageProps) {
  return (
    <div>
      <SectionRenderer sections={sections} merchantId={store.id} subdomain={store.subdomain} />
    </div>
  )
}
`

const plpPage = `import React from "react"
import { PLPProps } from "../types"

export function ${TemplateName}PLP({ store, products }: PLPProps) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Collection</h1>
      <div className="grid grid-cols-4 gap-6">
        {products.map((p: any) => (
          <div key={p.id} className="border p-4">
            <h3>{p.name}</h3>
            <p>BDT {p.pricePaisa / 100}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
`

const pdpPage = `import React from "react"
import { PDPProps } from "../types"

export function ${TemplateName}PDP({ product }: PDPProps) {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
      <p className="text-xl">BDT {product.pricePaisa / 100}</p>
      <div className="mt-8">{product.description}</div>
    </div>
  )
}
`

const standardPage = `import React from "react"
import { StandardPageProps } from "../types"

export function ${TemplateName}StandardPage({ page }: StandardPageProps) {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.content }} />
    </div>
  )
}
`

// 4. Generate section stubs
const sections = [
  "HeroSection",
  "FeaturedProducts",
  "CategoryShowcase",
  "PromoBanner",
  "BrandStory",
  "Testimonials",
  "Newsletter",
  "FAQSection",
  "AnnouncementBar",
  "FooterSection",
]

sections.forEach(section => {
  const content = `import React from "react"

export function ${section}({ section, merchantId, subdomain }: any) {
  return (
    <div className="p-8 border-y border-zinc-100 my-4 text-center text-zinc-500">
      ${section} Placeholder
    </div>
  )
}
`
  fs.writeFileSync(path.join(baseDir, "sections", `${section}.tsx`), content)
})

// 5. Generate styles.css
const stylesCss = `/*
  Template: ${TemplateName}
  Styles specific to this template.
*/

.storefront-template-${slug} {
  /* Template scoped variables here */
}
`

// 6. Generate DESIGN.md
const designMd = `# ${TemplateName} Template Design System

## Philosophy
(Describe the template's vibe and target audience)

## Architecture
This template implements all 10 core sections.
`

// 7. Generate Tests
const testFile = `import { describe, it, expect } from "vitest"
import { ${slug}Template } from "../index"

describe("${TemplateName} Template Contract", () => {
  it("implements all required sections", () => {
    expect(${slug}Template.sections.hero).toBeDefined()
    expect(${slug}Template.sections.featured_products).toBeDefined()
    expect(${slug}Template.sections.category_showcase).toBeDefined()
    expect(${slug}Template.sections.promo_banner).toBeDefined()
    expect(${slug}Template.sections.brand_story).toBeDefined()
    expect(${slug}Template.sections.testimonials).toBeDefined()
    expect(${slug}Template.sections.newsletter).toBeDefined()
    expect(${slug}Template.sections.faq).toBeDefined()
    expect(${slug}Template.sections.announcement_bar).toBeDefined()
    expect(${slug}Template.sections.footer).toBeDefined()
  })

  it("implements all required pages", () => {
    expect(${slug}Template.pages.home).toBeDefined()
    expect(${slug}Template.pages.plp).toBeDefined()
    expect(${slug}Template.pages.pdp).toBeDefined()
    expect(${slug}Template.pages.standard).toBeDefined()
  })
})
`

// Write all files
fs.writeFileSync(path.join(baseDir, "index.ts"), indexTs)
fs.writeFileSync(path.join(baseDir, "Shell.tsx"), shellTsx)
fs.writeFileSync(path.join(baseDir, `${TemplateName}HomePage.tsx`), homePage)
fs.writeFileSync(path.join(baseDir, `${TemplateName}PLP.tsx`), plpPage)
fs.writeFileSync(path.join(baseDir, `${TemplateName}PDP.tsx`), pdpPage)
fs.writeFileSync(path.join(baseDir, `${TemplateName}StandardPage.tsx`), standardPage)
fs.writeFileSync(path.join(baseDir, "styles.css"), stylesCss)
fs.writeFileSync(path.join(baseDir, "DESIGN.md"), designMd)
fs.writeFileSync(path.join(baseDir, "__tests__", "contract.test.ts"), testFile)

console.log(`Successfully scaffolded template '${slug}' at ${baseDir}`)
console.log("Remember to register it in templates/registry.ts!")
