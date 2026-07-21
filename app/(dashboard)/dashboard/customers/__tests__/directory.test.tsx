import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import React from "react"

vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: vi.fn(),
      refresh: vi.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

import CustomersDirectory from "../customers-directory"

describe("Merchant Admin Customer Directory UI", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("should render table headers and controls", () => {
    render(
      <CustomersDirectory
        customers={[]}
        totalCount={0}
        search=""
        limit={50}
        offset={0}
      />
    )

    expect(screen.getByPlaceholderText(/search customers/i)).toBeDefined()
    expect(screen.getByText("Customer Name")).toBeDefined()
    expect(screen.getByText("Email")).toBeDefined()
    expect(screen.getByText("Status")).toBeDefined()
    expect(screen.getByText("Joined Date")).toBeDefined()
  })
})
