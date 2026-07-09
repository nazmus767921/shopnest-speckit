"use client"

import React, { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { storeSettingsSchema } from "@/lib/validations/settings"
import { updateStoreSettingsAction } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError, FieldDescription, FieldGroup, FieldSet } from "@/components/ui/field"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Save, Lock, Smartphone, Landmark, Sliders, Trash2, Plus, UploadCloud, X, Truck, Bell } from "lucide-react"
import { z } from "zod"
import { ShippingDeliveryTab } from "./ShippingDeliveryTab"
import { NotificationsTab } from "./NotificationsTab"
import { toast } from "sonner"
import type { ResolvedPlan } from "@/lib/plans/types"
import { cn } from "@/lib/utils"

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
  telegramChatId?: string | null
  codEnabled?: boolean
  payDeliveryChargeFirst?: boolean
  bkashWalletNumber?: string | null
  nagadWalletNumber?: string | null
  template?: string
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

type Tab = "profile" | "payments" | "inventory" | "shipping" | "notifications"

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
      <div className="bg-muted/50 border border-border rounded-xl p-2.5 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible shrink-0 w-full md:w-60 lg:w-64 md:sticky md:top-20 self-start scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={cn(
            "flex items-center justify-between gap-3 px-3.5 py-2 text-sm transition-all duration-200 cursor-pointer text-left rounded-lg w-full shrink-0 md:shrink font-semibold",
            activeTab === "profile"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <span className="flex items-center gap-3">
            <span className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg text-white",
              activeTab === "profile" ? "bg-white/15" : "bg-blue-600"
            )}>
              <Smartphone className="h-4 w-4 shrink-0" />
            </span>
            <span>Store Profile</span>
          </span>
          {activeTab === "profile" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inventory")}
          className={cn(
            "flex items-center justify-between gap-3 px-3.5 py-2 text-sm transition-all duration-200 cursor-pointer text-left rounded-lg w-full shrink-0 md:shrink font-semibold",
            activeTab === "inventory"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <span className="flex items-center gap-3">
            <span className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg text-white",
              activeTab === "inventory" ? "bg-white/15" : "bg-purple-600"
            )}>
              <Sliders className="h-4 w-4 shrink-0" />
            </span>
            <span>Inventory</span>
          </span>
          {activeTab === "inventory" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={cn(
            "flex items-center justify-between gap-3 px-3.5 py-2 text-sm transition-all duration-200 cursor-pointer text-left rounded-lg w-full shrink-0 md:shrink font-semibold",
            activeTab === "payments"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <span className="flex items-center gap-3">
            <span className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg text-white",
              activeTab === "payments" ? "bg-white/15" : "bg-emerald-600"
            )}>
              <Landmark className="h-4 w-4 shrink-0" />
            </span>
            <span>Payment Options</span>
          </span>
          {activeTab === "payments" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("shipping")}
          className={cn(
            "flex items-center justify-between gap-3 px-3.5 py-2 text-sm transition-all duration-200 cursor-pointer text-left rounded-lg w-full shrink-0 md:shrink font-semibold",
            activeTab === "shipping"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <span className="flex items-center gap-3">
            <span className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg text-white",
              activeTab === "shipping" ? "bg-white/15" : "bg-orange-500"
            )}>
              <Truck className="h-4 w-4 shrink-0" />
            </span>
            <span>Shipping & Delivery</span>
          </span>
          {activeTab === "shipping" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={cn(
            "flex items-center justify-between gap-3 px-3.5 py-2 text-sm transition-all duration-200 cursor-pointer text-left rounded-lg w-full shrink-0 md:shrink font-semibold",
            activeTab === "notifications"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <span className="flex items-center gap-3">
            <span className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg text-white",
              activeTab === "notifications" ? "bg-white/15" : "bg-red-500"
            )}>
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
              {/* Card 1: Store Profile Info */}
              <Card className="lg:col-span-8 p-6 sm:p-8 flex flex-col gap-6 rounded-xl border border-border">
                <CardHeader className="p-0 border-b border-border pb-4">
                  <CardTitle className="text-lg font-bold text-foreground">Store Profile</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-1">
                    Basic information about your store shown to customers on your storefront.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0 flex flex-col gap-5">
                  {/* Store Name Input */}
                  <profileForm.Field name="name">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor="store-name">
                          Store Name <span className="text-red-500">*</span>
                        </FieldLabel>
                        <Input
                          id="store-name"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="e.g. Niha's Boutique"
                          className="bg-background border-border rounded-lg"
                        />
                        {field.state.meta.errors.length > 0 && (
                          <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                        )}
                      </Field>
                    )}
                  </profileForm.Field>

                  {/* Store Phone Number Input */}
                  <profileForm.Field name="phoneNumber">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor="phone-number">Store Phone Number</FieldLabel>
                        <Input
                          id="phone-number"
                          type="tel"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          placeholder="e.g. 01700000000"
                          className="bg-background border-border rounded-lg"
                        />
                        {field.state.meta.errors.length > 0 && (
                          <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                        )}
                      </Field>
                    )}
                  </profileForm.Field>
                </CardContent>

                <CardFooter className="p-0 justify-end border-t border-border pt-4">
                  <profileForm.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 w-full sm:w-auto rounded-md"
                      >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? "Saving Profile…" : "Save Profile Settings"}
                      </Button>
                    )}
                  </profileForm.Subscribe>
                </CardFooter>
              </Card>

              {/* Card 2: Permanent Subdomain Lock */}
              <Card className="lg:col-span-4 p-6 sm:p-8 flex flex-col gap-5 rounded-xl bg-muted/30 border border-border justify-between">
                <div className="flex flex-col gap-4">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shrink-0">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-base font-semibold text-foreground leading-tight">
                      Permanent Subdomain
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your storefront URL is permanent and cannot be modified.
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3.5 bg-background border border-border rounded-lg font-mono text-xs font-semibold text-foreground break-all text-center">
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
            <Card className="p-6 sm:p-8 flex flex-col gap-6 rounded-xl border border-border">
              <CardHeader className="p-0 border-b border-border pb-4">
                <CardTitle className="text-lg font-bold text-foreground">Payment Details</CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  Configure the mobile financial service numbers where customers will send manual payments during checkout.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* bKash Wallet Card */}
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#d12053] text-white rounded-lg flex items-center justify-center font-bold text-base shrink-0">
                        b
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-semibold text-foreground leading-tight">bKash Account</span>
                        <span className="text-[10px] text-[#d12053] font-semibold uppercase tracking-wider">Personal Wallet</span>
                      </div>
                    </div>
                    {/* bKash Number */}
                    <paymentsForm.Field name="bkashNumber">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor="bkash-number">bKash Wallet Number</FieldLabel>
                          <Input
                            id="bkash-number"
                            type="tel"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="e.g. 01700000000"
                            className="bg-background border-border rounded-lg"
                          />
                          {field.state.meta.errors.length > 0 && (
                            <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                          )}
                        </Field>
                      )}
                    </paymentsForm.Field>
                  </div>

                  {/* Nagad Wallet Card */}
                  <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#f04f23] text-white rounded-lg flex items-center justify-center font-bold text-base shrink-0">
                        n
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-semibold text-foreground leading-tight">Nagad Account</span>
                        <span className="text-[10px] text-[#f04f23] font-semibold uppercase tracking-wider">Personal Wallet</span>
                      </div>
                    </div>
                    {/* Nagad Number */}
                    <paymentsForm.Field name="nagadNumber">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor="nagad-number">Nagad Wallet Number</FieldLabel>
                          <Input
                            id="nagad-number"
                            type="tel"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="e.g. 01700000000"
                            className="bg-background border-border rounded-lg"
                          />
                          {field.state.meta.errors.length > 0 && (
                            <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                          )}
                        </Field>
                      )}
                    </paymentsForm.Field>
                  </div>

                  {/* Cash on Delivery Card */}
                  <div className="bg-muted/10 border border-border rounded-xl p-5 md:col-span-2 flex flex-col gap-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-base shrink-0">
                          C
                        </div>
                        <div className="flex flex-col">
                          <span className="text-base font-semibold text-foreground leading-tight">Cash on Delivery (COD)</span>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Storefront Delivery Payment</span>
                        </div>
                      </div>

                      {/* codEnabled Switch */}
                      <paymentsForm.Field name="codEnabled">
                        {(field) => (
                          <Switch
                            checked={field.state.value}
                            disabled={!plan?.features.cod}
                            onCheckedChange={(checked) => {
                              field.handleChange(checked)
                              if (!checked) {
                                paymentsForm.setFieldValue("payDeliveryChargeFirst", false)
                              }
                            }}
                          />
                        )}
                      </paymentsForm.Field>
                    </div>

                    {!plan?.features.cod && (
                      <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 shrink-0" />
                        <span>Upgrade your subscription plan to Growth or Pro to enable Cash on Delivery checkout options.</span>
                      </div>
                    )}

                    {plan?.features.cod && (
                      <paymentsForm.Subscribe>
                        {(state) => (
                          <>
                            {state.values.codEnabled && (
                              <div className="border-t border-border pt-4 flex flex-col gap-4 animate-fade-in">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-semibold text-foreground">Pay Delivery Charge First</span>
                                    <p className="text-xs text-muted-foreground">Require customers to pay the shipping fee upfront via bKash/Nagad during checkout.</p>
                                  </div>

                                  {/* payDeliveryChargeFirst Switch */}
                                  <paymentsForm.Field name="payDeliveryChargeFirst">
                                    {(field) => (
                                      <Switch
                                        checked={field.state.value}
                                        onCheckedChange={(checked) => field.handleChange(checked)}
                                      />
                                    )}
                                  </paymentsForm.Field>
                                </div>

                                {state.values.payDeliveryChargeFirst && (
                                  <div className="bg-muted/20 border border-border rounded-lg p-4 flex flex-col gap-4 animate-fade-in">
                                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">Merchant Wallet Numbers for Shipping Collection</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <paymentsForm.Field name="bkashWalletNumber">
                                        {(field) => (
                                          <Field>
                                            <FieldLabel htmlFor="bkash-wallet-number">bKash Personal Number</FieldLabel>
                                            <Input
                                              id="bkash-wallet-number"
                                              type="tel"
                                              value={field.state.value}
                                              onChange={(e) => field.handleChange(e.target.value)}
                                              onBlur={field.handleBlur}
                                              placeholder="e.g. 01700000000"
                                              className="bg-background border-border rounded-lg"
                                            />
                                          </Field>
                                        )}
                                      </paymentsForm.Field>

                                      <paymentsForm.Field name="nagadWalletNumber">
                                        {(field) => (
                                          <Field>
                                            <FieldLabel htmlFor="nagad-wallet-number">Nagad Personal Number</FieldLabel>
                                            <Input
                                              id="nagad-wallet-number"
                                              type="tel"
                                              value={field.state.value}
                                              onChange={(e) => field.handleChange(e.target.value)}
                                              onBlur={field.handleBlur}
                                              placeholder="e.g. 01700000000"
                                              className="bg-background border-border rounded-lg"
                                            />
                                          </Field>
                                        )}
                                      </paymentsForm.Field>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
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

                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                  * Customers will see these numbers at checkout. Ensure they are correct and active to prevent failed payment confirmations.
                </p>
              </CardContent>

              <CardFooter className="p-0 justify-end border-t border-border pt-4">
                <paymentsForm.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 w-full sm:w-auto rounded-md"
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
            <Card className="p-6 sm:p-8 flex flex-col gap-6 rounded-xl border border-border">
              <CardHeader className="p-0 border-b border-border pb-4">
                <CardTitle className="text-lg font-bold text-foreground">Inventory Preferences</CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  Default settings applied to new products. You can override these per product if needed.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 flex flex-col gap-5">
                <inventoryForm.Field name="lowStockThresholdDefault">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="low-stock-threshold">
                        Default Low Stock Threshold <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input
                        id="low-stock-threshold"
                        type="number"
                        min={0}
                        max={9999}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        onBlur={field.handleBlur}
                        placeholder="5"
                        className="max-w-xs bg-background border-border font-mono rounded-lg"
                      />
                      <FieldDescription>
                        New products will display a low-stock warning in your dashboard when their quantity drops below this number.
                      </FieldDescription>
                      {field.state.meta.errors.length > 0 && (
                        <FieldError>{String(field.state.meta.errors[0])}</FieldError>
                      )}
                    </Field>
                  )}
                </inventoryForm.Field>
              </CardContent>

              <CardFooter className="p-0 justify-end border-t border-border pt-4">
                <inventoryForm.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 w-full sm:w-auto rounded-md"
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
