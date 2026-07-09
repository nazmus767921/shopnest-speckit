"use client"

import React, { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { BANGLADESH_GEOGRAPHY } from "@/lib/bangladesh-geo"
import {
  createShippingZoneAction,
  deleteShippingZoneAction,
} from "@/app/actions/shippingZones"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label as FormLabel } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Trash2, Plus, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { formatTaka } from "@/lib/utils"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
      setSelectedDistricts((prev) => prev.filter((item) => !districts.includes(item.district)))
    } else {
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
      <Card className="p-6 sm:p-8 flex flex-col gap-6 rounded-xl border border-border">
        <CardHeader className="p-0 border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">Shipping Zones</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Set custom delivery rates and optional free shipping thresholds for specific areas.
            </CardDescription>
          </div>
          {!isAdding && (
            <Button
              type="button"
              onClick={() => {
                setIsAdding(true)
              }}
              className="flex items-center w-full md:w-fit gap-1.5 self-start sm:self-auto rounded-md"
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
              className="border border-border p-5 rounded-lg bg-muted/5 flex flex-col gap-4 animate-fade-in"
            >
              <h3 className="text-base font-semibold text-foreground">Add New Shipping Zone</h3>

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
                <div className="flex flex-col gap-2 border border-border rounded-lg max-h-96 overflow-y-auto p-3">
                  {BANGLADESH_GEOGRAPHY.map((div) => {
                    const expanded = !!expandedDivisions[div.id]
                    const availableDistricts = div.districts.filter((d) => !assignedDistricts.has(d))
                    const selectedInDiv = div.districts.filter((d) => selectedDistricts.find((item) => item.district === d))
                    const isAllSelected = availableDistricts.length > 0 && availableDistricts.every((d) => selectedDistricts.find((item) => item.district === d))

                    return (
                      <div key={div.id} className="border border-border/50 rounded-lg p-2.5">
                        <div className="flex items-center justify-between gap-4">
                          <button
                            type="button"
                            onClick={() => toggleDivision(div.id)}
                            className="flex items-center gap-2 font-semibold text-foreground text-sm grow text-left cursor-pointer"
                          >
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            <span>{div.name} Division</span>
                            <span className="text-xs font-normal text-muted-foreground">
                              ({selectedInDiv.length} selected)
                            </span>
                          </button>

                          {availableDistricts.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSelectAllInDivision(div.name, div.districts)}
                              className="text-xs font-bold text-primary hover:underline cursor-pointer"
                            >
                              {isAllSelected ? "Deselect All" : "Select All Available"}
                            </button>
                          )}
                        </div>

                        {expanded && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-border/40">
                            {div.districts.map((dist) => {
                              const isTaken = assignedDistricts.has(dist)
                              const isSelected = !!selectedDistricts.find((item) => item.district === dist)

                              return (
                                <label
                                  key={dist}
                                  className={cn(
                                    "flex items-center gap-2 text-xs p-2 rounded-lg border transition-colors",
                                    isTaken
                                      ? "bg-muted/20 border-border/20 text-muted-foreground/35 cursor-not-allowed"
                                      : "hover:bg-muted/10 border-border cursor-pointer"
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    disabled={isTaken}
                                    checked={isSelected}
                                    onChange={() => toggleDistrictSelection(div.name, dist)}
                                    className="rounded border-border text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                  />
                                  <span className="truncate" title={dist}>
                                    {dist}
                                  </span>
                                  {isTaken && <span className="text-[10px] text-muted-foreground/40 font-light">(Taken)</span>}
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

              <div className="flex justify-end gap-3 border-t border-border/60 pt-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false)
                    zoneForm.reset()
                    setSelectedDistricts([])
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
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
            <div className="p-8 border border-dashed border-border rounded-lg text-center text-sm text-muted-foreground">
              No shipping zones configured yet. Add a zone to enable district-based delivery pricing.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {zones.map((zone) => {
                const districtsByDivision = zone.districts.reduce<Record<string, string[]>>((acc, d) => {
                  if (!acc[d.division]) {
                    acc[d.division] = []
                  }
                  acc[d.division].push(d.district)
                  return acc
                }, {})

                return (
                  <Card key={zone.id} className="p-5 border border-border flex flex-col gap-4 rounded-xl bg-muted/5">
                    <div className="flex justify-between items-start gap-4 pb-3 border-b border-border/60">
                      <div className="flex flex-col gap-1">
                        <span className="text-base font-semibold text-foreground">{zone.name}</span>
                        <div className="flex flex-wrap items-center gap-3 text-sm mt-1">
                          <span className="text-emerald-800 dark:text-emerald-400 font-bold">
                            Rate: {zone.deliveryChargePaisa === 0 ? "Free Shipping" : formatTaka(zone.deliveryChargePaisa)}
                          </span>
                          {zone.freeShippingThresholdPaisa !== null && (
                            <span className="text-muted-foreground">
                              (Free on orders above {formatTaka(zone.freeShippingThresholdPaisa)})
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(zone.id)}
                        disabled={deleteId === zone.id}
                        className="p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer disabled:opacity-50"
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
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Assigned Locations ({zone.districts.length})
                      </span>
                      <div className="flex flex-col gap-2.5">
                        {Object.entries(districtsByDivision).map(([division, districts]) => (
                          <div key={division} className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-muted-foreground">{division} Division</span>
                            <div className="flex flex-wrap gap-1.5 mt-0.5">
                              {districts.map((d) => (
                                <span
                                  key={d}
                                  className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border"
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
