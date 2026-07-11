"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from "@/components/ui"
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field"
import { createMerchantAction } from "./actions"
import { onboardingSchema } from "./schema"
import { GlobeIcon, StoreIcon, CheckIcon, ArrowRightIcon } from "@/lib/icons";


type ResolvedPlanForForm = {
  id: string
  name: string
  slug: string
  pricePaisa: number
  features: any
}

interface OnboardingFormProps {
  plans: ResolvedPlanForForm[]
}

type OnboardingData = {
  name: string
  subdomain: string
  plan: string
  businessType: string
}

export default function OnboardingForm({ plans }: OnboardingFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Get first plan slug from plans array to use as default value, fallback to "starter"
  const defaultPlanSlug = plans.length > 0 ? plans[0].slug : "starter"

  const form = useForm({
    defaultValues: {
      name: "",
      subdomain: "",
      plan: defaultPlanSlug,
      businessType: "general",
    } as OnboardingData,
    onSubmit: async ({ value }) => {
      setError(null)
      setLoading(true)
      try {
        const res = await createMerchantAction(value)

        if (res.error) {
          setError(res.error)
          setLoading(false)
        } else if (res.success) {
          setSuccess(true)
          // Small delay to let the success animation show
          setTimeout(() => {
            router.push("/dashboard")
            router.refresh()
          }, 1500)
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.")
        setLoading(false)
      }
    },
  })

  // Normalize store name to subdomain prefix (auto-populate suggestion)
  const handleStoreNameChange = (nameVal: string, setSubdomainValue: (val: string) => void, subdomainTouched: boolean) => {
    if (!subdomainTouched) {
      const suggested = nameVal
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "") // Remove special chars except space and hyphen
          .trim()
          .replace(/\s+/g, "-") // Replace spaces with hyphens
          .substring(0, 63)
      setSubdomainValue(suggested)
    }
  }

  return (
      <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
        {/* Onboarding progress and visual step indicator */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-aloe-10 animate-pulse" />
            <span className="text-eyebrow-cap font-semibold tracking-wider text-shade-60 uppercase">
              Step 2: StoreIcon Setup
            </span>
          </div>
          <span className="text-caption text-shade-40 font-mono">50% Complete</span>
        </div>

        <Card variant={success ? "featured" : "default"} className="border border-hairline-light transition-all duration-300">
          {success ? (
              <div className="flex flex-col items-center justify-center text-center py-10 px-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 text-emerald-800 scale-100 transition-transform duration-500 animate-bounce">
                  <CheckIcon className="h-8 w-8 stroke-3" />
                </div>
                <h2 className="text-heading-xl font-medium mb-2 text-ink">
                  Your boutique is ready!
                </h2>
                <p className="text-body-md text-shade-70 max-w-xs">
                  Configuring your dashboard & provisioning your brand subdomain...
                </p>
              </div>
          ) : (
              <>
                <CardHeader className="pb-4">
                  <CardTitle className="text-display-md font-light text-ink leading-tight">
                    Launch your digital store
                  </CardTitle>
                  <CardDescription className="text-body-md text-shade-50 mt-2">
                    Define your brand identity and claim your unique subdomain storefront in under 60 seconds.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        form.handleSubmit()
                      }}
                      className="flex flex-col gap-5 mt-2"
                  >
                    {error && (
                        <div className="p-4 text-caption text-red-600 bg-red-50/50 rounded-md border border-red-200/60 animate-fade-in">
                          {error}
                        </div>
                    )}

                    {/* StoreIcon Name Input */}
                    <form.Field
                        name="name"
                        validators={{
                          onChange: ({ value }) => {
                            const res = onboardingSchema.shape.name.safeParse(value)
                            return res.success ? undefined : res.error.issues[0].message
                          },
                        }}
                    >
                      {(field) => (
                          <Field>
                            <FieldLabel htmlFor={field.name} className="flex items-center gap-1.5 text-shade-60">
                              <StoreIcon className="h-4 w-4 text-shade-40" />
                              Boutique / StoreIcon Name
                            </FieldLabel>
                            <Input
                                id={field.name}
                                name={field.name}
                                type="text"
                                placeholder="Nisha's Closet"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => {
                                  field.handleChange(e.target.value)
                                  // Auto-suggest subdomain from store name
                                  const subMeta = form.getFieldMeta("subdomain")
                                  handleStoreNameChange(
                                      e.target.value,
                                      (val) => form.setFieldValue("subdomain", val),
                                      !!subMeta?.isTouched
                                  )
                                }}
                                error={field.state.meta.isTouched && field.state.meta.errors.length > 0}
                            />
                            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                <FieldError className="animate-fade-in">
                                  {field.state.meta.errors[0]}
                                </FieldError>
                            )}
                          </Field>
                      )}
                    </form.Field>

                    {/* Subdomain Input with prefix addon layout */}
                    <form.Field
                        name="subdomain"
                        validators={{
                          onChange: ({ value }) => {
                            const res = onboardingSchema.shape.subdomain.safeParse(value)
                            return res.success ? undefined : res.error.issues[0].message
                          },
                        }}
                    >
                      {(field) => (
                          <Field>
                            <FieldLabel htmlFor={field.name} className="flex items-center gap-1.5 text-shade-60">
                              <GlobeIcon className="h-4 w-4 text-shade-40" />
                              StoreIcon Subdomain URL
                            </FieldLabel>
                            <div className="flex rounded-md border border-hairline-light bg-canvas-light focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 overflow-hidden transition-all duration-200">
                              <input
                                  id={field.name}
                                  name={field.name}
                                  type="text"
                                  placeholder="nishas-closet"
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(e) => field.handleChange(e.target.value.toLowerCase())}
                                  className="grow bg-transparent text-ink font-sans text-body-md px-3 py-2.5 outline-none min-h-11 placeholder:text-shade-40"
                              />
                              <span className="bg-pistachio-10 text-ink text-body-md font-medium px-4 flex items-center border-l border-hairline-light select-none">
                                .shopnest.com.bd
                              </span>
                            </div>
                            <FieldDescription className="px-1">
                              Use lowercase letters, numbers, and hyphens only (e.g. <code>my-brand</code>).
                            </FieldDescription>
                            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                                <FieldError className="animate-fade-in">
                                  {field.state.meta.errors[0]}
                                </FieldError>
                            )}
                          </Field>
                      )}
                    </form.Field>

                    {/* Plan Selection */}
                    <form.Field name="plan">
                      {(field) => (
                          <Field className="mt-2">
                            <FieldLabel className="flex items-center gap-1.5 text-shade-60">
                              <CheckIcon className="h-4 w-4 text-shade-40" />
                              Select a Plan
                            </FieldLabel>
                            <div className="grid grid-cols-2 gap-3 mt-1">
                              {plans.map((p) => (
                                  <label
                                      key={p.id}
                                      className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                                          field.state.value === p.slug
                                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                                              : "border-hairline hover:border-shade-40 bg-canvas"
                                      }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                          type="radio"
                                          name={field.name}
                                          value={p.slug}
                                          checked={field.state.value === p.slug}
                                          onChange={() => field.handleChange(p.slug)}
                                          className="sr-only"
                                      />
                                      <div
                                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                              field.state.value === p.slug ? "border-primary" : "border-shade-40"
                                          }`}
                                      >
                                        {field.state.value === p.slug && (
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                        )}
                                      </div>
                                      <span className="font-medium text-ink">{p.name}</span>
                                    </div>
                                    <span className="text-micro text-shade-50 ml-6 mt-1">
                                      14-day free trial. {p.slug === "starter" ? "For new stores." : p.slug === "growth" ? "Pro features." : "Scaling brand."}
                                    </span>
                                  </label>
                              ))}
                            </div>
                          </Field>
                      )}
                    </form.Field>

                    {/* Business Type Selection */}
                    <form.Field name="businessType">
                      {(field) => (
                        <Field className="mt-2">
                          <FieldLabel className="flex items-center gap-1.5 text-shade-60">
                            <StoreIcon className="h-4 w-4 text-shade-40" />
                            Business Type / Niche
                          </FieldLabel>
                          <div className="grid grid-cols-2 gap-3 mt-1">
                            {[
                              { label: "Clothing & Fashion", value: "clothing", desc: "Suited for fashion boutiques" },
                              { label: "Electronics & Tech", value: "electronics", desc: "For specs and tech gear" },
                              { label: "Beauty & Health", value: "beauty", desc: "Skincare, cosmetics, etc." },
                              { label: "General Retail", value: "general", desc: "Multi-purpose default layout" },
                            ].map((b) => (
                              <label
                                key={b.value}
                                className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                                  field.state.value === b.value
                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                    : "border-hairline hover:border-shade-40 bg-canvas"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={field.name}
                                    value={b.value}
                                    checked={field.state.value === b.value}
                                    onChange={() => field.handleChange(b.value)}
                                    className="sr-only"
                                  />
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                      field.state.value === b.value ? "border-primary" : "border-shade-40"
                                    }`}
                                  >
                                    {field.state.value === b.value && (
                                      <div className="w-2 h-2 rounded-full bg-primary" />
                                    )}
                                  </div>
                                  <span className="font-medium text-ink text-body-md">{b.label}</span>
                                </div>
                                <span className="text-micro text-zinc-500 ml-6 mt-1 leading-relaxed font-light">
                                  {b.desc}
                                </span>
                              </label>
                            ))}
                          </div>
                        </Field>
                      )}
                    </form.Field>

                    <form.Subscribe
                        selector={(state) => ({
                          canSubmit: state.canSubmit,
                          isSubmitting: state.isSubmitting,
                        })}
                    >
                      {({ canSubmit }) => (
                          <Button
                              type="submit"
                              disabled={!canSubmit || loading}
                              className="w-full mt-4 font-medium transition-all duration-300"
                          >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                  Provisioning StoreIcon...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                  Create & Build Storefront
                                  <ArrowRightIcon className="h-4 w-4" />
                                </span>
                            )}
                          </Button>
                      )}
                    </form.Subscribe>
                  </form>
                </CardContent>
              </>
          )}
        </Card>
      </div>
  )
}
