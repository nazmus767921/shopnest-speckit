import { describe, it, expect } from "vitest"
import { shippingZoneSchema } from "@/lib/validations/shippingZones"
import { BANGLADESH_GEOGRAPHY } from "@/lib/bangladesh-geo"

describe("Shipping Zone Validation Schema", () => {
  it("should validate a valid shipping zone payload", () => {
    const validData = {
      name: "Dhaka Core",
      deliveryChargePaisa: 6000,
      freeShippingThresholdPaisa: 50000,
      districts: [
        { division: "Dhaka", district: "Dhaka" },
        { division: "Dhaka", district: "Gazipur" },
      ],
    }
    const result = shippingZoneSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it("should fail validation on empty name, negative values, or empty districts", () => {
    const invalidData = {
      name: "",
      deliveryChargePaisa: -100,
      freeShippingThresholdPaisa: -500,
      districts: [],
    }
    const result = shippingZoneSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(3)
    }
  })
})

describe("Bangladesh Geography Static Data", () => {
  it("should contain exactly 8 divisions", () => {
    expect(BANGLADESH_GEOGRAPHY).toHaveLength(8)
  })
})
