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

    // Get merchant and subscription context from Redis cache (or fallback to DB)
    const { getProxyContext } = await import("@/lib/redis/proxy-cache")
    const { merchant, subscription } = await getProxyContext(subdomain)

    // Storefront Routing Fallbacks
    if (!merchant) {
      url.pathname = "/store-not-found"
      return NextResponse.rewrite(url)
    }

    // Check for IP bans (T007)
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1"
    const cleanIp = ip.split(",")[0].trim()
    const { isIpBanned } = await import("@/db/queries/customers")
    const banned = await isIpBanned(merchant.id, cleanIp)
    if (banned) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Access Denied | ShopNest</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f9fafb;">
            <div style="max-width: 440px; width: 100%; margin: 20px; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 20px;">🚫</div>
              <h1 style="font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 10px;">Access Denied</h1>
              <p style="font-size: 15px; color: #4b5563; line-height: 1.5; margin-bottom: 24px;">This store has restricted access from your IP address. If you believe this is an error, please contact the store owner.</p>
              <div style="height: 1px; background: #f3f4f6; margin-bottom: 20px;"></div>
              <div style="font-size: 12px; color: #9ca3af; font-family: monospace;">Status Code: 403 Forbidden</div>
            </div>
          </body>
        </html>`,
        {
          status: 403,
          headers: { "content-type": "text/html" },
        }
      )
    }

    if (merchant.subscriptionStatus === "suspended") {
      url.pathname = "/store-suspended"
      return NextResponse.rewrite(url)
    }

    const now = new Date()

    if (subscription && subscription.currentPeriodEnd && subscription.currentPeriodEnd < now) {
      url.pathname = "/store-suspended"
      return NextResponse.rewrite(url)
    } else if (!subscription && merchant.trialExpiry && merchant.trialExpiry < now) {
      url.pathname = "/store-suspended"
      return NextResponse.rewrite(url)
    }

    // Check for owner template preview override
    let activeTemplate = merchant.template || "general"
    let isPreview = false
    const templatePreview = url.searchParams.get("template_preview")
    if (templatePreview) {
      const session = await auth.api.getSession({
        headers: request.headers,
      })
      if (session?.user && session.user.id === merchant.ownerId) {
        activeTemplate = templatePreview
        isPreview = true
      }
    }

    // For valid subdomains, rewrite to the dynamic storefront path
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-merchant-id", merchant.id)
    requestHeaders.set("x-merchant-name", merchant.name)
    requestHeaders.set("x-merchant-subdomain", merchant.subdomain)
    requestHeaders.set("x-merchant-template", merchant.template || "general")
    if (isPreview && templatePreview) {
      requestHeaders.set("x-template-preview", templatePreview)
    }

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
