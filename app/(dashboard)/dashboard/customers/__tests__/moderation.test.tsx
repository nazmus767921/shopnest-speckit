import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import React from "react"

const { mockUpdateCustomerStatus, mockBanIpAddress } = vi.hoisted(() => {
  return {
    mockUpdateCustomerStatus: vi.fn(),
    mockBanIpAddress: vi.fn(),
  }
})

vi.mock("../../../../../actions/customers", () => ({
  updateCustomerStatus: mockUpdateCustomerStatus,
  banIpAddress: mockBanIpAddress,
}))

vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: vi.fn(),
      refresh: vi.fn(),
    }
  },
}))

import CustomerDetailsView from "../[id]/customer-details"

const mockCustomer = {
  id: "customer_1",
  name: "John Doe",
  email: "john@example.com",
  banned: false,
  banReason: null,
  createdAt: "2026-07-14T05:00:00Z",
  totalSpend: 15000,
  ordersCount: 3,
  customerAddresses: [
    {
      id: "address_1",
      name: "John Home",
      phone: "01711111111",
      address: "House 12, Banani",
      city: "Dhaka",
      isDefault: true,
    },
  ],
}

describe("Merchant Admin Customer Moderation UI", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("should render customer stats, addresses, and controls", () => {
    render(<CustomerDetailsView customer={mockCustomer} lastIp="192.168.1.1" />)

    expect(screen.getByText("John Doe")).toBeDefined()
    expect(screen.getByText("john@example.com")).toBeDefined()
    expect(screen.getByText("150.00 ৳")).toBeDefined() // totalSpend 15000 paisa is 150.00 taka
    expect(screen.getByText("3")).toBeDefined() // ordersCount
    expect(screen.getByText("House 12, Banani, Dhaka")).toBeDefined()
    expect(screen.getByRole("button", { name: /suspend account/i })).toBeDefined()
    expect(screen.getByRole("button", { name: /ban ip address/i })).toBeDefined()
  })
})
