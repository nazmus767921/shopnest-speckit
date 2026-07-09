import React from "react"
import { Lock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function PlanUpsellBanner() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8 border border-border rounded-lg bg-card text-foreground">
      <div className="p-4 bg-muted rounded-full mb-5">
        <Lock className="h-8 w-8 text-foreground stroke-1.5" />
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">
        Discount Codes — Premium Feature
      </h2>

      <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-8">
        Create and share promotional codes to drive sales and reward loyal customers. This feature
        is available on the{" "}
        <span className="font-semibold text-foreground">Growth &amp; Pro plans</span>.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl mb-10">
        {[
          { title: "Fixed Amount Codes", desc: "e.g. ৳200 off any order" },
          { title: "Percentage Discounts", desc: "e.g. 15% off total" },
          { title: "Usage Limits & Expiry", desc: "Control reach & validity" },
        ].map((item) => (
          <div
            key={item.title}
            className="p-4 border border-border rounded-lg bg-muted/10 text-left"
          >
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>

      <Link href="/dashboard/billing">
        <Button size="md" className="flex items-center gap-2 rounded-md">
          <span>View Billing &amp; Plans</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  )
}
