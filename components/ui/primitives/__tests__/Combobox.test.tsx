import { describe, it, expect, vi, afterEach } from "vitest"
import { render, fireEvent, cleanup } from "@testing-library/react"
import * as React from "react"
import { Combobox } from "@/components/ui/primitives/Combobox"

// Helper to query the trigger button inside the Combobox
const getTrigger = (container: HTMLElement) => container.querySelector("button") as HTMLButtonElement
const getDropdown = () => document.querySelector('[data-testid="combobox-dropdown"]')

const defaultOptions = [
  { label: "Option 1", value: "1" },
  { label: "Option 2", value: "2" },
  { label: "Option 3", value: "3" },
]

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("Combobox Component - Positioning & Collision Detection", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("dropdown uses absolute positioning", () => {
    const { container } = render(
      <Combobox options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)

    fireEvent.click(trigger)
    const dropdown = getDropdown()
    expect(dropdown).toBeTruthy()
    expect((dropdown as HTMLElement)?.className).toContain("absolute")
  })

  it("dropdown has z-50 z-index", () => {
    const { container } = render(
      <Combobox options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)

    fireEvent.click(trigger)
    const dropdown = getDropdown()
    expect((dropdown as HTMLElement)?.className).toContain("z-50")
  })

  it("dropdown flips upward when insufficient space below the trigger", () => {
    const { container } = render(
      <Combobox options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)

    // Simulate trigger near viewport bottom — spaceBelow = 18 < 260
    trigger.getBoundingClientRect = () =>
      ({ left: 0, top: 720, right: 200, bottom: 750, width: 200, height: 30, x: 0, y: 0 }) as DOMRect

    fireEvent.click(trigger)
    const dropdown = getDropdown()
    expect(dropdown).toBeTruthy()
    expect((dropdown as HTMLElement)?.getAttribute("data-flip")).toBe("true")
    // Should use bottom-full class for upward positioning
    expect((dropdown as HTMLElement)?.className).toContain("bottom-full")
    expect((dropdown as HTMLElement)?.className).not.toContain("top-full")
  })

  it("dropdown opens downward when sufficient space below the trigger", () => {
    const { container } = render(
      <Combobox options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)

    // Simulate trigger near viewport top — spaceBelow = 368 > 260
    trigger.getBoundingClientRect = () =>
      ({ left: 0, top: 370, right: 200, bottom: 400, width: 200, height: 30, x: 0, y: 0 }) as DOMRect

    fireEvent.click(trigger)
    const dropdown = getDropdown()
    expect(dropdown).toBeTruthy()
    expect((dropdown as HTMLElement)?.getAttribute("data-flip")).toBeFalsy()
    // Should use top-full class for downward positioning
    expect((dropdown as HTMLElement)?.className).toContain("top-full")
    expect((dropdown as HTMLElement)?.className).not.toContain("bottom-full")
  })

  it("dropdown width is independent from trigger (min-w-full, w-max, viewport cap)", () => {
    const { container } = render(
      <Combobox options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)

    fireEvent.click(trigger)
    const dropdown = getDropdown()
    expect((dropdown as HTMLElement)?.className).toContain("min-w-full")
    expect((dropdown as HTMLElement)?.className).toContain("w-max")
    expect((dropdown as HTMLElement)?.className).toContain("max-w-[calc(100vw-2rem)]")
  })

  it("dropdown has no shadow class", () => {
    const { container } = render(
      <Combobox options={defaultOptions} onChange={() => {}} />
    )
    const trigger = getTrigger(container)

    fireEvent.click(trigger)
    const dropdown = getDropdown()
    expect((dropdown as HTMLElement)?.className).not.toMatch(/shadow-/)
  })
})
