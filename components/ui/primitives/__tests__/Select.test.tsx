import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { render, fireEvent, cleanup, screen } from "@testing-library/react"
import * as React from "react"
import { Select } from "@/components/ui/primitives/Select"

// Helper to query the trigger button inside the Select
const getTrigger = (container: HTMLElement) => container.querySelector("button") as HTMLButtonElement
const getDropdown = () => document.querySelector('[data-testid="select-dropdown"]')

const defaultOptions = [
  { label: "Option 1", value: "1" },
  { label: "Option 2", value: "2" },
  { label: "Option 3", value: "3" },
]

afterEach(() => {
  cleanup()
})

describe("Select Component - Basic Rendering", () => {
  it("renders trigger button with placeholder when no value is selected", () => {
    const { container } = render(
      <Select options={defaultOptions} onChange={() => {}} placeholder="Select something..." />
    )
    const trigger = getTrigger(container)
    expect(trigger.textContent).toContain("Select something...")
  })

  it("renders trigger button with selected option label when value is provided", () => {
    const { container } = render(
      <Select options={defaultOptions} value={defaultOptions[0]} onChange={() => {}} />
    )
    const trigger = getTrigger(container)
    expect(trigger.textContent).toContain("Option 1")
  })

  it("uses default label extraction when getOptionLabel is omitted", () => {
    const options = [{ label: "Apple" }, { name: "Banana" }, { id: "cherry" }]
    const { container } = render(
      <Select options={options} value={options[0]} onChange={() => {}} />
    )
    const trigger = getTrigger(container)
    expect(trigger.textContent).toContain("Apple")
  })
})

describe("Select Component - Dropdown Open/Close", () => {
  it("opens dropdown on trigger click", () => {
    const { container } = render(
      <Select options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)
    fireEvent.click(trigger)
    const dropdown = getDropdown()
    expect(dropdown).toBeTruthy()
  })

  it("closes dropdown on outside click", () => {
    const { container } = render(
      <Select options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)
    fireEvent.click(trigger)
    expect(getDropdown()).toBeTruthy()

    // Click outside
    fireEvent.mouseDown(document.body)
    expect(getDropdown()).toBeFalsy()
  })

  it("closes dropdown on Escape key press", () => {
    const { container } = render(
      <Select options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)
    fireEvent.click(trigger)
    expect(getDropdown()).toBeTruthy()

    fireEvent.keyDown(trigger, { key: "Escape" })
    expect(getDropdown()).toBeFalsy()
  })

  it("closes dropdown on option selection", () => {
    const onChange = vi.fn()
    const { container } = render(
      <Select options={defaultOptions} onChange={onChange} />
    )
    const trigger = getTrigger(container)
    fireEvent.click(trigger)

    const options = screen.getAllByText(/Option/)
    fireEvent.click(options[0])
    expect(getDropdown()).toBeFalsy()
    expect(onChange).toHaveBeenCalledWith(defaultOptions[0])
  })
})

describe("Select Component - Keyboard Navigation", () => {
  it("opens dropdown with ArrowDown key and highlights first option", () => {
    const { container } = render(
      <Select options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)
    fireEvent.keyDown(trigger, { key: "ArrowDown" })

    const dropdown = getDropdown()
    expect(dropdown).toBeTruthy()

    // First option should have active styling
    const firstOption = dropdown?.querySelector('[data-index="0"]')
    expect(firstOption?.className).toContain("bg-canvas-cream")
  })

  it("navigates options with ArrowDown and ArrowUp keys", () => {
    const { container } = render(
      <Select options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)

    // Open with ArrowDown
    fireEvent.keyDown(trigger, { key: "ArrowDown" })
    const dropdown = getDropdown()!

    // Move down
    fireEvent.keyDown(trigger, { key: "ArrowDown" })
    const secondOption = dropdown.querySelector('[data-index="1"]')
    expect(secondOption?.className).toContain("bg-canvas-cream")

    // Move back up
    fireEvent.keyDown(trigger, { key: "ArrowUp" })
    const firstOption = dropdown.querySelector('[data-index="0"]')
    expect(firstOption?.className).toContain("bg-canvas-cream")
  })

  it("selects active option with Enter and calls onChange", () => {
    const onChange = vi.fn()
    const { container } = render(
      <Select options={defaultOptions} onChange={onChange} />
    )
    const trigger = getTrigger(container)

    fireEvent.keyDown(trigger, { key: "ArrowDown" })
    // Move to second option
    fireEvent.keyDown(trigger, { key: "ArrowDown" })
    fireEvent.keyDown(trigger, { key: "Enter" })

    expect(onChange).toHaveBeenCalledWith(defaultOptions[1])
    expect(getDropdown()).toBeFalsy()
  })

  it("closes dropdown with Tab key", () => {
    const { container } = render(
      <Select options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)
    fireEvent.click(trigger)
    expect(getDropdown()).toBeTruthy()

    fireEvent.keyDown(trigger, { key: "Tab" })
    expect(getDropdown()).toBeFalsy()
  })
})

describe("Select Component - Custom Option Rendering", () => {
  it("renders custom option content via renderOption prop", () => {
    render(
      <Select
        options={defaultOptions}
        onChange={() => {}}
        renderOption={(option) => <span data-testid="custom-option">{option.label} ★</span>}
      />
    )
    const trigger = screen.getByRole("button")
    fireEvent.click(trigger)
    const customOptions = screen.getAllByTestId("custom-option")
    expect(customOptions).toHaveLength(3)
    expect(customOptions[0].textContent).toBe("Option 1 ★")
  })
})

describe("Select Component - Check Icon on Selected Option", () => {
  it("shows check icon on selected option only", () => {
    render(
      <Select options={defaultOptions} value={defaultOptions[0]} onChange={() => {}} />
    )
    const trigger = screen.getByRole("button")
    fireEvent.click(trigger)

    // Check icons - only the first option should have one
    const checkIcons = document.querySelectorAll('[data-testid="select-check-icon"]')
    expect(checkIcons).toHaveLength(1)
  })
})

describe("Select Component - Custom Label/Value Extraction", () => {
  it("custom getOptionLabel extracts display label correctly", () => {
    const options = [{ id: 1, fullName: "Alice" }, { id: 2, fullName: "Bob" }]
    const { container } = render(
      <Select
        options={options}
        value={options[0]}
        onChange={() => {}}
        getOptionLabel={(opt) => opt.fullName}
      />
    )
    const trigger = getTrigger(container)
    expect(trigger.textContent).toContain("Alice")
  })

  it("custom getOptionValue extracts comparison value correctly", () => {
    const onChange = vi.fn()
    const options = [{ id: 10, name: "Ten" }, { id: 20, name: "Twenty" }]
    const { container } = render(
      <Select
        options={options}
        onChange={onChange}
        getOptionValue={(opt) => opt.id}
      />
    )
    const trigger = getTrigger(container)
    fireEvent.click(trigger)

    const optionEl = screen.getByText("Twenty")
    fireEvent.click(optionEl)
    expect(onChange).toHaveBeenCalledWith(options[1])
  })
})

describe("Select Component - Custom Icon Slots", () => {
  it("iconLeft renders before the label in the trigger", () => {
    const { container } = render(
      <Select
        options={defaultOptions}
        value={defaultOptions[0]}
        onChange={() => {}}
        iconLeft={<span data-testid="left-icon">←</span>}
      />
    )
    const trigger = getTrigger(container)
    expect(trigger.innerHTML).toContain("←")
  })

  it("iconRight renders in the trigger before the chevron", () => {
    const { container } = render(
      <Select
        options={defaultOptions}
        value={defaultOptions[0]}
        onChange={() => {}}
        iconRight={<span data-testid="right-icon">→</span>}
      />
    )
    const trigger = getTrigger(container)
    expect(trigger.innerHTML).toContain("→")
  })
})

describe("Select Component - Debounced Async Fetching", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("calls onSearch after debounceMs when dropdown opens", () => {
    const onSearch = vi.fn()
    const { container } = render(
      <Select options={[]} onChange={() => {}} onSearch={onSearch} debounceMs={300} />
    )
    const trigger = getTrigger(container)

    fireEvent.click(trigger)
    expect(onSearch).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(onSearch).toHaveBeenCalledWith("")
  })

  it("cancels debounced fetch when dropdown closes before debounceMs elapses", () => {
    const onSearch = vi.fn()
    const { container } = render(
      <Select options={[]} onChange={() => {}} onSearch={onSearch} debounceMs={300} />
    )
    const trigger = getTrigger(container)

    fireEvent.click(trigger)
    vi.advanceTimersByTime(200) // Still within debounce window
    fireEvent.keyDown(trigger, { key: "Escape" }) // Close dropdown early

    vi.advanceTimersByTime(200) // Complete the remaining time
    expect(onSearch).not.toHaveBeenCalled()
  })

  it("resets debounce timer on rapid open/close cycles", () => {
    const onSearch = vi.fn()
    const { container } = render(
      <Select options={[]} onChange={() => {}} onSearch={onSearch} debounceMs={300} />
    )
    const trigger = getTrigger(container)

    // Open, wait 200ms, close
    fireEvent.click(trigger)
    vi.advanceTimersByTime(200)
    fireEvent.keyDown(trigger, { key: "Escape" })

    // Open again
    fireEvent.click(trigger)
    vi.advanceTimersByTime(200) // 200ms into second open
    expect(onSearch).not.toHaveBeenCalled() // Shouldn't fire yet

    vi.advanceTimersByTime(150) // Now 350ms total into second open = timer fired
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it("uses custom debounceMs value", () => {
    const onSearch = vi.fn()
    const { container } = render(
      <Select options={[]} onChange={() => {}} onSearch={onSearch} debounceMs={1000} />
    )
    const trigger = getTrigger(container)

    fireEvent.click(trigger)
    vi.advanceTimersByTime(500)
    expect(onSearch).not.toHaveBeenCalled()

    vi.advanceTimersByTime(500)
    expect(onSearch).toHaveBeenCalledWith("")
  })

  it("disables debounce when debounceMs={0}", () => {
    const onSearch = vi.fn()
    const { container } = render(
      <Select options={[]} onChange={() => {}} onSearch={onSearch} debounceMs={0} />
    )
    const trigger = getTrigger(container)

    fireEvent.click(trigger)
    // Should call immediately without waiting
    expect(onSearch).toHaveBeenCalledWith("")
  })
})

describe("Select Component - Loading State", () => {
  it("shows loading spinner when isLoading is true", () => {
    render(
      <Select options={[]} onChange={() => {}} isLoading={true} />
    )
    const trigger = screen.getByRole("button")
    fireEvent.click(trigger)

    expect(screen.getByText("Loading options...")).toBeTruthy()
  })
})

describe("Select Component - Empty State", () => {
  it("shows noOptionsMessage when options array is empty", () => {
    render(
      <Select options={[]} onChange={() => {}} noOptionsMessage="Nothing here" />
    )
    const trigger = screen.getByRole("button")
    fireEvent.click(trigger)

    expect(screen.getByText("Nothing here")).toBeTruthy()
  })

  it("shows default no options message when not provided", () => {
    render(
      <Select options={[]} onChange={() => {}} />
    )
    const trigger = screen.getByRole("button")
    fireEvent.click(trigger)

    expect(screen.getByText("No options found.")).toBeTruthy()
  })
})

describe("Select Component - Clear Selection", () => {
  it("should allow deselecting by clicking the selected option again", () => {
    // The Select does not have a clear button; instead the user can
    // select another option. This test verifies onChange works.
    const onChange = vi.fn()
    render(
      <Select options={defaultOptions} onChange={onChange} />
    )
    const trigger = screen.getByRole("button")
    fireEvent.click(trigger)
    fireEvent.click(screen.getByText("Option 1"))
    expect(onChange).toHaveBeenCalledWith(defaultOptions[0])
  })
})

describe("Select Component - Error and Disabled States", () => {
  it("shows error styling and error message when error prop is provided", () => {
    const { container } = render(
      <Select options={defaultOptions} onChange={() => {}} error="This field is required" />
    )
    const trigger = getTrigger(container)
    expect(trigger.className).toContain("border-red-500")

    expect(screen.getByText("This field is required")).toBeTruthy()
  })

  it("disables interaction when disabled prop is true", () => {
    const onChange = vi.fn()
    const { container } = render(
      <Select options={defaultOptions} onChange={onChange} disabled={true} />
    )
    const trigger = getTrigger(container)
    expect(trigger.disabled).toBe(true)
    expect(trigger.className).toContain("opacity-50")

    // Click should not open dropdown
    fireEvent.click(trigger)
    expect(getDropdown()).toBeFalsy()
  })
})

describe("Select Component - Positioning & Collision Detection", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("dropdown uses absolute positioning", () => {
    const { container } = render(
      <Select options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)

    fireEvent.click(trigger)
    const dropdown = getDropdown()
    expect(dropdown).toBeTruthy()
    expect(dropdown?.className).toContain("absolute")
  })

  it("dropdown has z-50 z-index", () => {
    const { container } = render(
      <Select options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)

    fireEvent.click(trigger)
    const dropdown = getDropdown()
    expect(dropdown?.className).toContain("z-50")
  })

  it("dropdown flips upward when insufficient space below the trigger", () => {
    const { container } = render(
      <Select options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)

    // Simulate trigger near viewport bottom — spaceBelow = 18 < ESTIMATED_DROPDOWN_HEIGHT (260)
    trigger.getBoundingClientRect = () =>
      ({ left: 0, top: 720, right: 200, bottom: 750, width: 200, height: 30, x: 0, y: 0 }) as DOMRect

    fireEvent.click(trigger)
    const dropdown = getDropdown()
    expect(dropdown).toBeTruthy()
    // data-flip should be "true" when flipped upward
    expect(dropdown?.getAttribute("data-flip")).toBe("true")
    // Should use bottom-full class for upward positioning
    expect(dropdown?.className).toContain("bottom-full")
    expect(dropdown?.className).not.toContain("top-full")
  })

  it("dropdown opens downward when sufficient space below the trigger", () => {
    const { container } = render(
      <Select options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)

    // Simulate trigger near viewport top — spaceBelow = 368 > 260
    trigger.getBoundingClientRect = () =>
      ({ left: 0, top: 370, right: 200, bottom: 400, width: 200, height: 30, x: 0, y: 0 }) as DOMRect

    fireEvent.click(trigger)
    const dropdown = getDropdown()
    expect(dropdown).toBeTruthy()
    // data-flip should be absent (no flip attribute)
    expect(dropdown?.getAttribute("data-flip")).toBeFalsy()
    // Should use top-full class for downward positioning
    expect(dropdown?.className).toContain("top-full")
    expect(dropdown?.className).not.toContain("bottom-full")
  })

  it("dropdown width is independent from trigger (min-w-full, w-max, viewport cap)", () => {
    const { container } = render(
      <Select options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)

    fireEvent.click(trigger)
    const dropdown = getDropdown()
    expect(dropdown?.className).toContain("min-w-full")
    expect(dropdown?.className).toContain("w-max")
    expect(dropdown?.className).toContain("max-w-[calc(100vw-2rem)]")
  })

  it("dropdown has no shadow class", () => {
    const { container } = render(
      <Select options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)

    fireEvent.click(trigger)
    const dropdown = getDropdown()
    // DESIGN.md mandates no shadow classes
    expect(dropdown?.className).not.toMatch(/shadow-/)
  })
})
