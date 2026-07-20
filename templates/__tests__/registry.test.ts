import { expect, test, describe } from "vitest"
import { getTemplate, templates } from "../registry"

describe("Template Registry", () => {
  test("getTemplate('elegance') returns elegance template", () => {
    const template = getTemplate("elegance")
    expect(template).toBe(templates.elegance)
  })

  test("unknown slug falls back to elegance template", () => {
    const template = getTemplate("unknown-slug")
    expect(template).toBe(templates.elegance)
  })
})
