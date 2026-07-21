import { Suspense } from "react"
import { db } from "@/db"
import { merchantThemes, merchants } from "@/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getMerchantByOwnerId } from "@/db/queries/merchants"
import VisualEditor from "./components/VisualEditor"

async function EditorContent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  const merchant = await getMerchantByOwnerId(session.user.id)
  if (!merchant) {
    redirect("/onboarding")
  }

  const merchantId = merchant.id

  // Ensure merchant theme exists
  let themeData = await db.query.merchantThemes.findFirst({
    where: eq(merchantThemes.merchantId, merchantId),
  })

  if (!themeData) {
    // Default to 'elegance' if not set
    await db.insert(merchantThemes).values({
      merchantId,
      themeId: "elegance",
      activeLayout: [],
    })
    
    themeData = {
      merchantId,
      themeId: "elegance",
      activeLayout: [],
    }
  }
  
  // merchant is already fetched above
  const previewUrl = merchant ? `http://${merchant.subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'}?preview=true` : ''

  return <VisualEditor initialLayout={themeData.activeLayout as any} previewUrl={previewUrl} />
}

export default function EditorPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading Editor...</div>}>
        <EditorContent />
      </Suspense>
    </div>
  )
}
