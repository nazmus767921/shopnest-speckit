"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { Input, Button } from "@/components/ui"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { authClient } from "@/lib/auth/auth-client"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    } as LoginData,
    onSubmit: async ({ value }) => {
      setError(null)
      setLoading(true)
      try {
        const { error: signInError } = await authClient.signIn.email({
          email: value.email,
          password: value.password,
          callbackURL: "/dashboard",
        })

        if (signInError) {
          setError(signInError.message || "Invalid email or password.")
        } else {
          router.push("/dashboard")
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
          Welcome back
        </h2>
        <p className="text-body-md text-shade-50">
          Log in to manage your boutique storefront.
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
          name="email"
          validators={{
            onChange: ({ value }) => {
              const res = loginSchema.shape.email.safeParse(value)
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
                placeholder="nisha@example.com"
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
          name="password"
          validators={{
            onChange: ({ value }) => {
              const res = loginSchema.shape.password.safeParse(value)
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
              {loading ? "Logging in..." : "Log In"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="border-t border-hairline-light pt-6 mt-2 text-center">
        <p className="text-caption text-shade-50">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
