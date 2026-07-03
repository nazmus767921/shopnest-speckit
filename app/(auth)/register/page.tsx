"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { Input, FormLabel, Button } from "@/components/ui"
import { authClient } from "@/lib/auth/auth-client"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type RegisterData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    } as RegisterData,
    onSubmit: async ({ value }) => {
      setError(null)
      setLoading(true)
      try {
        const { error: signUpError } = await authClient.signUp.email({
          email: value.email,
          password: value.password,
          name: value.name,
          callbackURL: "/onboarding",
        })

        if (signUpError) {
          setError(signUpError.message || "An error occurred during registration.")
        } else {
          router.push("/onboarding")
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.")
      } finally {
        setLoading(false)
      }
    },
  })

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-display font-light text-ink tracking-tight">
          Create your account
        </h2>
        <p className="text-body-md text-shade-50">
          Start your 7-day free trial. No credit card required.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="flex flex-col gap-4 mt-2"
      >
        {error && (
          <div className="p-3.5 text-caption text-red-600 bg-red-50 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => {
              const res = registerSchema.shape.name.safeParse(value)
              return res.success ? undefined : res.error.issues[0].message
            },
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <FormLabel htmlFor={field.name}>Full Name</FormLabel>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                placeholder="Nisha Rahman"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={field.state.meta.isTouched && field.state.meta.errors.length > 0}
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <span className="text-caption text-red-500">
                  {field.state.meta.errors.join(", ")}
                </span>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => {
              const res = registerSchema.shape.email.safeParse(value)
              return res.success ? undefined : res.error.issues[0].message
            },
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <FormLabel htmlFor={field.name}>Email Address</FormLabel>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                placeholder="nisha@example.com"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={field.state.meta.isTouched && field.state.meta.errors.length > 0}
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <span className="text-caption text-red-500">
                  {field.state.meta.errors.join(", ")}
                </span>
              )}
            </div>
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => {
              const res = registerSchema.shape.password.safeParse(value)
              return res.success ? undefined : res.error.issues[0].message
            },
          }}
        >
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <FormLabel htmlFor={field.name}>Password</FormLabel>
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
                <span className="text-caption text-red-500">
                  {field.state.meta.errors.join(", ")}
                </span>
              )}
            </div>
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
              className="w-full mt-4 bg-primary text-on-primary hover:bg-shade-70 active:bg-shade-70 py-3 px-6 rounded-full"
            >
              {loading ? "Creating account..." : "Start Trial"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="border-t border-hairline-light pt-6 mt-2 text-center">
        <p className="text-caption text-shade-50">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
