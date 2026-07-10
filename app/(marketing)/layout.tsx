import * as React from "react"
import Link from "next/link"
import { Navbar } from "@/components/shared/Navbar"
import { ArrowRight, Globe } from "lucide-react"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="theme-compact-sharp flex flex-col min-h-screen bg-canvas-night text-on-primary">
      {/* Sticky Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="grow">{children}</main>

      {/* Footer (footer-dark) - Revamped design */}
      <footer className="bg-canvas-night border-t border-white/5 text-caption py-20 px-8 text-link-cool-2">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {/* Branding Column (Col span 2 on desktop, full span on tablet/mobile) */}
            <div className="md:col-span-4 lg:col-span-2">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-display-md font-light text-on-primary tracking-tight">
                    Shop<span className="text-aloe-10 font-normal">Nest</span>
                  </span>
                  <p className="text-body-md text-link-cool-1 font-light leading-relaxed">
                    Automating Facebook clothing boutiques with premium subdomains, structured payment confirmation, and real-time inventory management.
                  </p>
                </div>

                {/* Newsletter Signup */}
                <div className="flex flex-col gap-1 pt-4">
                  <span className="text-caption text-on-primary font-medium tracking-wider uppercase text-xs">
                    Get updates & tips
                  </span>
                  <div className="flex gap-2 items-center border-b border-white/20 focus-within:border-aloe-10 transition-colors duration-200 py-1">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="bg-transparent text-body-md text-on-primary placeholder-shade-60 focus:outline-none w-full"
                    />
                    <button className="text-aloe-10 hover:text-on-primary transition-colors focus:outline-none cursor-pointer">
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Column */}
            <div className="flex flex-col gap-2">
              <h4 className="text-heading-sm text-on-primary font-medium uppercase tracking-wider text-xs">Product</h4>
              <div className="flex flex-col gap-1">
                <Link href="#features" className="text-link-cool-2 underline decoration-link-cool-2/30 hover:decoration-on-primary hover:text-on-primary transition-all duration-200">
                  Features
                </Link>
                <Link href="#pricing" className="text-link-cool-2 underline decoration-link-cool-2/30 hover:decoration-on-primary hover:text-on-primary transition-all duration-200">
                  Pricing
                </Link>
                <Link href="#faq" className="text-link-cool-2 underline decoration-link-cool-2/30 hover:decoration-on-primary hover:text-on-primary transition-all duration-200">
                  FAQ
                </Link>
              </div>
            </div>

            {/* Support Column */}
            <div className="flex flex-col gap-2">
              <h4 className="text-heading-sm text-on-primary font-medium uppercase tracking-wider text-xs">Support</h4>
              <div className="flex flex-col gap-1">
                <span className="cursor-default hover:text-on-primary transition-colors duration-200 hover:underline decoration-white/30">Help Center</span>
                <span className="cursor-default hover:text-on-primary transition-colors duration-200 hover:underline decoration-white/30">Merchant Manual</span>
                <span className="cursor-default hover:text-on-primary transition-colors duration-200 hover:underline decoration-white/30">Payment Guides</span>
              </div>
            </div>

            {/* Company Column */}
            <div className="flex flex-col gap-2">
              <h4 className="text-heading-sm text-on-primary font-medium uppercase tracking-wider text-xs">Company</h4>
              <div className="flex flex-col gap-1">
                <span className="cursor-default hover:text-on-primary transition-colors duration-200 hover:underline decoration-white/30">About ShopNest</span>
                <span className="cursor-default hover:text-on-primary transition-colors duration-200 hover:underline decoration-white/30">Careers</span>
                <span className="cursor-default hover:text-on-primary transition-colors duration-200 hover:underline decoration-white/30">Contact Us</span>
              </div>
            </div>
          </div>

          {/* Socials & Copyright Row */}
          <div className="mt-16 pt-8 border-t border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <p className="text-link-cool-3 text-caption font-light">
                © 2026 ShopNest. All rights reserved. Made in Bangladesh.
              </p>


              <div className="flex gap-6 md:justify-end items-center text-link-cool-3">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-on-primary transition-colors" aria-label="Facebook">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                  </svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-on-primary transition-colors" aria-label="Instagram">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a href="https://shopnest.com.bd" className="hover:text-on-primary transition-colors" aria-label="Website">
                  <Globe className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
