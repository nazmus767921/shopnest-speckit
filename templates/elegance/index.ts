import { EleganceHomePage } from "./EleganceHomePage"
import { ElegancePLP } from "./ElegancePLP"
import { ElegancePDP } from "./ElegancePDP"
import { EleganceCartPage } from "./EleganceCartPage"
import { EleganceNavbar } from "./EleganceNavbar"

import { EleganceStandardPage } from "./EleganceStandardPage"

import { HeroSection } from "./sections/HeroSection"
import { CategoryShowcase } from "./sections/CategoryShowcase"
import { FeaturedProducts } from "./sections/FeaturedProducts"
import { PromoBanner } from "./sections/PromoBanner"
import { FooterSection } from "./sections/FooterSection"
import { SectionKey } from "@/lib/storefront-sections/section-catalog"
import { SectionProps } from "../types"

const sections: Partial<Record<SectionKey, React.ComponentType<SectionProps>>> = {
  hero: HeroSection as any,
  category_showcase: CategoryShowcase as any,
  featured_products: FeaturedProducts as any,
  promo_banner: PromoBanner as any,
  footer: FooterSection as any,
}

export {
  EleganceHomePage as HomePage,
  ElegancePLP as PLP,
  ElegancePDP as PDP,
  EleganceCartPage as CartPage,
  EleganceNavbar as Navbar,
  FooterSection as Footer,
  EleganceStandardPage as StandardPage,
  sections,
}
