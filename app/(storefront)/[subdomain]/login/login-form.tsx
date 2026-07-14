"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Loader2Icon } from "@/lib/icons"
import Link from "next/link"
import { signInCustomer } from "../actions"
import { z } from "zod"

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export default function LoginForm({ subdomain }: { subdomain: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setError(null)
      setLoading(true)
      try {
        const res = await signInCustomer({
          email: value.email,
          password: value.password,
        })

        if (res.error) {
          setError(res.error)
        } else {
          router.push(`/profile`)
          router.refresh()
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.")
      } finally {
        setLoading(false)
      }
    },
  })

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto p-6 md:p-8 bg-white border border-gray-150 rounded-2xl shadow-sm">
      <div className="flex flex-col gap-1.5 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
          Welcome back
        </h2>
        <p className="text-sm text-gray-500">
          Sign in to your customer portal account
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
          name="email"
          validators={{
            onChange: ({ value }) => {
              const res = signInSchema.shape.email.safeParse(value)
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
          name="password"
          validators={{
            onChange: ({ value }) => {
              const res = signInSchema.shape.password.safeParse(value)
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
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <div className="text-center text-sm text-gray-500 mt-2">
        Don't have an account?{" "}
        <Link href={`/register`} className="font-medium text-primary hover:underline">
          Sign Up
        </Link>
      </div>
    </div>
  )
}
