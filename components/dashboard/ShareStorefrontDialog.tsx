"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { CopyIcon, CheckIcon, FacebookIcon, TwitterXIcon, LinkedInIcon, InstagramIcon } from "@/lib/icons"

interface ShareStorefrontDialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  storefrontUrl: string
}

export function ShareStorefrontDialog({ isOpen, setIsOpen, storefrontUrl }: ShareStorefrontDialogProps) {
  const [copied, setCopied] = useState(false)
  const [instagramAlert, setInstagramAlert] = useState(false)

  const shareText = `Check out my new clothing boutique store on ShopNest! 🛍️✨`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(storefrontUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const shares = [
    {
      name: "Facebook",
      icon: FacebookIcon,
      color: "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storefrontUrl)}`,
    },
    {
      name: "X (Twitter)",
      icon: TwitterXIcon,
      color: "hover:bg-zinc-50 hover:text-black hover:border-zinc-300",
      href: `https://x.com/intent/tweet?url=${encodeURIComponent(storefrontUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: "LinkedIn",
      icon: LinkedInIcon,
      color: "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(storefrontUrl)}`,
    },
    {
      name: "Instagram",
      icon: InstagramIcon,
      color: "hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200",
      onClick: () => {
        handleCopyLink()
        setInstagramAlert(true)
      },
    },
  ]

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Storefront</DialogTitle>
            <DialogDescription>
              Share your boutique link across social platforms to start receiving orders.
            </DialogDescription>
          </DialogHeader>

          {/* Link Copy Bar */}
          <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted">
            <span className="text-sm text-muted-foreground font-mono truncate grow select-all pl-1.5">
              {storefrontUrl}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0 p-2 min-h-9 w-9 rounded-full flex items-center justify-center cursor-pointer border border-border bg-background hover:bg-accent"
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 text-emerald-800" />
              ) : (
                <CopyIcon className="h-4 w-4 text-foreground" />
              )}
            </Button>
          </div>

          {/* Social Platforms Grid */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            {shares.map((social) => {
              const Icon = social.icon
              return social.href ? (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2.5 p-3 rounded-lg border border-border bg-background text-foreground text-sm font-semibold transition-all duration-200 cursor-pointer ${social.color}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{social.name}</span>
                </a>
              ) : (
                <button
                  key={social.name}
                  onClick={social.onClick}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border border-border bg-background text-foreground text-sm font-semibold transition-all duration-200 cursor-pointer text-left ${social.color}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{social.name}</span>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={instagramAlert} onOpenChange={setInstagramAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Link Copied to Clipboard!</AlertDialogTitle>
            <AlertDialogDescription>
              Instagram does not support pre-filling post links from external sites. We have successfully copied your boutique storefront URL to your clipboard so you can paste it directly into your bio, post description, or stories. Click 'Proceed' to open Instagram.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setInstagramAlert(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setInstagramAlert(false)
                window.open("https://www.instagram.com", "_blank", "noopener,noreferrer")
              }}
            >
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
