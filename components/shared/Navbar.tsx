"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui"
import { Menu, X } from "lucide-react"
import { Sheet } from "@/components/ui/layout/Sheet"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 bg-canvas-night/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo brand */}
        <Link href="/" className="text-heading-lg font-medium tracking-tight text-on-primary flex items-center">
          Shop<span className="text-aloe-10">Nest</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="#features" className="text-body-md text-shade-40 hover:text-on-primary transition-colors duration-200">
            Features
          </Link>
          <Link href="#pricing" className="text-body-md text-shade-40 hover:text-on-primary transition-colors duration-200">
            Pricing
          </Link>
          <Link href="#faq" className="text-body-md text-shade-40 hover:text-on-primary transition-colors duration-200">
            FAQ
          </Link>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" size="sm" as={Link} href="/login" className="text-on-primary hover:text-on-primary/85">
            Log in
          </Button>
          <Button variant="outline-dark" size="sm" as={Link} href="/register">
            Start Free Trial
          </Button>
        </div>

        {/* Mobile hamburger menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-shade-40 hover:text-on-primary transition-colors duration-200 cursor-pointer focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      <Sheet isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} side="right">
        <div className="flex flex-col gap-4 w-full p-4">
          <Link
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-body-md text-shade-40 hover:text-ink transition-colors duration-200 py-2 border-b border-hairline-light"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="text-body-md text-shade-40 hover:text-ink transition-colors duration-200 py-2 border-b border-hairline-light"
          >
            Pricing
          </Link>
          <Link
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="text-body-md text-shade-40 hover:text-ink transition-colors duration-200 py-2 border-b border-hairline-light"
          >
            FAQ
          </Link>
          <div className="flex flex-col gap-3 pt-4">
            <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => setMobileMenuOpen(false)} as={Link} href="/login">
              Log in
            </Button>
            <Button variant="primary" size="sm" className="w-full justify-center text-on-primary bg-primary border-primary" onClick={() => setMobileMenuOpen(false)} as={Link} href="/register">
              Start Free Trial
            </Button>
          </div>
        </div>
      </Sheet>
    </header>
  )
}
