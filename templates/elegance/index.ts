import { defineTemplate, createDefaultSection } from "../registry"

import { EleganceHomePage } from "./EleganceHomePage"
import { ElegancePLP } from "./ElegancePLP"
import { ElegancePDP } from "./ElegancePDP"
import { EleganceStandardPage } from "./EleganceStandardPage"
import { Shell } from "./Shell"

import { HeroSection } from "./sections/HeroSection"
import { CategoryShowcase } from "./sections/CategoryShowcase"
import { FeaturedProducts } from "./sections/FeaturedProducts"
import { PromoBanner } from "./sections/PromoBanner"
import { FooterSection } from "./sections/FooterSection"

export const elegance = defineTemplate({
  metadata: {
    slug: "elegance",
    name: "Elegance",
    description: "A refined, minimalist template for fashion and lifestyle.",
    defaultTheme: {
      colors: {},
      fonts: { display: "serif", sans: "sans-serif" },
      radius: "none"
    },
    layoutConfig: {
      hasSidebar: false,
      maxWidth: "wide"
    }
  },
  Shell,
  pages: {
    home: EleganceHomePage,
    plp: ElegancePLP,
    pdp: ElegancePDP,
    standard: EleganceStandardPage,
  },
  sections: {
    hero: HeroSection,
    category_showcase: CategoryShowcase,
    featured_products: FeaturedProducts,
    promo_banner: PromoBanner,
    footer: FooterSection,
  }
})

// Since the old registry expected index.ts to export the template properties directly
// (like export { EleganceHomePage as HomePage ... })
// Actually, registry.ts now does: import * as elegance from "./elegance"
// And then uses `elegance as TemplateModule`.
// Wait, if registry.ts imports * as elegance, it expects the exports to match TemplateModule exactly.
// So I should export all those fields directly, OR I can change registry.ts to use `elegance.elegance`.
