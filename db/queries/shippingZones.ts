import { db } from "@/db"
import { shippingZones, shippingZoneDistricts, merchants } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function getShippingZonesWithDistricts(merchantId: string) {
  return await db.query.shippingZones.findMany({
    where: eq(shippingZones.merchantId, merchantId),
    with: {
      districts: true,
    },
    orderBy: (shippingZones, { asc }) => [asc(shippingZones.createdAt)],
  })
}

export async function createShippingZone(data: {
  merchantId: string
  name: string
  deliveryChargePaisa: number
  freeShippingThresholdPaisa: number | null
  districts: Array<{ division: string; district: string }>
}) {
  return await db.transaction(async (tx) => {
    // 1. Insert zone record
    const zoneId = crypto.randomUUID()
    const [newZone] = await tx
      .insert(shippingZones)
      .values({
        id: zoneId,
        merchantId: data.merchantId,
        name: data.name,
        deliveryChargePaisa: data.deliveryChargePaisa,
        freeShippingThresholdPaisa: data.freeShippingThresholdPaisa,
      })
      .returning()

    // 2. Insert assigned districts
    if (data.districts.length > 0) {
      await tx.insert(shippingZoneDistricts).values(
        data.districts.map((d) => ({
          id: crypto.randomUUID(),
          zoneId,
          merchantId: data.merchantId,
          division: d.division,
          district: d.district,
        }))
      )
    }

    return newZone
  })
}

export async function deleteShippingZone(params: { id: string; merchantId: string }) {
  await db
    .delete(shippingZones)
    .where(
      and(
        eq(shippingZones.id, params.id),
        eq(shippingZones.merchantId, params.merchantId)
      )
    )
}


