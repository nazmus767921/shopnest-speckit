import { Suspense } from "react"
import LoginForm from "./login-form"

interface PageProps {
  params: Promise<{ subdomain: string }>
}

export default async function LoginPage({ params }: PageProps) {
  const { subdomain } = await params

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center p-4 md:p-8">
      <Suspense fallback={<div className="text-sm text-gray-500">Loading sign in form...</div>}>
        <LoginForm subdomain={subdomain} />
      </Suspense>
    </main>
  )
}
