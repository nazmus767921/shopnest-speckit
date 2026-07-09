import {
  HeroContent,
  AnnouncementBarContent,
  CategoryShowcaseContent,
  AboutContent,
} from "./types"

export const defaultHeroContent: HeroContent = {
  title: "Welcome to Our Store",
  subtitle: "Discover the latest trends and exclusive offers.",
  buttonText: "Shop Now",
  buttonLink: "/products",
  imageUrl: "https://plcvqyshwxltgclhftya.supabase.co/storage/v1/object/public/template-defaults/hero-placeholder.jpg",
  overlayOpacity: 50,
}

export const defaultAnnouncementBarContent: AnnouncementBarContent = {
  text: "Free shipping on orders over ৳5000!",
  backgroundColor: "#000000",
  textColor: "#ffffff",
}

export const defaultCategoryShowcaseContent: CategoryShowcaseContent = {
  title: "Shop by Category",
  categoryIds: [],
  layout: "grid",
}

export const defaultAboutContent: AboutContent = {
  title: "Our Story",
  description: "We are committed to providing the best quality products and exceptional customer service.",
  imageUrl: "https://plcvqyshwxltgclhftya.supabase.co/storage/v1/object/public/template-defaults/about-placeholder.jpg",
}

export const defaultStorefrontSections = [
  {
    sectionKey: "announcement_bar",
    content: defaultAnnouncementBarContent,
    sortOrder: 0,
    isVisible: true,
  },
  {
    sectionKey: "hero",
    content: defaultHeroContent,
    sortOrder: 1,
    isVisible: true,
  },
  {
    sectionKey: "category_showcase",
    content: defaultCategoryShowcaseContent,
    sortOrder: 2,
    isVisible: true,
  },
  {
    sectionKey: "about",
    content: defaultAboutContent,
    sortOrder: 3,
    isVisible: true,
  },
  {
    sectionKey: "product_grid_featured",
    content: {
      title: "Featured Products",
      gridType: "featured"
    },
    sortOrder: 4,
    isVisible: true,
  },
  {
    sectionKey: "product_grid_new_arrivals",
    content: {
      title: "New Arrivals",
      gridType: "new_arrivals"
    },
    sortOrder: 5,
    isVisible: true,
  },
  {
    sectionKey: "product_grid_exclusive",
    content: {
      title: "Exclusive Collection",
      gridType: "exclusive"
    },
    sortOrder: 6,
    isVisible: false,
  },
  {
    sectionKey: "faq",
    content: {
      heading: "Frequently Asked Questions",
      questions: [
        { question: "What is your return policy?", answer: "We offer a 30-day return policy for unused items." },
        { question: "How long does shipping take?", answer: "Orders are typically processed within 24 hours and delivered within 2-3 business days." }
      ]
    },
    sortOrder: 7,
    isVisible: true,
  },
  {
    sectionKey: "footer",
    content: {
      storeDescription: "We are committed to providing the best quality products and exceptional customer service.",
      showPaymentBadges: true,
    },
    sortOrder: 9999,
    isVisible: true,
  }
]
