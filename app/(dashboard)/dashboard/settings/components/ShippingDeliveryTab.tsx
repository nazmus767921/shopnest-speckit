"use client"

import React, { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { BANGLADESH_GEOGRAPHY } from "@/lib/bangladesh-geo"
import {
  createShippingZoneAction,
  deleteShippingZoneAction,
} from "@/app/actions/shippingZones"
import { Button } from "@/components/ui/primitives/Button"
import { Input } from "@/components/ui/primitives/Input"
import { FormLabel } from "@/components/ui/primitives/FormLabel"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/layout/Card"
import { Trash2, Plus, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { formatTaka } from "@/lib/utils"
import { toast } from "@/components/ui/feedback/Toast"

interface DistrictItem {
  id: string
  division: string
  district: string
}

interface ShippingZone {
  id: string
  name: string
  deliveryChargePaisa: number
  freeShippingThresholdPaisa: number | null
  districts: DistrictItem[]
}

interface Props {
  initialZones: ShippingZone[]
}

export function ShippingDeliveryTab({ initialZones }: Props) {
  const [zones, setZones] = useState<ShippingZone[]>(initialZones)
  const [isAdding, setIsAdding] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Accordion state for division selection
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({})

  // Form State for Adding Zone
  const [selectedDistricts, setSelectedDistricts] = useState<Array<{ division: string; district: string }>>([])

  const toggleDivision = (divId: string) => {
    setExpandedDivisions((prev) => ({ ...prev, [divId]: !prev[divId] }))
  }

  // Get list of districts already assigned to any existing zone
  const getAssignedDistricts = () => {
    const assigned = new Set<string>()
    zones.forEach((z) => {
      z.districts.forEach((d) => {
        assigned.add(d.district)
      })
    })
    return assigned
  }

  const assignedDistricts = getAssignedDistricts()

  // Form setup using TanStack Form for adding a zone
  const zoneForm = useForm({
    defaultValues: {
      name: "",
      chargeTaka: "",
      thresholdTaka: "",
    },
    onSubmit: async ({ value }) => {
      if (selectedDistricts.length === 0) {
        toast.error("Please select at least one district for this zone.")
        return
      }

      setSubmitting(true)

      const chargeTakaNum = Number(value.chargeTaka)
      if (isNaN(chargeTakaNum) || chargeTakaNum < 0) {
        toast.error("Delivery charge must be a non-negative number.")
        setSubmitting(false)
        return
      }

      const thresholdTakaNum = value.thresholdTaka ? Number(value.thresholdTaka) : null
      if (thresholdTakaNum !== null && (isNaN(thresholdTakaNum) || thresholdTakaNum < 0)) {
        toast.error("Free shipping threshold must be a non-negative number.")
        setSubmitting(false)
        return
      }

      const deliveryChargePaisa = Math.round(chargeTakaNum * 100)
      const freeShippingThresholdPaisa = thresholdTakaNum !== null ? Math.round(thresholdTakaNum * 100) : null

      const payload = {
        name: value.name,
        deliveryChargePaisa,
        freeShippingThresholdPaisa,
        districts: selectedDistricts,
      }

      try {
        const res = await createShippingZoneAction(payload)
        if (res.success && res.zone) {
          const zoneDistricts = selectedDistricts.map((d, index) => ({
            id: `${res.zone.id}-d-${index}`,
            division: d.division,
            district: d.district,
          }))

          const newZoneWithDistricts: ShippingZone = {
            id: res.zone.id,
            name: res.zone.name,
            deliveryChargePaisa: res.zone.deliveryChargePaisa,
            freeShippingThresholdPaisa: res.zone.freeShippingThresholdPaisa,
            districts: zoneDistricts,
          }

          setZones((prev) => [...prev, newZoneWithDistricts])
          toast.success(`Shipping zone "${payload.name}" created successfully.`)
          zoneForm.reset()
          setSelectedDistricts([])
          setIsAdding(false)
        } else {
          toast.error(res.error || "Failed to create shipping zone.")
        }
      } catch (err: any) {
        toast.error(err.message || "An unexpected error occurred.")
      } finally {
        setSubmitting(false)
      }
    },
  })

  const handleDelete = async (id: string) => {
    setDeleteId(id)

    try {
      const res = await deleteShippingZoneAction({ id })
      if (res.success) {
        setZones((prev) => prev.filter((z) => z.id !== id))
        toast.success("Shipping zone deleted successfully.")
      } else {
        toast.error(res.error || "Failed to delete shipping zone.")
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.")
    } finally {
      setDeleteId(null)
    }
  }

  const toggleDistrictSelection = (division: string, district: string) => {
    setSelectedDistricts((prev) => {
      const exists = prev.find((item) => item.district === district)
      if (exists) {
        return prev.filter((item) => item.district !== district)
      } else {
        return [...prev, { division, district }]
      }
    })
  }

  const handleSelectAllInDivision = (divisionName: string, districts: string[]) => {
    const availableDistricts = districts.filter((d) => !assignedDistricts.has(d))
    const allSelected = availableDistricts.every((d) => selectedDistricts.find((item) => item.district === d))

    if (allSelected) {
      // Deselect all in division
      setSelectedDistricts((prev) => prev.filter((item) => !districts.includes(item.district)))
    } else {
      // Select all available in division
      setSelectedDistricts((prev) => {
        const filtered = prev.filter((item) => !districts.includes(item.district))
        const newSelections = availableDistricts.map((d) => ({ division: divisionName, district: d }))
        return [...filtered, ...newSelections]
      })
    }
  }

  return (
    <div className="flex flex-col gap-6 select-text">
      {/* Shipping Zones Card */}
      <Card variant="default" className="p-6 sm:p-8 flex flex-col gap-6 rounded-2xl">
        <CardHeader className="p-0 border-b border-hairline-light pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-heading-md font-bold text-ink">Shipping Zones</CardTitle>
            <CardDescription className="text-caption text-shade-50 mt-1">
              Set custom delivery rates and optional free shipping thresholds for specific areas.
            </CardDescription>
          </div>
          {!isAdding && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setIsAdding(true)
              }}
              className="flex items-center w-full md:w-fit gap-1.5 self-start sm:self-auto rounded-full"
            >
              <Plus className="h-4 w-4" />
              <span>Add Zone</span>
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0 flex flex-col gap-6">
          {/* Add Zone Panel */}
          {isAdding && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                zoneForm.handleSubmit()
              }}
              className="border border-hairline-light p-5 rounded-xl bg-canvas-cream/15 flex flex-col gap-4 animate-fade-in"
            >
              <h3 className="text-body-strong font-semibold text-ink">Add New Shipping Zone</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <zoneForm.Field name="name">
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <FormLabel htmlFor="zone-name">Zone Name</FormLabel>
                      <Input
                        id="zone-name"
                        placeholder="e.g. Inside Dhaka, Chittagong division"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </zoneForm.Field>

                <zoneForm.Field name="chargeTaka">
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <FormLabel htmlFor="zone-charge">Delivery Charge (৳)</FormLabel>
                      <Input
                        id="zone-charge"
                        type="number"
                        min="0"
                        step="any"
                        placeholder="e.g. 50"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </zoneForm.Field>

                <zoneForm.Field name="thresholdTaka">
                  {(field) => (
                    <div className="flex flex-col gap-1.5">
                      <FormLabel htmlFor="zone-threshold">Free Shipping Limit (৳ - Optional)</FormLabel>
                      <Input
                        id="zone-threshold"
                        type="number"
                        min="0"
                        step="any"
                        placeholder="e.g. 500 (Optional)"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                  )}
                </zoneForm.Field>
              </div>

              {/* District Select accordion checklist */}
              <div className="flex flex-col gap-2 mt-2">
                <FormLabel>Assign Districts / Cities</FormLabel>
                <div className="flex flex-col gap-2 border border-hairline-light rounded-lg max-h-96 overflow-y-auto p-3">
                  {BANGLADESH_GEOGRAPHY.map((div) => {
                    const expanded = !!expandedDivisions[div.id]
                    const availableDistricts = div.districts.filter((d) => !assignedDistricts.has(d))
                    const selectedInDiv = div.districts.filter((d) => selectedDistricts.find((item) => item.district === d))
                    const isAllSelected = availableDistricts.length > 0 && availableDistricts.every((d) => selectedDistricts.find((item) => item.district === d))

                    return (
                      <div key={div.id} className="border border-hairline-light/50 rounded-lg p-2.5">
                        <div className="flex items-center justify-between gap-4">
                          <button
                            type="button"
                            onClick={() => toggleDivision(div.id)}
                            className="flex items-center gap-2 font-semibold text-ink text-caption grow text-left cursor-pointer"
                          >
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            <span>{div.name} Division</span>
                            <span className="text-micro font-normal text-shade-40">
                              ({selectedInDiv.length} selected)
                            </span>
                          </button>

                          {availableDistricts.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSelectAllInDivision(div.name, div.districts)}
                              className="text-micro font-bold text-primary hover:underline cursor-pointer"
                            >
                              {isAllSelected ? "Deselect All" : "Select All Available"}
                            </button>
                          )}
                        </div>

                        {expanded && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-hairline-light/40">
                            {div.districts.map((dist) => {
                              const isTaken = assignedDistricts.has(dist)
                              const isSelected = !!selectedDistricts.find((item) => item.district === dist)

                              return (
                                <label
                                  key={dist}
                                  className={`flex items-center gap-2 text-xs p-2 rounded-lg border transition-colors ${isTaken
                                    ? "bg-canvas-cream/20 border-hairline-light/20 text-shade-30 cursor-not-allowed"
                                    : "hover:bg-canvas-cream/10 border-hairline-light cursor-pointer"
                                    }`}
                                >
                                  <input
                                    type="checkbox"
                                    disabled={isTaken}
                                    checked={isSelected}
                                    onChange={() => toggleDistrictSelection(div.name, dist)}
                                    className="rounded border-hairline-light text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                  />
                                  <span className="truncate" title={dist}>
                                    {dist}
                                  </span>
                                  {isTaken && <span className="text-[10px] text-shade-30 font-light font-sans">(Taken)</span>}
                                </label>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-hairline-light/60 pt-4 mt-2">
                <Button
                  type="button"
                  variant="outline-light"
                  onClick={() => {
                    setIsAdding(false)
                    zoneForm.reset()
                    setSelectedDistricts([])
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Saving Zone...
                    </>
                  ) : (
                    "Save Zone"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Zones List */}
          {zones.length === 0 ? (
            <div className="p-8 border border-dashed border-hairline-light rounded-xl text-center text-caption text-shade-50">
              No shipping zones configured yet. Add a zone to enable district-based delivery pricing.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {zones.map((zone) => {
                // Group districts by division for nice visualization
                const districtsByDivision = zone.districts.reduce<Record<string, string[]>>((acc, d) => {
                  if (!acc[d.division]) {
                    acc[d.division] = []
                  }
                  acc[d.division].push(d.district)
                  return acc
                }, {})

                return (
                  <Card key={zone.id} className="p-5 border border-hairline-light flex flex-col gap-4 rounded-2xl bg-zinc-50/15">
                    <div className="flex justify-between items-start gap-4 pb-3 border-b border-hairline-light/60">
                      <div className="flex flex-col gap-1">
                        <span className="text-body-strong font-bold text-ink">{zone.name}</span>
                        <div className="flex flex-wrap items-center gap-3 text-caption mt-1">
                          <span className="text-emerald-800 font-bold">
                            Rate: {zone.deliveryChargePaisa === 0 ? "Free Shipping" : formatTaka(zone.deliveryChargePaisa)}
                          </span>
                          {zone.freeShippingThresholdPaisa !== null && (
                            <span className="text-shade-50">
                              (Free on orders above {formatTaka(zone.freeShippingThresholdPaisa)})
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(zone.id)}
                        disabled={deleteId === zone.id}
                        className="p-2 rounded-full text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete Zone"
                      >
                        {deleteId === zone.id ? (
                          <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-4.5 w-4.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-micro font-semibold text-shade-40 uppercase tracking-wider">
                        Assigned Locations ({zone.districts.length})
                      </span>
                      <div className="flex flex-col gap-2.5">
                        {Object.entries(districtsByDivision).map(([division, districts]) => (
                          <div key={division} className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-shade-50">{division} Division</span>
                            <div className="flex flex-wrap gap-1.5 mt-0.5">
                              {districts.map((d) => (
                                <span
                                  key={d}
                                  className="text-micro bg-canvas-cream/15 text-shade-60 px-2 py-0.5 rounded-full border border-hairline-light/40"
                                >
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
