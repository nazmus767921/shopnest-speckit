import {
  HeroContent,
  AnnouncementBarContent,
  CategoryShowcaseContent,
  BrandStoryContent,
  FeaturedProductsContent,
  PromoBannerContent,
  TestimonialsContent,
  NewsletterContent,
  FaqContent,
  FooterContent,
} from "./types"
import { SECTION_SORT_ORDER } from "./section-catalog"

export const defaultAnnouncementBarContent: AnnouncementBarContent = {
  text: "Free shipping on orders over ৳5000!",
}

export const defaultHeroContent: HeroContent = {
  title: "Welcome to Our Store",
  subtitle: "Discover the latest trends and exclusive offers.",
  buttonText: "Shop Now",
  buttonLink: "/products",
  imageUrl: "https://plcvqyshwxltgclhftya.supabase.co/storage/v1/object/public/template-defaults/hero-placeholder.jpg",
}

export const defaultCategoryShowcaseContent: CategoryShowcaseContent = {
  title: "Shop by Category",
  categoryIds: [],
}

export const defaultFeaturedProductsContent: FeaturedProductsContent = {
  title: "Featured Products",
  gridType: "featured",
}

export const defaultPromoBannerContent: PromoBannerContent = {
  title: "Special Offer",
  subtitle: "Get 20% off on your first purchase.",
  buttonText: "Shop Now",
  buttonLink: "/products",
}

export const defaultBrandStoryContent: BrandStoryContent = {
  title: "Our Story",
  description: "We are committed to providing the best quality products and exceptional customer service.",
  imageUrl: "https://plcvqyshwxltgclhftya.supabase.co/storage/v1/object/public/template-defaults/about-placeholder.jpg",
}

export const defaultTestimonialsContent: TestimonialsContent = {
  heading: "What Our Customers Say",
  testimonials: [
    {
      name: "Alex Doe",
      text: "Great quality products and fast shipping!",
      rating: 5,
    },
    {
      name: "Jane Smith",
      text: "Excellent customer service. Highly recommended.",
      rating: 5,
    }
  ],
}

export const defaultNewsletterContent: NewsletterContent = {
  heading: "Subscribe to Our Newsletter",
  subheading: "Stay updated with our latest offers and products.",
  placeholder: "Enter your email",
  buttonText: "Subscribe",
}

export const defaultFaqContent: FaqContent = {
  heading: "Frequently Asked Questions",
  questions: [
    { question: "What is your return policy?", answer: "We offer a 30-day return policy for unused items." },
    { question: "How long does shipping take?", answer: "Orders are typically processed within 24 hours and delivered within 2-3 business days." }
  ]
}

export const defaultFooterContent: FooterContent = {
  storeDescription: "We are committed to providing the best quality products and exceptional customer service.",
  showPaymentBadges: true,
}

export const defaultStorefrontSections = [
  {
    sectionKey: "announcement_bar",
    content: defaultAnnouncementBarContent,
    sortOrder: SECTION_SORT_ORDER["announcement_bar"],
    isVisible: true,
  },
  {
    sectionKey: "hero",
    content: defaultHeroContent,
    sortOrder: SECTION_SORT_ORDER["hero"],
    isVisible: true,
  },
  {
    sectionKey: "category_showcase",
    content: defaultCategoryShowcaseContent,
    sortOrder: SECTION_SORT_ORDER["category_showcase"],
    isVisible: true,
  },
  {
    sectionKey: "featured_products",
    content: defaultFeaturedProductsContent,
    sortOrder: SECTION_SORT_ORDER["featured_products"],
    isVisible: true,
  },
  {
    sectionKey: "promo_banner",
    content: defaultPromoBannerContent,
    sortOrder: SECTION_SORT_ORDER["promo_banner"],
    isVisible: false,
  },
  {
    sectionKey: "brand_story",
    content: defaultBrandStoryContent,
    sortOrder: SECTION_SORT_ORDER["brand_story"],
    isVisible: true,
  },
  {
    sectionKey: "testimonials",
    content: defaultTestimonialsContent,
    sortOrder: SECTION_SORT_ORDER["testimonials"],
    isVisible: false,
  },
  {
    sectionKey: "newsletter",
    content: defaultNewsletterContent,
    sortOrder: SECTION_SORT_ORDER["newsletter"],
    isVisible: false,
  },
  {
    sectionKey: "faq",
    content: defaultFaqContent,
    sortOrder: SECTION_SORT_ORDER["faq"],
    isVisible: true,
  },
  {
    sectionKey: "footer",
    content: defaultFooterContent,
    sortOrder: SECTION_SORT_ORDER["footer"],
    isVisible: true,
  }
]
