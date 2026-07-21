import { TemplateModule } from "../types"
import { MidnightShell } from "./Shell"

// Pages
import { MidnightHomePage } from "./MidnightHomePage"
import { MidnightPLP } from "./MidnightPLP"
import { MidnightPDP } from "./MidnightPDP"
import { MidnightStandardPage } from "./MidnightStandardPage"

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

export const midnightTemplate: TemplateModule = {
  metadata: {
    slug: "midnight",
    name: "Midnight",
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
  Shell: MidnightShell,
  pages: {
    home: MidnightHomePage,
    plp: MidnightPLP,
    pdp: MidnightPDP,
    standard: MidnightStandardPage,
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
