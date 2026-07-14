import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react"
import React from "react"

const { mockSaveCustomerAddress } = vi.hoisted(() => {
  return {
    mockSaveCustomerAddress: vi.fn(),
  }
})

vi.mock("../actions", () => ({
  saveCustomerAddress: mockSaveCustomerAddress,
}))

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

import AddressesForm from "../addresses"

describe("Customer Profile & Address Book UI", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe("Address Book", () => {
    it("should render address inputs", () => {
      render(
        <AddressesForm
          subdomain="testshop"
          userId="user_1"
          addresses={[]}
        />
      )
      expect(screen.getByRole("button", { name: /add new address/i })).toBeDefined()
    })

    it("should display form fields when add is clicked", async () => {
      render(
        <AddressesForm
          subdomain="testshop"
          userId="user_1"
          addresses={[]}
        />
      )
      const addBtn = screen.getByRole("button", { name: /add new address/i })
      fireEvent.click(addBtn)

      await waitFor(() => {
        expect(screen.getByPlaceholderText("John Doe")).toBeDefined()
        expect(screen.getByPlaceholderText("01711111111")).toBeDefined()
        expect(screen.getByPlaceholderText("Road 4, House 12, Apt 3B, Banani")).toBeDefined()
        expect(screen.getByPlaceholderText("Dhaka")).toBeDefined()
      })
    })
  })
})
