import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import React from "react"

// Mock the server actions
const { mockSignUpCustomer, mockSignInCustomer } = vi.hoisted(() => {
  return {
    mockSignUpCustomer: vi.fn(),
    mockSignInCustomer: vi.fn(),
  }
})

vi.mock("../actions", () => ({
  signUpCustomer: mockSignUpCustomer,
  signInCustomer: mockSignInCustomer,
}))

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: vi.fn(),
      refresh: vi.fn(),
    }
  },
  useParams() {
    return {
      subdomain: "testshop",
    }
  },
}))

import RegisterForm from "../register/register-form"
import LoginForm from "../login/login-form"

describe("Storefront Customer Authentication UI", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe("Register Page", () => {
    it("should render registration fields", () => {
      render(<RegisterForm subdomain="testshop" />)
      expect(screen.getByLabelText(/full name/i)).toBeDefined()
      expect(screen.getByLabelText(/email address/i)).toBeDefined()
      expect(screen.getByLabelText(/password/i)).toBeDefined()
      expect(screen.getByRole("button", { name: /create account/i })).toBeDefined()
    })

    it("should trigger validation on empty submit", async () => {
      render(<RegisterForm subdomain="testshop" />)
      const submitBtn = screen.getByRole("button", { name: /create account/i })
      fireEvent.click(submitBtn)
      // The page should show error or not invoke signup
      expect(mockSignUpCustomer).not.toHaveBeenCalled()
    })
  })

  describe("Login Page", () => {
    it("should render login fields", () => {
      render(<LoginForm subdomain="testshop" />)
      expect(screen.getByLabelText(/email address/i)).toBeDefined()
      expect(screen.getByLabelText(/password/i)).toBeDefined()
      expect(screen.getByRole("button", { name: /sign in/i })).toBeDefined()
    })
  })
})
