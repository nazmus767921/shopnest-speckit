import React from "react"
import { Setup2FAClient } from "./Setup2FAClient"

export default async function Setup2FAPage() {
  return (
    <div className="min-h-screen bg-canvas-cream text-ink flex items-center justify-center p-6 font-sans">
      <Setup2FAClient />
    </div>
  )
}
