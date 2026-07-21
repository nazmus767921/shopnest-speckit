import { TemplateModule } from "../types"
import { SunsetShell } from "./Shell"

// Pages
import { SunsetHomePage } from "./SunsetHomePage"
import { SunsetPLP } from "./SunsetPLP"
import { SunsetPDP } from "./SunsetPDP"
import { SunsetStandardPage } from "./SunsetStandardPage"

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

export const sunsetTemplate: TemplateModule = {
  metadata: {
    slug: "sunset",
    name: "Sunset",
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
  Shell: SunsetShell,
  pages: {
    home: SunsetHomePage,
    plp: SunsetPLP,
    pdp: SunsetPDP,
    standard: SunsetStandardPage,
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
