import { describe, it, expect, vi, afterEach } from "vitest"
import { render, fireEvent, cleanup } from "@testing-library/react"
import * as React from "react"
import { Input } from "@/components/ui/primitives/Input"

afterEach(() => {
  cleanup()
})

describe("Input Component - Number Type with Stepper Buttons", () => {
  it("renders a standard text input when type is text", () => {
    const { getByPlaceholderText } = render(<Input type="text" placeholder="Enter text" />)
    const input = getByPlaceholderText("Enter text")
    expect(input).toBeTruthy()
    expect(input.tagName).toBe("INPUT")
    expect(input.getAttribute("type")).toBe("text")
  })

  it("renders custom stepper buttons when type is number", () => {
    const { getByPlaceholderText, getAllByRole } = render(<Input type="number" placeholder="Enter number" />)
    const input = getByPlaceholderText("Enter number")
    expect(input).toBeTruthy()
    expect(input.getAttribute("type")).toBe("number")

    // The increment/decrement buttons are present as buttons in the component
    const buttons = getAllByRole("button")
    expect(buttons).toHaveLength(2)
  })

  it("increments and decrements the value on stepper click", () => {
    const handleChange = vi.fn()

    const { getByRole, getAllByRole } = render(<Input type="number" defaultValue="10" onChange={handleChange} />)
    const input = getByRole("spinbutton") as HTMLInputElement
    expect(input.value).toBe("10")

    const buttons = getAllByRole("button")
    const incButton = buttons[0] // Increment button (ChevronUp)
    const decButton = buttons[1] // Decrement button (ChevronDown)

    fireEvent.mouseDown(incButton)
    fireEvent.mouseUp(incButton)
    expect(input.value).toBe("11")

    fireEvent.mouseDown(decButton)
    fireEvent.mouseUp(decButton)
    expect(input.value).toBe("10")
  })

  it("respects step, min, and max attributes", () => {
    const { getByRole, getAllByRole } = render(
      <Input
        type="number"
        defaultValue="5"
        min="2"
        max="8"
        step="2"
      />
    )
    const input = getByRole("spinbutton") as HTMLInputElement
    const buttons = getAllByRole("button")
    const incButton = buttons[0]
    const decButton = buttons[1]

    // Increment 5 + 2 = 7
    fireEvent.mouseDown(incButton)
    fireEvent.mouseUp(incButton)
    expect(input.value).toBe("7")

    // Increment 7 + 2 = 9 (clamped to max = 8)
    fireEvent.mouseDown(incButton)
    fireEvent.mouseUp(incButton)
    expect(input.value).toBe("8")

    // Decrement 8 - 2 = 6
    fireEvent.mouseDown(decButton)
    fireEvent.mouseUp(decButton)
    expect(input.value).toBe("6")

    // Decrement 6 - 2 = 4
    fireEvent.mouseDown(decButton)
    fireEvent.mouseUp(decButton)
    expect(input.value).toBe("4")

    // Decrement 4 - 2 = 2
    fireEvent.mouseDown(decButton)
    fireEvent.mouseUp(decButton)
    expect(input.value).toBe("2")

    // Decrement 2 - 2 = 0 (clamped to min = 2)
    fireEvent.mouseDown(decButton)
    fireEvent.mouseUp(decButton)
    expect(input.value).toBe("2")
  })

  it("allows 0 to be erased when focused and cleared (parent updates to 0)", () => {
    function ParentWrapper() {
      const [val, setVal] = React.useState<number>(0)
      return (
        <Input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value ? Number(e.target.value) : 0)}
          placeholder="0"
        />
      )
    }

    const { getByRole } = render(<ParentWrapper />)
    const input = getByRole("spinbutton") as HTMLInputElement
    expect(input.value).toBe("0")

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: "" } })
    expect(input.value).toBe("")
  })

  it("renders leftIcon and rightIcon slots", () => {
    const { getByText } = render(
      <Input
        type="text"
        leftIcon={<span>LeftIcon</span>}
        rightIcon={<span>RightIcon</span>}
      />
    )
    expect(getByText("LeftIcon")).toBeTruthy()
    expect(getByText("RightIcon")).toBeTruthy()
  })
})
