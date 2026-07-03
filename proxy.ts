import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth/auth"
import { getMerchantBySubdomain, getMerchantByOwnerId } from "@/db/queries/merchants"

// Exclude standard Next.js folders, assets, and APIs from proxy routing
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}

import { rootDomain } from "@/lib/config"

function getSubdomain(hostname: string): string | null {
  const host = hostname.split(":")[0]
  const parts = host.split(".")

  // Handle local development
  if (host.endsWith("localhost")) {
    if (parts.length > 1) {
      return parts[0]
    }
    return null
  }

  // Handle production domain
  if (host.endsWith(rootDomain)) {
    const rootParts = rootDomain.split(".")
    const subdomainParts = parts.slice(0, parts.length - rootParts.length)
    if (subdomainParts.length > 0) {
      return subdomainParts.join(".")
    }
    return null
  }

  // Auto-detect for Vercel preview/branch URLs, e.g. test-store.shopwire.vercel.app
  if (host.endsWith("vercel.app") && rootDomain !== "vercel.app") {
    if (parts.length > 3) {
      return parts.slice(0, parts.length - 3).join(".")
    }
    if (parts.length > 2) {
      return parts.slice(0, parts.length - 2).join(".")
    }
  }

  return null
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get("host") || ""
  const pathname = url.pathname

  // Get subdomain (ignore 'www' as a subdomain)
  const subdomain = getSubdomain(hostname)
  const isSubdomain = subdomain && subdomain !== "www"

  // 1. Handling Subdomain Requests (Storefront)
  if (isSubdomain) {
    // Prevent access to onboarding, dashboard, or admin pages on subdomains; redirect to main domain
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/onboarding")
    ) {
      const mainHost = url.port ? `localhost:${url.port}` : rootDomain
      const redirectUrl = new URL(pathname, `${url.protocol}//${mainHost}`)
      return NextResponse.redirect(redirectUrl)
    }

    // Don't intercept auth-specific paths (like api/auth)
    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next()
    }

    // Query database for merchant by subdomain
    const merchant = await getMerchantBySubdomain(subdomain)

    // Storefront Routing Fallbacks
    if (!merchant) {
      url.pathname = "/store-not-found"
      return NextResponse.rewrite(url)
    }

    if (merchant.subscriptionStatus === "suspended") {
      url.pathname = "/store-suspended"
      return NextResponse.rewrite(url)
    }

    const { getSubscriptionByMerchantId } = await import("@/db/queries/subscriptions")
    const subscription = await getSubscriptionByMerchantId(merchant.id)
    const now = new Date()

    if (subscription && subscription.currentPeriodEnd && subscription.currentPeriodEnd < now) {
      url.pathname = "/store-suspended"
      return NextResponse.rewrite(url)
    } else if (!subscription && merchant.trialExpiry && merchant.trialExpiry < now) {
      url.pathname = "/store-suspended"
      return NextResponse.rewrite(url)
    }

    // For valid subdomains, rewrite to the dynamic storefront path
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-merchant-id", merchant.id)
    requestHeaders.set("x-merchant-name", merchant.name)
    requestHeaders.set("x-merchant-subdomain", merchant.subdomain)

    url.pathname = `/${subdomain}${pathname}`
    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    })
  }

  // 2. Handling Main Domain Requests (Marketing & Merchant Dashboard & Admin)
  
  // Guard dashboard, admin, onboarding, and auth pages
  const isDashboardRoute = pathname.startsWith("/dashboard")
  const isAdminRoute = pathname.startsWith("/admin")
  const isOnboardingRoute = pathname.startsWith("/onboarding")
  const isAuthRoute = pathname === "/login" || pathname === "/register"

  if (isDashboardRoute || isAdminRoute || isOnboardingRoute || isAuthRoute) {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    const loggedIn = !!session?.user

    // Route Guards for Non-authenticated users
    if (!loggedIn) {
      if (isDashboardRoute || (isAdminRoute && pathname !== "/admin/verify-2fa") || isOnboardingRoute) {
        url.pathname = "/login"
        return NextResponse.redirect(url)
      }
      return NextResponse.next()
    }

    // Logged in user: Fetch store details
    const isAdmin = session.user.role === "admin" || session.user.email === "admin@shopnest.com.bd"
    const merchant = await getMerchantByOwnerId(session.user.id)
    const hasStore = !!merchant

    // Route Guards for Authenticated users
    if (isAuthRoute) {
      if (isAdmin) {
        url.pathname = "/admin"
      } else {
        url.pathname = hasStore ? "/dashboard" : "/onboarding"
      }
      return NextResponse.redirect(url)
    }

    if (isOnboardingRoute) {
      if (isAdmin) {
        url.pathname = "/admin"
        return NextResponse.redirect(url)
      }
      // If store is already set up, redirect onboarding visitors to dashboard
      if (hasStore) {
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
      return NextResponse.next()
    }

    if (isDashboardRoute) {
      if (isAdmin) {
        url.pathname = "/admin"
        return NextResponse.redirect(url)
      }
      // If visiting dashboard but has no store, redirect to onboarding
      if (!hasStore) {
        url.pathname = "/onboarding"
        return NextResponse.redirect(url)
      }
      return NextResponse.next()
    }

    if (isAdminRoute) {
      // If visiting verify-2fa but already logged in, redirect to admin index
      if (pathname === "/admin/verify-2fa") {
        url.pathname = "/admin"
        return NextResponse.redirect(url)
      }

      // Enforce admin permission
      if (!isAdmin) {
        return new Response("Forbidden: Access restricted to platform admins.", {
          status: 403,
        })
      }

      // Force 2FA setup if not enabled yet
      const has2FA = session.user.twoFactorEnabled === true
      if (!has2FA && pathname !== "/admin/setup-2fa") {
        url.pathname = "/admin/setup-2fa"
        return NextResponse.redirect(url)
      }

      return NextResponse.next()
    }
  }

  // Allow other main domain requests (marketing pages)
  return NextResponse.next()
}
