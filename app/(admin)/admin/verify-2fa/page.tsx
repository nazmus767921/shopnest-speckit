import React from "react"
import { Verify2FAClient } from "./Verify2FAClient"

export default async function Verify2FAPage() {
  return (
    <div className="min-h-screen bg-canvas-cream text-ink flex items-center justify-center p-6 font-sans">
      <Verify2FAClient />
    </div>
  )
}
