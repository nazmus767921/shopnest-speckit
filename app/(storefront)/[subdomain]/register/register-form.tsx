"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Loader2Icon } from "@/lib/icons"
import Link from "next/link"
import { signUpCustomer, bindVerifiedPhoneOrders } from "../actions"
import { z } from "zod"
import { authClient } from "@/lib/auth/auth-client"

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
})

export default function RegisterForm({ subdomain }: { subdomain: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"register" | "otp">("register")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
    },
    onSubmit: async ({ value }) => {
      setError(null)
      setLoading(true)
      try {
        const res = await signUpCustomer({
          name: value.name,
          email: value.email,
          password: value.password,
          phone: value.phone || undefined,
        })

        if (res.error) {
          setError(res.error)
          setLoading(false)
        } else {
          if (value.phone) {
            setPhone(value.phone)
            // Initiate OTP flow
            const otpRes = await authClient.phoneNumber.sendOtp({ phoneNumber: value.phone })
            if (otpRes.error) {
              setError(otpRes.error.message || "Failed to send OTP.")
              setLoading(false)
            } else {
              setStep("otp")
              setLoading(false)
            }
          } else {
            router.push(`/profile`)
            router.refresh()
          }
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.")
        setLoading(false)
      }
    },
  })

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await authClient.phoneNumber.verify({ phoneNumber: phone, code: otp })
      
      if (res.error) {
        setError(res.error.message || "Invalid OTP code.")
        setLoading(false)
        return
      }

      // Once verified, bind any phone-based guest orders
      const bindRes = await bindVerifiedPhoneOrders()
      if (bindRes.error) {
        // We log the error but still let them in, as their account is already verified
        console.error("Failed to bind phone orders:", bindRes.error)
      }

      router.push(`/profile`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
      setLoading(false)
    }
  }

  if (step === "otp") {
    return (
      <div className="flex flex-col gap-6 w-full max-w-md mx-auto p-6 md:p-8 bg-white border border-gray-150 rounded-2xl shadow-sm">
        <div className="flex flex-col gap-1.5 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Verify Phone Number
          </h2>
          <p className="text-sm text-gray-500">
            We sent a verification code to {phone}. Please enter it below to bind your past orders.
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="otp">Verification Code</FieldLabel>
            <Input
              id="otp"
              name="otp"
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={loading || !otp} className="w-full mt-2">
            {loading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify and Continue"
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            disabled={loading}
            onClick={() => {
              // They can skip if they want, phone just remains unverified
              router.push(`/profile`)
              router.refresh()
            }}
            className="w-full mt-2"
          >
            Skip for now
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto p-6 md:p-8 bg-white border border-gray-150 rounded-2xl shadow-sm">
      <div className="flex flex-col gap-1.5 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
          Create an account
        </h2>
        <p className="text-sm text-gray-500">
          Join the storefront customer portal to manage your orders
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="flex flex-col gap-4"
      >
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => {
              const res = signUpSchema.shape.name.safeParse(value)
              return res.success ? undefined : res.error.issues[0].message
            },
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                placeholder="John Doe"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={field.state.meta.isTouched && field.state.meta.errors.length > 0}
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <FieldError>
                  {field.state.meta.errors.join(", ")}
                </FieldError>
              )}
            </Field>
          )}
        </form.Field>

        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => {
              const res = signUpSchema.shape.email.safeParse(value)
              return res.success ? undefined : res.error.issues[0].message
            },
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                placeholder="customer@example.com"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={field.state.meta.isTouched && field.state.meta.errors.length > 0}
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <FieldError>
                  {field.state.meta.errors.join(", ")}
                </FieldError>
              )}
            </Field>
          )}
        </form.Field>

        <form.Field
          name="phone"
          validators={{
            onChange: ({ value }) => {
              if (!value) return undefined // Optional
              const res = signUpSchema.shape.phone?.safeParse(value)
              return res?.success ? undefined : res?.error.issues[0].message
            },
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Phone Number (Optional)</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type="tel"
                placeholder="01712345678"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={field.state.meta.isTouched && field.state.meta.errors.length > 0}
              />
              <p className="text-xs text-gray-500 mt-1">
                Required if you want to link past guest checkout orders placed with your phone number.
              </p>
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <FieldError>
                  {field.state.meta.errors.join(", ")}
                </FieldError>
              )}
            </Field>
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => {
              const res = signUpSchema.shape.password.safeParse(value)
              return res.success ? undefined : res.error.issues[0].message
            },
          }}
        >
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Password</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type="password"
                placeholder="••••••••"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={field.state.meta.isTouched && field.state.meta.errors.length > 0}
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <FieldError>
                  {field.state.meta.errors.join(", ")}
                </FieldError>
              )}
            </Field>
          )}
        </form.Field>

        <Button type="submit" disabled={loading} className="w-full mt-2">
          {loading ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <div className="text-center text-sm text-gray-500 mt-2">
        Already have an account?{" "}
        <Link href={`/login`} className="font-medium text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  )
}
