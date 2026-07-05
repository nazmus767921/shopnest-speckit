"use client"

import React, { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { storeSettingsSchema } from "@/lib/validations/settings"
import { updateStoreSettingsAction } from "@/app/actions/settings"
import { Button } from "@/components/ui/primitives/Button"
import { Input } from "@/components/ui/primitives/Input"
import { FormLabel } from "@/components/ui/primitives/FormLabel"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/layout/Card"
import { CheckCircle2, AlertCircle, Save, Lock, Smartphone, Landmark, Sliders, LayoutTemplate, Trash2, Plus, UploadCloud, X, Truck, Bell } from "lucide-react"
import { z } from "zod"
import { storefrontLayoutSchema } from "@/lib/validations/storefront"
import { updateStorefrontLayoutAction } from "@/app/actions/settings"
import { ShippingDeliveryTab } from "./ShippingDeliveryTab"
import { NotificationsTab } from "./NotificationsTab"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/feedback/Toast"
import type { ResolvedPlan } from "@/lib/plans/types"

interface Merchant {
  id: string
  name: string
  subdomain: string
  phoneNumber: string | null
  bkashNumber: string | null
  nagadNumber: string | null
  lowStockThresholdDefault: number
  plan: string
  subscriptionStatus: string
  heroImageUrl?: string | null
  subtitle?: string | null
  storeDescription?: string | null
  storeAddress?: string | null
  socialLinks?: Record<string, string> | null
  customFaqs?: Array<{ question: string; answer: string }> | null
  telegramChatId?: string | null
  codEnabled?: boolean
  payDeliveryChargeFirst?: boolean
  bkashWalletNumber?: string | null
  nagadWalletNumber?: string | null
}

interface StoreSettingsFormProps {
  merchant: Merchant
  shippingZones: Array<{
    id: string
    name: string
    deliveryChargePaisa: number
    freeShippingThresholdPaisa: number | null
    districts: Array<{
      id: string
      division: string
      district: string
    }>
  }>
  plan: ResolvedPlan | null
}

type Tab = "profile" | "payments" | "inventory" | "storefront" | "shipping" | "notifications"

// Specialized sub-schemas derived from main schema shape
const profileSchema = z.object({
  name: storeSettingsSchema.shape.name,
  phoneNumber: storeSettingsSchema.shape.phoneNumber,
})

const paymentsSchema = z.object({
  bkashNumber: storeSettingsSchema.shape.bkashNumber,
  nagadNumber: storeSettingsSchema.shape.nagadNumber,
  codEnabled: storeSettingsSchema.shape.codEnabled,
  payDeliveryChargeFirst: storeSettingsSchema.shape.payDeliveryChargeFirst,
  bkashWalletNumber: storeSettingsSchema.shape.bkashWalletNumber,
  nagadWalletNumber: storeSettingsSchema.shape.nagadWalletNumber,
})

const inventorySchema = z.object({
  lowStockThresholdDefault: storeSettingsSchema.shape.lowStockThresholdDefault,
})

export function StoreSettingsForm({ merchant, shippingZones, plan }: StoreSettingsFormProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile")



  // Hero Image upload state
  const [heroFile, setHeroFile] = useState<File | null>(null)
  const [heroPreviewUrl, setHeroPreviewUrl] = useState<string | null>(merchant.heroImageUrl || null)

  // Parse default values for storefront layout
  const initialSocials = {
    facebook: "",
    instagram: "",
    whatsapp: "",
    tiktok: "",
    ...(merchant.socialLinks || {}),
  }

  const initialFaqs: Array<{ question: string; answer: string }> = merchant.customFaqs || []

  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size exceeds the 2 MB limit.")
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type. Only images are allowed.")
      return
    }

    setHeroFile(file)
    setHeroPreviewUrl(URL.createObjectURL(file))
  }

  // Storefront Form setup
  const storefrontForm = useForm({
    defaultValues: {
      subtitle: merchant.subtitle || "",
      storeDescription: merchant.storeDescription || "",
      storeAddress: merchant.storeAddress || "",
      socialLinks: initialSocials,
      customFaqs: initialFaqs,
      theme: (merchant as any).theme || "default",
    },
    onSubmit: async ({ value }) => {

      try {
        let finalHeroUrl = heroPreviewUrl

        // If a new hero image file is staged, upload it first
        if (heroFile) {
          const fileExt = heroFile.name.split(".").pop()
          const filePath = `merchant-assets/${merchant.id}/hero.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from("merchant-assets")
            .upload(filePath, heroFile, {
              cacheControl: "3600",
              upsert: true,
            })

          if (uploadError) {
            throw new Error(`Hero image upload failed: ${uploadError.message}`)
          }

          finalHeroUrl = supabase.storage
            .from("merchant-assets")
            .getPublicUrl(filePath)
            .data.publicUrl
        }

        const payload = {
          heroImageUrl: finalHeroUrl,
          subtitle: value.subtitle || null,
          storeDescription: value.storeDescription || null,
          storeAddress: value.storeAddress || null,
          socialLinks: value.socialLinks,
          customFaqs: value.customFaqs,
          theme: value.theme || "default",
        }

        // Validate payload using Zod storefrontLayoutSchema
        const validation = storefrontLayoutSchema.safeParse(payload)
        if (!validation.success) {
          throw new Error(validation.error.issues[0].message)
        }

        const result = await updateStorefrontLayoutAction(payload)
        if (result.success) {
          toast.success("Storefront layout saved successfully.")
          setHeroFile(null) // clear staged file
        } else {
          throw new Error(result.error || "Failed to save storefront layout settings.")
        }
      } catch (err: any) {
        toast.error(err.message || "An unexpected error occurred.")
      }
    },
  })

  // 1. Profile Form setup
  const profileForm = useForm({
    defaultValues: {
      name: merchant.name,
      phoneNumber: merchant.phoneNumber || "",
    },
    onSubmit: async ({ value }) => {
      const validation = profileSchema.safeParse(value)
      if (!validation.success) {
        toast.error(validation.error.issues[0].message)
        return
      }

      // Build full save payload retaining other merchant fields
      const payload = {
        name: value.name,
        phoneNumber: value.phoneNumber || null,
        bkashNumber: merchant.bkashNumber || null,
        nagadNumber: merchant.nagadNumber || null,
        lowStockThresholdDefault: merchant.lowStockThresholdDefault,
      }

      const result = await updateStoreSettingsAction(payload)
      if (result.success) {
        toast.success("Store profile saved successfully.")
      } else {
        toast.error(result.error || "Failed to save profile settings.")
      }
    },
  })

  // 2. Payments Form setup
  const paymentsForm = useForm({
    defaultValues: {
      bkashNumber: merchant.bkashNumber || "",
      nagadNumber: merchant.nagadNumber || "",
      codEnabled: merchant.codEnabled ?? false,
      payDeliveryChargeFirst: merchant.payDeliveryChargeFirst ?? false,
      bkashWalletNumber: merchant.bkashWalletNumber || "",
      nagadWalletNumber: merchant.nagadWalletNumber || "",
    },
    onSubmit: async ({ value }) => {
      const validation = paymentsSchema.safeParse(value)
      if (!validation.success) {
        toast.error(validation.error.issues[0].message)
        return
      }

      const payload = {
        name: merchant.name,
        phoneNumber: merchant.phoneNumber || null,
        bkashNumber: value.bkashNumber || null,
        nagadNumber: value.nagadNumber || null,
        lowStockThresholdDefault: merchant.lowStockThresholdDefault,
        codEnabled: value.codEnabled,
        payDeliveryChargeFirst: value.payDeliveryChargeFirst,
        bkashWalletNumber: value.bkashWalletNumber || null,
        nagadWalletNumber: value.nagadWalletNumber || null,
      }

      const result = await updateStoreSettingsAction(payload)
      if (result.success) {
        toast.success("Payment details saved successfully.")
      } else {
        toast.error(result.error || "Failed to save payment details.")
      }
    },
  })

  // 3. Inventory Form setup
  const inventoryForm = useForm({
    defaultValues: {
      lowStockThresholdDefault: merchant.lowStockThresholdDefault,
    },
    onSubmit: async ({ value }) => {
      const validation = inventorySchema.safeParse(value)
      if (!validation.success) {
        toast.error(validation.error.issues[0].message)
        return
      }

      const payload = {
        name: merchant.name,
        phoneNumber: merchant.phoneNumber || null,
        bkashNumber: merchant.bkashNumber || null,
        nagadNumber: merchant.nagadNumber || null,
        lowStockThresholdDefault: value.lowStockThresholdDefault,
      }

      const result = await updateStoreSettingsAction(payload)
      if (result.success) {
        toast.success("Inventory preferences saved successfully.")
      } else {
        toast.error(result.error || "Failed to save inventory settings.")
      }
    },
  })

  return (
    <div className="flex flex-col md:flex-row gap-6 lg:gap-8 select-text">
      {/* Settings Navigation Sidebar */}
      <div className="bg-zinc-50 border border-hairline-light rounded-2xl p-2.5 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible shrink-0 w-full md:w-60 lg:w-64 md:sticky md:top-20 self-start scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center justify-between gap-3 px-3.5 py-2 text-caption transition-all duration-200 cursor-pointer text-left rounded-xl w-full shrink-0 md:shrink ${activeTab === "profile"
            ? "bg-zinc-950 text-white font-semibold"
            : "text-shade-60 hover:text-ink hover:bg-zinc-200/50 font-semibold"
            }`}
        >
          <span className="flex items-center gap-3">
            <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-white ${activeTab === "profile" ? "bg-white/15" : "bg-blue-600"}`}>
              <Smartphone className="h-4 w-4 shrink-0" />
            </span>
            <span>Store Profile</span>
          </span>
          {activeTab === "profile" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center justify-between gap-3 px-3.5 py-2 text-caption transition-all duration-200 cursor-pointer text-left rounded-xl w-full shrink-0 md:shrink ${activeTab === "inventory"
            ? "bg-zinc-950 text-white font-semibold"
            : "text-shade-60 hover:text-ink hover:bg-zinc-200/50 font-semibold"
            }`}
        >
          <span className="flex items-center gap-3">
            <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-white ${activeTab === "inventory" ? "bg-white/15" : "bg-purple-600"}`}>
              <Sliders className="h-4 w-4 shrink-0" />
            </span>
            <span>Inventory</span>
          </span>
          {activeTab === "inventory" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`flex items-center justify-between gap-3 px-3.5 py-2 text-caption transition-all duration-200 cursor-pointer text-left rounded-xl w-full shrink-0 md:shrink ${activeTab === "payments"
            ? "bg-zinc-950 text-white font-semibold"
            : "text-shade-60 hover:text-ink hover:bg-zinc-200/50 font-semibold"
            }`}
        >
          <span className="flex items-center gap-3">
            <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-white ${activeTab === "payments" ? "bg-white/15" : "bg-emerald-600"}`}>
              <Landmark className="h-4 w-4 shrink-0" />
            </span>
            <span>Payment Options</span>
          </span>
          {activeTab === "payments" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("shipping")}
          className={`flex items-center justify-between gap-3 px-3.5 py-2 text-caption transition-all duration-200 cursor-pointer text-left rounded-xl w-full shrink-0 md:shrink ${activeTab === "shipping"
            ? "bg-zinc-950 text-white font-semibold"
            : "text-shade-60 hover:text-ink hover:bg-zinc-200/50 font-semibold"
            }`}
        >
          <span className="flex items-center gap-3">
            <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-white ${activeTab === "shipping" ? "bg-white/15" : "bg-orange-500"}`}>
              <Truck className="h-4 w-4 shrink-0" />
            </span>
            <span>Shipping & Delivery</span>
          </span>
          {activeTab === "shipping" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("storefront")}
          className={`flex items-center justify-between gap-3 px-3.5 py-2 text-caption transition-all duration-200 cursor-pointer text-left rounded-xl w-full shrink-0 md:shrink ${activeTab === "storefront"
            ? "bg-zinc-950 text-white font-semibold"
            : "text-shade-60 hover:text-ink hover:bg-zinc-200/50 font-semibold"
            }`}
        >
          <span className="flex items-center gap-3">
            <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-white ${activeTab === "storefront" ? "bg-white/15" : "bg-indigo-600"}`}>
              <LayoutTemplate className="h-4 w-4 shrink-0" />
            </span>
            <span>Storefront Layout</span>
          </span>
          {activeTab === "storefront" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center justify-between gap-3 px-3.5 py-2 text-caption transition-all duration-200 cursor-pointer text-left rounded-xl w-full shrink-0 md:shrink ${activeTab === "notifications"
            ? "bg-zinc-950 text-white font-semibold"
            : "text-shade-60 hover:text-ink hover:bg-zinc-200/50 font-semibold"
            }`}
        >
          <span className="flex items-center gap-3">
            <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-white ${activeTab === "notifications" ? "bg-white/15" : "bg-red-500"}`}>
              <Bell className="h-4 w-4 shrink-0" />
            </span>
            <span>Notifications</span>
          </span>
          {activeTab === "notifications" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
        </button>
      </div>

      {/* Settings Content Area */}
      <div className="flex-1 min-w-0 transition-all duration-300">
        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              profileForm.handleSubmit()
            }}
            className="animate-fade-in"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Bento Card 1: Store Profile Info */}
              <Card variant="default" className="lg:col-span-8 p-6 sm:p-8 flex flex-col gap-6 rounded-2xl">
                <CardHeader className="p-0 border-b border-hairline-light pb-4">
                  <CardTitle className="text-heading-md font-bold text-ink">Store Profile</CardTitle>
                  <CardDescription className="text-caption text-shade-50 mt-1">
                    Basic information about your store shown to customers on your storefront.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0 flex flex-col gap-5">
                  {/* Store Name Input */}
                  <profileForm.Field name="name">
                    {(field) => (
                      <div className="flex flex-col gap-1.5">
                        <FormLabel htmlFor="store-name">
                          Store Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <Input
                          id="store-name"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="e.g. Niha's Boutique"
                          className="bg-canvas-cream/40 border-hairline-light focus:border-ink rounded-lg"
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-micro text-red-500">{String(field.state.meta.errors[0])}</p>
                        )}
                      </div>
                    )}
                  </profileForm.Field>

                  {/* Store Phone Number Input */}
                  <profileForm.Field name="phoneNumber">
                    {(field) => (
                      <div className="flex flex-col gap-1.5">
                        <FormLabel htmlFor="phone-number">Store Phone Number</FormLabel>
                        <Input
                          id="phone-number"
                          type="tel"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="e.g. 01700000000"
                          className="bg-canvas-cream/40 border-hairline-light focus:border-ink rounded-lg"
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-micro text-red-500">{String(field.state.meta.errors[0])}</p>
                        )}
                      </div>
                    )}
                  </profileForm.Field>
                </CardContent>

                <CardFooter className="p-0 justify-end border-t border-hairline-light pt-4">
                  <profileForm.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 w-full sm:w-auto rounded-full"
                      >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? "Saving Profile…" : "Save Profile Settings"}
                      </Button>
                    )}
                  </profileForm.Subscribe>
                </CardFooter>
              </Card>

              {/* Bento Card 2: Permanent Subdomain Lock */}
              <Card variant="default" className="lg:col-span-4 p-6 sm:p-8 flex flex-col gap-5 rounded-2xl bg-zinc-50/50 justify-between">
                <div className="flex flex-col gap-4">
                  <div className="w-10 h-10 bg-zinc-950 text-white rounded-xl flex items-center justify-center shrink-0">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-body-strong font-bold text-ink leading-tight">
                      Permanent Subdomain
                    </span>
                    <p className="text-caption text-shade-50 leading-relaxed">
                      Your storefront URL is permanent and cannot be modified.
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3.5 bg-white border border-hairline-light rounded-xl font-mono text-[11px] font-semibold text-ink break-all text-center">
                  {merchant.subdomain}.shopnest.com.bd
                </div>
              </Card>
            </div>
          </form>
        )}

        {/* Payment Options TAB */}
        {activeTab === "payments" && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              paymentsForm.handleSubmit()
            }}
            className="animate-fade-in"
          >
            <Card variant="default" className="p-6 sm:p-8 flex flex-col gap-6 rounded-2xl">
              <CardHeader className="p-0 border-b border-hairline-light pb-4">
                <CardTitle className="text-heading-md font-bold text-ink">Payment Details</CardTitle>
                <CardDescription className="text-caption text-shade-50 mt-1">
                  Configure the mobile financial service numbers where customers will send manual payments during checkout.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* bKash Wallet Bento Card */}
                  <div className="bg-pink-50/20 border border-pink-100/70 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#d12053] text-white rounded-xl flex items-center justify-center font-bold text-body-md shrink-0">
                        b
                      </div>
                      <div className="flex flex-col">
                        <span className="text-body-strong font-bold text-ink leading-tight">bKash Account</span>
                        <span className="text-[10px] text-pink-700 font-semibold uppercase tracking-wider">Personal Wallet</span>
                      </div>
                    </div>
                    {/* bKash Number */}
                    <paymentsForm.Field name="bkashNumber">
                      {(field) => (
                        <div className="flex flex-col gap-1.5">
                          <FormLabel htmlFor="bkash-number">bKash Wallet Number</FormLabel>
                          <Input
                            id="bkash-number"
                            type="tel"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="e.g. 01700000000"
                            className="bg-white border-hairline-light focus:border-ink rounded-lg"
                          />
                          {field.state.meta.errors.length > 0 && (
                            <p className="text-micro text-red-500">{String(field.state.meta.errors[0])}</p>
                          )}
                        </div>
                      )}
                    </paymentsForm.Field>
                  </div>

                  {/* Nagad Wallet Bento Card */}
                  <div className="bg-orange-50/20 border border-orange-100/70 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#f04f23] text-white rounded-xl flex items-center justify-center font-bold text-body-md shrink-0">
                        n
                      </div>
                      <div className="flex flex-col">
                        <span className="text-body-strong font-bold text-ink leading-tight">Nagad Account</span>
                        <span className="text-[10px] text-orange-700 font-semibold uppercase tracking-wider">Personal Wallet</span>
                      </div>
                    </div>
                    {/* Nagad Number */}
                    <paymentsForm.Field name="nagadNumber">
                      {(field) => (
                        <div className="flex flex-col gap-1.5">
                          <FormLabel htmlFor="nagad-number">Nagad Wallet Number</FormLabel>
                          <Input
                            id="nagad-number"
                            type="tel"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="e.g. 01700000000"
                            className="bg-white border-hairline-light focus:border-ink rounded-lg"
                          />
                          {field.state.meta.errors.length > 0 && (
                            <p className="text-micro text-red-500">{String(field.state.meta.errors[0])}</p>
                          )}
                        </div>
                      )}
                    </paymentsForm.Field>
                  </div>

                  {/* Cash on Delivery Bento Card */}
                  <div className="bg-zinc-50/50 border border-hairline-light rounded-2xl p-5 md:col-span-2 flex flex-col gap-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-zinc-900 text-white rounded-xl flex items-center justify-center font-bold text-body-md shrink-0">
                          C
                        </div>
                        <div className="flex flex-col">
                          <span className="text-body-strong font-bold text-ink leading-tight">Cash on Delivery (COD)</span>
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Storefront Delivery Payment</span>
                        </div>
                      </div>
                      
                      {/* codEnabled Toggle */}
                      <paymentsForm.Field name="codEnabled">
                        {(field) => (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.state.value}
                              disabled={!plan?.features.cod}
                              onChange={(e) => {
                                field.handleChange(e.target.checked)
                                if (!e.target.checked) {
                                  paymentsForm.setFieldValue("payDeliveryChargeFirst", false)
                                }
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-shade-30 rounded-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-canvas-light after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-disabled:opacity-50"></div>
                          </label>
                        )}
                      </paymentsForm.Field>
                    </div>

                    {!plan?.features.cod && (
                      <div className="p-3.5 bg-amber-50 border border-amber-200/50 rounded-xl text-micro text-amber-800 flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>Upgrade your subscription plan to Growth or Pro to enable Cash on Delivery checkout options.</span>
                      </div>
                    )}

                    {plan?.features.cod && (
                      <paymentsForm.Subscribe>
                        {(state) => (
                          <>
                            {state.values.codEnabled && (
                              <div className="border-t border-hairline-light pt-4 flex flex-col gap-4 animate-fade-in">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-caption font-semibold text-ink">Pay Delivery Charge First</span>
                                    <p className="text-micro text-shade-50">Require customers to pay the shipping fee upfront via bKash/Nagad during checkout.</p>
                                  </div>
                                  
                                  {/* payDeliveryChargeFirst Toggle */}
                                  <paymentsForm.Field name="payDeliveryChargeFirst">
                                    {(field) => (
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={field.state.value}
                                          onChange={(e) => field.handleChange(e.target.checked)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-shade-30 rounded-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-canvas-light after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                      </label>
                                    )}
                                  </paymentsForm.Field>
                                </div>

                                {state.values.payDeliveryChargeFirst && (
                                  <div className="bg-canvas-cream/30 border border-hairline-light rounded-xl p-4 flex flex-col gap-4 animate-fade-in">
                                    <span className="text-micro font-bold text-ink uppercase tracking-wider">Merchant Wallet Numbers for Shipping Collection</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <paymentsForm.Field name="bkashWalletNumber">
                                        {(field) => (
                                          <div className="flex flex-col gap-1.5">
                                            <FormLabel htmlFor="bkash-wallet-number">bKash Personal Number</FormLabel>
                                            <Input
                                              id="bkash-wallet-number"
                                              type="tel"
                                              value={field.state.value}
                                              onChange={(e) => field.handleChange(e.target.value)}
                                              onBlur={field.handleBlur}
                                              placeholder="e.g. 01700000000"
                                              className="bg-white border-hairline-light focus:border-ink rounded-lg"
                                            />
                                          </div>
                                        )}
                                      </paymentsForm.Field>
                                      
                                      <paymentsForm.Field name="nagadWalletNumber">
                                        {(field) => (
                                          <div className="flex flex-col gap-1.5">
                                            <FormLabel htmlFor="nagad-wallet-number">Nagad Personal Number</FormLabel>
                                            <Input
                                              id="nagad-wallet-number"
                                              type="tel"
                                              value={field.state.value}
                                              onChange={(e) => field.handleChange(e.target.value)}
                                              onBlur={field.handleBlur}
                                              placeholder="e.g. 01700000000"
                                              className="bg-white border-hairline-light focus:border-ink rounded-lg"
                                            />
                                          </div>
                                        )}
                                      </paymentsForm.Field>
                                    </div>
                                    <p className="text-micro text-shade-40 leading-relaxed">
                                      * These wallet numbers will be displayed to customers during the checkout payment step to submit their shipping fee.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </paymentsForm.Subscribe>
                    )}
                  </div>
                </div>

                <p className="text-micro text-shade-40 leading-relaxed max-w-xl">
                  * Customers will see these numbers at checkout. Ensure they are correct and active to prevent failed payment confirmations.
                </p>
              </CardContent>

              <CardFooter className="p-0 justify-end border-t border-hairline-light pt-4">
                <paymentsForm.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 w-full sm:w-auto rounded-full"
                    >
                      <Save className="h-4 w-4" />
                      {isSubmitting ? "Saving Payment Details…" : "Save Payment Details"}
                    </Button>
                  )}
                </paymentsForm.Subscribe>
              </CardFooter>
            </Card>
          </form>
        )}

        {/* INVENTORY PREFERENCES TAB */}
        {activeTab === "inventory" && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              inventoryForm.handleSubmit()
            }}
            className="animate-fade-in"
          >
            <Card variant="default" className="p-6 sm:p-8 flex flex-col gap-6 rounded-2xl">
              <CardHeader className="p-0 border-b border-hairline-light pb-4">
                <CardTitle className="text-heading-md font-bold text-ink">Inventory Preferences</CardTitle>
                <CardDescription className="text-caption text-shade-50 mt-1">
                  Default settings applied to new products. You can override these per product if needed.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 flex flex-col gap-5">
                <inventoryForm.Field name="lowStockThresholdDefault">
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <FormLabel htmlFor="low-stock-threshold">
                        Default Low Stock Threshold <span className="text-red-500">*</span>
                      </FormLabel>
                      <Input
                        id="low-stock-threshold"
                        type="number"
                        min={0}
                        max={9999}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        onBlur={field.handleBlur}
                        placeholder="5"
                        className="max-w-xs bg-canvas-cream/40 border-hairline-light focus:border-ink font-mono rounded-lg"
                      />
                      <p className="text-micro text-shade-40 leading-relaxed">
                        New products will display a low-stock warning in your dashboard when their quantity drops below this number.
                      </p>
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-micro text-red-500">{String(field.state.meta.errors[0])}</p>
                      )}
                    </div>
                  )}
                </inventoryForm.Field>
              </CardContent>

              <CardFooter className="p-0 justify-end border-t border-hairline-light pt-4">
                <inventoryForm.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 w-full sm:w-auto rounded-full"
                    >
                      <Save className="h-4 w-4" />
                      {isSubmitting ? "Saving Inventory…" : "Save Inventory Preferences"}
                    </Button>
                  )}
                </inventoryForm.Subscribe>
              </CardFooter>
            </Card>
          </form>
        )}
        {activeTab === "storefront" && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              storefrontForm.handleSubmit()
            }}
            className="animate-fade-in"
          >
            <div className="flex flex-col gap-6">
              {/* Card 1: Hero Banner */}
              <Card variant="default" className="p-6 sm:p-8 flex flex-col gap-6 rounded-2xl">
                <CardHeader className="p-0 border-b border-hairline-light pb-4">
                  <CardTitle className="text-heading-md font-bold text-ink">Hero Banner Image</CardTitle>
                  <CardDescription className="text-caption text-shade-50 mt-1">
                    Upload a high-quality cover photo for your storefront banner (max 2 MB). Recommendation: 3:1 aspect ratio.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                  {heroPreviewUrl ? (
                    <div className="relative aspect-3/1 w-full rounded-xl overflow-hidden border border-hairline-light group bg-canvas-cream/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heroPreviewUrl} alt="Hero Banner Preview" className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => {
                          setHeroFile(null)
                          setHeroPreviewUrl(null)
                        }}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors shadow-sm cursor-pointer"
                        title="Remove Image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-3/1 w-full border-2 border-dashed border-hairline-light rounded-xl hover:border-shade-40 transition-colors cursor-pointer bg-canvas-cream/10">
                      <div className="flex flex-col items-center gap-2 text-shade-50 p-4">
                        <UploadCloud className="h-8 w-8 stroke-[1.5]" />
                        <span className="text-caption font-medium">Click or Drag Image to Upload</span>
                        <span className="text-micro text-shade-40">JPG, PNG, WebP up to 2MB</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHeroImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </CardContent>
              </Card>

              {/* Card 2: Storefront Details */}
              <Card variant="default" className="p-6 sm:p-8 flex flex-col gap-6 rounded-2xl">
                <CardHeader className="p-0 border-b border-hairline-light pb-4">
                  <CardTitle className="text-heading-md font-bold text-ink">Storefront Details</CardTitle>
                  <CardDescription className="text-caption text-shade-50 mt-1">
                    Branding description, slogan, and shop address details.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0 flex flex-col gap-5">
                  {/* Storefront Theme Selector */}
                  <storefrontForm.Field name="theme">
                    {(field) => (
                      <div className="flex flex-col gap-1.5">
                        <FormLabel htmlFor="store-theme">Storefront Theme</FormLabel>
                        <select
                          id="store-theme"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          className="bg-canvas-cream/40 border border-hairline-light focus:border-ink rounded-lg p-2.5 text-body-md"
                        >
                          <option value="default">Default (SHOP.CO Bold Stark Theme)</option>
                          <option
                            value="cinematic"
                            disabled={plan?.slug === "starter"}
                          >
                            Cinematic Theme {plan?.slug === "starter" ? "(Upgrade to Growth required)" : ""}
                          </option>
                        </select>
                        {plan?.slug === "starter" && (
                          <span className="text-micro text-amber-600 font-semibold mt-1">
                            Upgrade your plan to Growth or Pro to unlock the premium Cinematic Theme.
                          </span>
                        )}
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-micro text-red-500">{String(field.state.meta.errors[0])}</p>
                        )}
                      </div>
                    )}
                  </storefrontForm.Field>

                  {/* Subtitle Input */}
                  <storefrontForm.Field name="subtitle">
                    {(field) => (
                      <div className="flex flex-col gap-1.5">
                        <FormLabel htmlFor="store-subtitle">Store Subtitle / Slogan</FormLabel>
                        <Input
                          id="store-subtitle"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="e.g. Authentic Handloomed Clothing"
                          className="bg-canvas-cream/40 border-hairline-light focus:border-ink rounded-lg"
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-micro text-red-500">{String(field.state.meta.errors[0])}</p>
                        )}
                      </div>
                    )}
                  </storefrontForm.Field>

                  {/* Store Description Input */}
                  <storefrontForm.Field name="storeDescription">
                    {(field) => (
                      <div className="flex flex-col gap-1.5">
                        <FormLabel htmlFor="store-description">Store Description</FormLabel>
                        <textarea
                          id="store-description"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="Describe your boutique and collections to customers..."
                          className="min-h-24 p-3 bg-canvas-cream/40 border border-hairline-light rounded-lg text-body-md text-ink outline-none focus:ring-1 focus:ring-ink"
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-micro text-red-500">{String(field.state.meta.errors[0])}</p>
                        )}
                      </div>
                    )}
                  </storefrontForm.Field>

                  {/* Store Address Input */}
                  <storefrontForm.Field name="storeAddress">
                    {(field) => (
                      <div className="flex flex-col gap-1.5">
                        <FormLabel htmlFor="store-address">Store Address</FormLabel>
                        <Input
                          id="store-address"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="e.g. Road 12, Banani, Dhaka"
                          className="bg-canvas-cream/40 border-hairline-light focus:border-ink rounded-lg"
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-micro text-red-500">{String(field.state.meta.errors[0])}</p>
                        )}
                      </div>
                    )}
                  </storefrontForm.Field>
                </CardContent>
              </Card>

              {/* Card 3: Social Links */}
              <Card variant="default" className="p-6 sm:p-8 flex flex-col gap-6 rounded-2xl">
                <CardHeader className="p-0 border-b border-hairline-light pb-4">
                  <CardTitle className="text-heading-md font-bold text-ink">Social Links</CardTitle>
                  <CardDescription className="text-caption text-shade-50 mt-1">
                    Connect social channels to display tags in your storefront header and footer.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0 flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <storefrontForm.Field name="socialLinks.facebook">
                      {(field) => (
                        <div className="flex flex-col gap-1.5">
                          <FormLabel htmlFor="social-facebook">Facebook Page URL</FormLabel>
                          <Input
                            id="social-facebook"
                            type="url"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="https://facebook.com/yourpage"
                            className="bg-canvas-cream/40 border-hairline-light focus:border-ink rounded-lg"
                          />
                          {field.state.meta.errors.length > 0 && (
                            <p className="text-micro text-red-500">{String(field.state.meta.errors[0])}</p>
                          )}
                        </div>
                      )}
                    </storefrontForm.Field>

                    <storefrontForm.Field name="socialLinks.instagram">
                      {(field) => (
                        <div className="flex flex-col gap-1.5">
                          <FormLabel htmlFor="social-instagram">Instagram Profile URL</FormLabel>
                          <Input
                            id="social-instagram"
                            type="url"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="https://instagram.com/yourhandle"
                            className="bg-canvas-cream/40 border-hairline-light focus:border-ink rounded-lg"
                          />
                          {field.state.meta.errors.length > 0 && (
                            <p className="text-micro text-red-500">{String(field.state.meta.errors[0])}</p>
                          )}
                        </div>
                      )}
                    </storefrontForm.Field>

                    <storefrontForm.Field name="socialLinks.whatsapp">
                      {(field) => (
                        <div className="flex flex-col gap-1.5">
                          <FormLabel htmlFor="social-whatsapp">WhatsApp Contact Number</FormLabel>
                          <Input
                            id="social-whatsapp"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="e.g. +8801700000000"
                            className="bg-canvas-cream/40 border-hairline-light focus:border-ink rounded-lg"
                          />
                          {field.state.meta.errors.length > 0 && (
                            <p className="text-micro text-red-500">{String(field.state.meta.errors[0])}</p>
                          )}
                        </div>
                      )}
                    </storefrontForm.Field>

                    <storefrontForm.Field name="socialLinks.tiktok">
                      {(field) => (
                        <div className="flex flex-col gap-1.5">
                          <FormLabel htmlFor="social-tiktok">TikTok Profile URL</FormLabel>
                          <Input
                            id="social-tiktok"
                            type="url"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="https://tiktok.com/@yourhandle"
                            className="bg-canvas-cream/40 border-hairline-light focus:border-ink rounded-lg"
                          />
                          {field.state.meta.errors.length > 0 && (
                            <p className="text-micro text-red-500">{String(field.state.meta.errors[0])}</p>
                          )}
                        </div>
                      )}
                    </storefrontForm.Field>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: FAQs */}
              <Card variant="default" className="p-6 sm:p-8 flex flex-col gap-6 rounded-2xl">
                <CardHeader className="p-0 border-b border-hairline-light pb-4">
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <CardTitle className="text-heading-md font-bold text-ink">Frequently Asked Questions</CardTitle>
                      <CardDescription className="text-caption text-shade-50">Create up to 8 custom questions & answers for customers.</CardDescription>
                    </div>
                    <storefrontForm.Subscribe selector={(state) => state.values.customFaqs}>
                      {(faqs = []) => (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={faqs.length >= 8}
                          onClick={() => {
                            storefrontForm.setFieldValue("customFaqs", [
                              ...faqs,
                              { question: "", answer: "" },
                            ])
                          }}
                          className="flex items-center gap-1.5 shrink-0 rounded-full"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add FAQ</span>
                        </Button>
                      )}
                    </storefrontForm.Subscribe>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <storefrontForm.Field name="customFaqs">
                    {(field) => {
                      const faqs = field.state.value || []
                      if (faqs.length === 0) {
                        return (
                          <div className="p-6 border border-dashed border-hairline-light rounded-xl text-center text-caption text-shade-50">
                            No custom FAQs created. Click "Add FAQ" to create your first storefront FAQ.
                          </div>
                        )
                      }

                      return (
                        <div className="flex flex-col gap-4">
                          {faqs.map((faq, index) => (
                            <div key={index} className="flex flex-wrap gap-3 items-start border border-hairline-light p-4 rounded-xl bg-canvas-cream/10 relative">
                              <div className="grow flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                  <label className="text-micro font-bold text-shade-50 uppercase">Question #{index + 1}</label>
                                  <Input
                                    value={faq.question}
                                    onChange={(e) => {
                                      const newFaqs = [...faqs]
                                      newFaqs[index] = { ...faq, question: e.target.value }
                                      field.handleChange(newFaqs)
                                    }}
                                    placeholder="e.g. What is your delivery time?"
                                    className="bg-canvas-cream/40 border-hairline-light focus:border-ink rounded-lg"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-micro font-bold text-shade-50 uppercase">Answer #{index + 1}</label>
                                  <textarea
                                    value={faq.answer}
                                    onChange={(e) => {
                                      const newFaqs = [...faqs]
                                      newFaqs[index] = { ...faq, answer: e.target.value }
                                      field.handleChange(newFaqs)
                                    }}
                                    placeholder="e.g. Inside Dhaka delivery takes 2-3 business days."
                                    className="min-h-28 md:min-h-16 p-3 bg-canvas-cream/40 border border-hairline-light focus:border-ink rounded-lg text-body-md text-ink outline-none focus:ring-1 focus:ring-ink"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newFaqs = faqs.filter((_, i) => i !== index)
                                  field.handleChange(newFaqs)
                                }}
                                className="mt-0 md:mt-6 p-2 mx-auto md:mx-0 md:w-fit rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Remove FAQ"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )
                    }}
                  </storefrontForm.Field>
                </CardContent>
              </Card>

              {/* Bento 5: Submit Actions */}
              <div className="flex justify-end pt-4 border-t border-hairline-light">
                <storefrontForm.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 w-full sm:w-auto rounded-full"
                    >
                      <Save className="h-4 w-4" />
                      {isSubmitting ? "Saving Layout…" : "Save Storefront Layout"}
                    </Button>
                  )}
                </storefrontForm.Subscribe>
              </div>
            </div>
          </form>
        )}

        {/* SHIPPING TAB */}
        {activeTab === "shipping" && (
          <div className="animate-fade-in">
            <ShippingDeliveryTab
              initialZones={shippingZones}
            />
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <NotificationsTab
            merchant={{
              id: merchant.id,
              plan: merchant.plan,
              telegramChatId: merchant.telegramChatId,
            }}
            plan={plan}
          />
        )}
      </div>
    </div>
  )
}
