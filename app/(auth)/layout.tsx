import React from "react"
import { Check } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-canvas-cream text-ink select-none">
      {/* Left Column: Cinematic Brand Showcase (Desktop Only) */}
      <div className="hidden lg:flex lg:col-span-5 bg-canvas-night text-on-primary flex-col justify-between p-12 border-r border-white/5 relative overflow-hidden">
        {/* Subtle background glow to add premium aesthetic depth without utilizing shadows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-aloe-10/5 rounded-full blur-3xl pointer-events-none transform translate-x-10 -translate-y-10" />

        {/* Top: Branding */}
        <div className="flex items-center gap-2 z-10">
          <span className="font-display text-heading-lg tracking-tight font-light">
            Shop<span className="text-aloe-10 font-normal">Nest</span>
          </span>
        </div>

        {/* Middle: Headline & Testimonial */}
        <div className="flex flex-col gap-8 max-w-md my-auto z-10">
          <h1 className="font-display text-display-md tracking-tight font-light leading-tight">
            Simplify your boutique. <br />
            Empower your brand.
          </h1>
          
          <div className="flex flex-col gap-4 border-l border-aloe-10/30 pl-6 py-2">
            <p className="text-body-lg font-light italic text-shade-30">
              "We went from 50 chaotic Facebook DMs a day to a structured order workflow on ShopNest. Our boutique sales doubled in the first month."
            </p>
            <div className="flex flex-col gap-0.5">
              <span className="text-body-strong font-medium text-on-primary">Niha Rahman</span>
              <span className="text-caption text-shade-40">Founder, Poridhan Boutique</span>
            </div>
          </div>
        </div>

        {/* Bottom: Feature Badges list */}
        <div className="flex flex-col gap-3 z-10 border-t border-white/5 pt-8">
          {[
            "Branded Subdomain Storefront",
            "Structured bKash/Nagad Checkouts",
            "Auto Stock Sync & SMS Alerts"
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 text-shade-30">
              <div className="p-1 bg-white/5 rounded-full text-aloe-10">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-caption font-light">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Form Canvas */}
      <div className="col-span-12 lg:col-span-7 flex flex-col justify-center items-center px-6 py-16 sm:px-12 md:px-16 lg:px-24 bg-canvas-cream relative">
        {/* Subtle top-right mobile logo container */}
        <div className="w-full max-w-md flex flex-col gap-8">
          <div className="lg:hidden flex flex-col items-center gap-1.5 pb-2">
            <span className="font-display text-heading-xl tracking-tight font-light">
              Shop<span className="text-emerald-800 font-normal">Nest</span>
            </span>
            <p className="text-caption text-shade-50">Boutique E-commerce Platform</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
