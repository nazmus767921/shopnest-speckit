import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge } from "@/components/ui"
import { FaqAccordion } from "@/components/shared/FaqAccordion"
import { CheckIcon, ArrowRightIcon, ShoppingBagIcon, CreditCardIcon, SmartphoneIcon, LayersIcon } from "@/lib/icons";

import { getAllPlans } from "@/db/queries/plans"

export default async function MarketingPage() {
  const plans = await getAllPlans()
  return (
    <div className="w-full">
      {/* 1. HERO SECTION (Shopify-Style Cinematic Dark Canvas) */}
      <section className="bg-canvas-night text-on-primary min-h-[calc(100vh-4rem)] flex items-center py-24 lg:py-32 px-8 overflow-hidden relative">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16 items-center">
            {/* Left Side: Value Prop & Inline Email Form (Col span 7) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex flex-col gap-3 items-start">
                <Badge variant="outline" className="border-white/20 text-on-primary font-light px-4 py-1.5 text-xs tracking-wider">
                  Introducing ShopNest for Bangladesh
                </Badge>

                <h1 className="text-4xl sm:text-5xl lg:text-display-lg xl:text-display-xl font-light tracking-tight leading-[1.05] text-left">
                  Turn your Facebook boutique into a <span className="text-aloe-10">professional</span> storefront.
                </h1>

                <p className="text-body-lg text-shade-40 font-light leading-relaxed text-left">
                  Stop managing orders in messy DMs. Get a branded subdomain, live inventory, and a structured bKash/Nagad checkout in 5 minutes.
                </p>
              </div>

              {/* Shopify-style Inline Email Signup Form */}
              <div className="flex flex-col gap-2 w-full max-w-2xl">
                <form action="/register" method="GET" className="flex flex-col sm:flex-row gap-3 w-full">
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your shop email address"
                    required
                    className="bg-white/6 border border-white/20 hover:border-white/40 focus:border-aloe-10 focus:ring-1 focus:ring-aloe-10 rounded-full px-6 py-3.5 text-body-md text-on-primary placeholder-shade-50 grow transition-all duration-200"
                  />
                  <Button variant="ghost" type="submit" size="lg" className="bg-on-primary text-primary hover:bg-on-primary/90 active:bg-shade-30 font-semibold whitespace-nowrap focus-visible:ring-on-primary focus-visible:ring-offset-canvas-night">
                    Start Free Trial
                  </Button>
                </form>
                <p className="text-xs text-shade-50">
                  Try ShopNest free for 7 days. No credit card required.
                </p>
              </div>
            </div>

            {/* Right Side: Layered E-commerce Visual Graphic (Col span 5) */}
            <div className="lg:col-span-5 w-full relative h-100 sm:h-112.5 lg:h-125">
              {/* Main Merchant Image Frame */}
              <div className="absolute inset-0 w-full h-[85%] rounded-2xl overflow-hidden border border-white/10 transform lg:-rotate-1 transition-transform duration-500 z-10">
                <Image
                  src="/hero_merchant_boutique.png"
                  alt="Bangladeshi boutique store background"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 42vw, 530px"
                  className="object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-linear-to-t from-canvas-night via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating Card 1: Real-time Order Alert */}
              <div className="absolute top-[10%] left-[-5%] sm:left-[-10%] bg-canvas-night-elevated/90 backdrop-blur-md border border-white/10 rounded-xl p-4 z-20 max-w-60 transform hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-aloe-10/10 rounded-full text-aloe-10 shrink-0">
                    <ShoppingBagIcon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-shade-40 tracking-wide uppercase">New Order Received</span>
                    <span className="text-xs font-semibold text-on-primary">Nila • ৳1,450 via bKash</span>
                  </div>
                </div>
              </div>

              {/* Floating Card 2: Live Stock Count */}
              <div className="absolute bottom-[25%] right-[-5%] sm:right-[-10%] bg-canvas-night-elevated/90 backdrop-blur-md border border-white/10 rounded-xl p-4 z-20 max-w-50 transform hover:translate-y-1 transition-transform duration-300">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-on-primary truncate">Traditional Cotton Sharee</span>
                    <span className="h-2 w-2 rounded-full bg-aloe-10 animate-pulse shrink-0" />
                  </div>
                  <span className="text-[10px] text-shade-40 tracking-wide uppercase">Stock Status</span>
                  <span className="text-xs font-semibold text-aloe-10">12 items left (Low Stock)</span>
                </div>
              </div>

              {/* Floating Card 3: Checkout Mock Frame */}
              <div className="absolute bottom-0 left-[5%] right-[5%] bg-canvas-night-elevated/90 backdrop-blur-md border border-white/10 rounded-xl p-4 z-20 transform hover:scale-[1.02] transition-transform duration-300">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs text-on-primary font-medium">bKash/Nagad Checkout</span>
                    <span className="text-[10px] text-shade-40">Order #1042</span>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-shade-50">Transaction ID:</span>
                      <span className="text-on-primary font-mono">8XK29L3M</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-shade-50">Status:</span>
                      <span className="text-aloe-10">Pending Confirmation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES SECTION (Light Canvas) */}
      <section id="features" className="bg-canvas-cream text-ink py-24 px-6 border-t border-black/5">
        <div className="flex flex-col gap-8 items-center max-w-7xl mx-auto w-full">
          {/* Section Header */}
          <div className="flex flex-col gap-3 items-center text-center max-w-3xl">
            <Badge variant="mint">Platform Features</Badge>
            <h2 className="text-3xl md:text-display-md tracking-tight font-light text-ink">
              Everything you need to automate your boutique.
            </h2>
            <p className="text-body-md text-shade-60">
              Designed specifically for Bangladeshi online clothing stores to eliminate daily inbox order management chaos.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {/* Feature 1: Branded Storefront */}
            <div className="flex flex-col justify-between bg-canvas-light text-ink border border-hairline-light rounded-xl p-8 transition-all duration-200">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <div className="p-3 bg-aloe-10/20 rounded-full w-fit text-emerald-800">
                    <ShoppingBagIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-heading-md font-medium text-ink">Branded Storefront</h3>
                </div>
                <p className="text-body-md text-shade-60 leading-relaxed mt-2">
                  Get a dedicated web address like <code className="bg-shade-30 text-ink px-1.5 py-0.5 rounded font-mono text-sm">nihas.shopnest.com.bd</code>. Present your catalog beautifully and professionally.
                </p>
              </div>
            </div>

            {/* Feature 2: Structured Payments */}
            <div className="flex flex-col justify-between bg-canvas-light text-ink border border-hairline-light rounded-xl p-8 transition-all duration-200">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <div className="p-3 bg-aloe-10/20 rounded-full w-fit text-emerald-800">
                    <CreditCardIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-heading-md font-medium text-ink">Structured Payments</h3>
                </div>
                <p className="text-body-md text-shade-60 leading-relaxed mt-2">
                  Let customers enter their bKash/Nagad transaction ID directly at checkout. Stop hunting down receipt screenshots in chat threads.
                </p>
              </div>
            </div>

            {/* Feature 3: Stock Sync & Alerts */}
            <div className="flex flex-col justify-between bg-canvas-light text-ink border border-hairline-light rounded-xl p-8 transition-all duration-200">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <div className="p-3 bg-aloe-10/20 rounded-full w-fit text-emerald-800">
                    <LayersIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-heading-md font-medium text-ink">Stock Sync & Alerts</h3>
                </div>
                <p className="text-body-md text-shade-60 leading-relaxed mt-2">
                  Keep inventory accurate with live stock displays. Get automatic SMS notifications when stock levels are running low.
                </p>
              </div>
            </div>

            {/* Feature 4: Mobile Dashboard */}
            <div className="flex flex-col justify-between bg-canvas-light text-ink border border-hairline-light rounded-xl p-8 transition-all duration-200">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <div className="p-3 bg-aloe-10/20 rounded-full w-fit text-emerald-800">
                    <SmartphoneIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-heading-md font-medium text-ink">Mobile Dashboard</h3>
                </div>
                <p className="text-body-md text-shade-60 leading-relaxed mt-2">
                  Manage everything on the go. Update order statuses, confirm customer payments, and modify listings directly from your phone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRICING SECTION (Dark Canvas) */}
      <section id="pricing" className="bg-canvas-night text-on-primary py-24 px-6 border-t border-white/5">
        <div className="flex flex-col gap-8 items-center max-w-7xl mx-auto w-full">
          {/* Section Header */}
          <div className="flex flex-col gap-3 items-center text-center max-w-3xl">
            <Badge variant="mint">Pricing Plans</Badge>
            <h2 className="text-3xl md:text-display-md tracking-tight font-light text-on-primary">
              Grow your boutique, stress-free.
            </h2>
            <p className="text-body-md text-shade-40">
              Start with a 7-day free trial. Choose the monthly plan that matches your order volume when you are ready.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
            {plans.map((p) => {
              const priceTaka = Math.floor(p.pricePaisa / 100)
              const featuresList = [
                p.features.max_products ? `Up to ${p.features.max_products} active products` : "Unlimited active products",
                p.features.max_orders_per_month ? `${p.features.max_orders_per_month} orders per month` : "Unlimited orders per month",
                p.features.max_categories ? `Up to ${p.features.max_categories} categories` : "Unlimited categories",
                p.features.discount_codes ? "Custom discount codes" : null,
                p.features.telegram_notifications ? "Telegram notifications" : null,
                p.features.cod ? "Cash on Delivery (COD)" : null,
                p.slug === "starter" ? "Branded subdomain storefront" : "Everything in Starter",
                p.slug === "starter" ? "Mobile merchant dashboard" : null,
              ].filter(Boolean)

              const isGrowth = p.slug === "growth"

              return (
                <div key={p.id} className="flex flex-col justify-between bg-[#0f0f0f] border border-white/10 rounded-xl p-8 relative transition-all duration-200">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      {isGrowth ? (
                        <Badge variant="mint" className="bg-aloe-10 text-ink self-start">Most Popular</Badge>
                      ) : (
                        <Badge variant="outline" className="border-white/20 text-on-primary self-start">7-Day Free Trial</Badge>
                      )}
                      <h3 className="text-heading-xl font-medium text-on-primary">{p.name}</h3>
                      <p className="text-caption text-shade-40">
                        {p.slug === "starter" && "Ideal for growing home-based clothing boutiques"}
                        {p.slug === "growth" && "For scaling retail brands and high-volume boutiques"}
                        {p.slug === "pro" && "Enterprise-grade power and ultimate scaling"}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 w-full mt-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-semibold text-on-primary">৳{priceTaka}</span>
                        <span className="text-shade-40 text-caption">/ month</span>
                      </div>

                      <ul className="flex flex-col border-t border-white/10 mt-4 text-body-md text-shade-30">
                        {featuresList.map((f, i) => (
                          <li key={i} className="py-3.5 border-b border-white/10">
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="pt-8">
                    {isGrowth ? (
                      <Button variant="ghost" className="w-full bg-on-primary text-primary hover:bg-on-primary/90 active:bg-shade-30 font-semibold focus-visible:ring-on-primary focus-visible:ring-offset-canvas-night" asChild>
                        <Link href={`/register?plan=${p.slug}`}>Start Free Trial</Link>
                      </Button>
                    ) : (
                      <Button variant="outline-dark" className="w-full" asChild>
                        <Link href={`/register?plan=${p.slug}`}>Start Free Trial</Link>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4. FAQ SECTION (Cream-Mint Canvas) */}
      <section id="faq" className="bg-canvas-cream text-ink pb-24 px-6 border-t border-black/5">
        <div className="flex flex-col gap-8 items-center max-w-7xl mx-auto w-full pt-16">
          {/* Section Header */}
          <div className="flex flex-col gap-3 items-center text-center max-w-3xl">
            <Badge variant="shade">Common Questions</Badge>
            <h2 className="text-3xl md:text-display-md tracking-tight font-light text-ink">
              Frequently Asked Questions
            </h2>
            <p className="text-body-md text-shade-60">
              Clear answers to help you start automating your boutique shop.
            </p>
          </div>

          {/* Interactive Accordion */}
          <FaqAccordion />
        </div>
      </section>
    </div>
  )
}
