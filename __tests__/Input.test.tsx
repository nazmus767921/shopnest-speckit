import { describe, it, expect, vi, afterEach } from "vitest"
import { render, fireEvent, cleanup } from "@testing-library/react"
import * as React from "react"
import { Input } from "@/components/ui/input"

afterEach(() => {
  cleanup()
})

describe("Input Component - Basic Wrapper Tests", () => {
  it("renders a standard text input when type is text", () => {
    const { getByPlaceholderText } = render(<Input type="text" placeholder="Enter text" />)
    const input = getByPlaceholderText("Enter text")
    expect(input).toBeTruthy()
    expect(input.tagName).toBe("INPUT")
    expect(input.getAttribute("type")).toBe("text")
  })

  it("handles value change events", () => {
    const handleChange = vi.fn()
    const { getByPlaceholderText } = render(<Input type="text" placeholder="Type here" onChange={handleChange} />)
    const input = getByPlaceholderText("Type here") as HTMLInputElement
    
    fireEvent.change(input, { target: { value: "Hello" } })
    expect(handleChange).toHaveBeenCalled()
    expect(input.value).toBe("Hello")
  })

  it("disables interaction when disabled is true", () => {
    const { getByPlaceholderText } = render(<Input type="text" placeholder="Disabled" disabled />)
    const input = getByPlaceholderText("Disabled") as HTMLInputElement
    expect(input.disabled).toBe(true)
  })
})
