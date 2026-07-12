import {
  Inter,
  Playfair_Display,
  Lora,
  Montserrat,
  Cormorant_Garamond,
  Outfit,
  Space_Grotesk,
} from "next/font/google"

export const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
export const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
export const lora = Lora({ subsets: ["latin"], variable: "--font-lora" })
export const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" })
export const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-cormorant" })
export const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })
export const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" })

export type FontPair = {
  id: string
  name: string
  headingFont: string
  bodyFont: string
}

export const fontPairs: FontPair[] = [
  {
    id: "modern-sans",
    name: "Modern Sans (Inter)",
    headingFont: "Inter",
    bodyFont: "Inter",
  },
  {
    id: "elegant-serif",
    name: "Elegant Serif (Playfair / Lora)",
    headingFont: "Playfair Display",
    bodyFont: "Lora",
  },
  {
    id: "bold-geo",
    name: "Bold Geometric (Montserrat)",
    headingFont: "Montserrat",
    bodyFont: "Montserrat",
  },
  {
    id: "classic-editorial",
    name: "Classic Editorial (Cormorant / Inter)",
    headingFont: "Cormorant Garamond",
    bodyFont: "Inter",
  },
  {
    id: "clean-tech",
    name: "Clean Tech (Outfit)",
    headingFont: "Outfit",
    bodyFont: "Outfit",
  },
  {
    id: "quirky-modern",
    name: "Quirky Modern (Space Grotesk / Inter)",
    headingFont: "Space Grotesk",
    bodyFont: "Inter",
  }
]

export function getFontFamily(fontName: string): string {
  switch (fontName) {
    case "Inter": return "var(--font-inter)"
    case "Playfair Display": return "var(--font-playfair)"
    case "Lora": return "var(--font-lora)"
    case "Montserrat": return "var(--font-montserrat)"
    case "Cormorant Garamond": return "var(--font-cormorant)"
    case "Outfit": return "var(--font-outfit)"
    case "Space Grotesk": return "var(--font-space-grotesk)"
    default: return "var(--font-inter)"
  }
}

export const fontClasses = [
  inter.variable,
  playfair.variable,
  lora.variable,
  montserrat.variable,
  cormorant.variable,
  outfit.variable,
  spaceGrotesk.variable
].join(" ")
