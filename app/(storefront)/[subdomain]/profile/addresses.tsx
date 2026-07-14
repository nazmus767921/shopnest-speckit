"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Loader2Icon, Trash2Icon, EditIcon, PlusIcon } from "@/lib/icons"
import { saveCustomerAddress, deleteCustomerAddress } from "../actions"

interface Address {
  id: string
  name: string
  phone: string
  address: string
  city: string
  isDefault: boolean
}

interface AddressesFormProps {
  subdomain: string
  userId: string
  addresses: Address[]
}

export default function AddressesForm({ subdomain, userId, addresses }: AddressesFormProps) {
  const router = useRouter()
  const [editingAddress, setEditingAddress] = useState<Partial<Address> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAddress?.name || !editingAddress?.phone || !editingAddress?.address || !editingAddress?.city) {
      setError("All fields are required")
      return
    }

    setError(null)
    setLoading(true)
    try {
      const res = await saveCustomerAddress({
        id: editingAddress.id,
        name: editingAddress.name,
        phone: editingAddress.phone,
        address: editingAddress.address,
        city: editingAddress.city,
        isDefault: !!editingAddress.isDefault,
      })

      if (res.error) {
        setError(res.error)
      } else {
        setEditingAddress(null)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return
    try {
      const res = await deleteCustomerAddress(id)
      if (res.error) {
        alert(res.error)
      } else {
        router.refresh()
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete address")
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Address Book</h3>
        {!editingAddress && (
          <Button
            onClick={() => setEditingAddress({ name: "", phone: "", address: "", city: "", isDefault: false })}
            size="sm"
            className="flex items-center gap-1.5"
          >
            <PlusIcon className="h-4 w-4" />
            Add New Address
          </Button>
        )}
      </div>

      {editingAddress ? (
        <form onSubmit={handleSave} className="flex flex-col gap-4 p-5 bg-gray-50 border border-gray-150 rounded-xl">
          <h4 className="text-sm font-semibold text-gray-800">
            {editingAddress.id ? "Edit Address" : "Add New Address"}
          </h4>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">Contact Name</label>
              <Input
                id="name"
                value={editingAddress.name || ""}
                onChange={(e) => setEditingAddress({ ...editingAddress, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</label>
              <Input
                id="phone"
                value={editingAddress.phone || ""}
                onChange={(e) => setEditingAddress({ ...editingAddress, phone: e.target.value })}
                placeholder="01711111111"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="address" className="text-sm font-medium text-gray-700">Shipping Address</label>
            <Input
              id="address"
              value={editingAddress.address || ""}
              onChange={(e) => setEditingAddress({ ...editingAddress, address: e.target.value })}
              placeholder="Road 4, House 12, Apt 3B, Banani"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="city" className="text-sm font-medium text-gray-700">City</label>
              <Input
                id="city"
                value={editingAddress.city || ""}
                onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
                placeholder="Dhaka"
              />
            </div>

            <div className="flex items-center gap-2 mt-6">
              <input
                id="isDefault"
                type="checkbox"
                checked={!!editingAddress.isDefault}
                onChange={(e) => setEditingAddress({ ...editingAddress, isDefault: e.target.checked })}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 select-none">
                Set as default shipping address
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingAddress(null)}
              disabled={loading}
              size="sm"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} size="sm" className="flex items-center gap-1.5">
              {loading && <Loader2Icon className="h-4 w-4 animate-spin" />}
              Save Address
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.length === 0 ? (
            <div className="col-span-full py-8 text-center border border-dashed border-gray-200 rounded-xl text-gray-400">
              No addresses saved yet. Click "Add New Address" above.
            </div>
          ) : (
            addresses.map((addr) => (
              <div key={addr.id} className="flex flex-col justify-between p-4 bg-white border border-gray-150 rounded-xl relative shadow-sm hover:border-gray-300 transition-colors">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{addr.name}</span>
                    {addr.isDefault && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{addr.phone}</span>
                  <p className="text-sm text-gray-700 mt-1.5">{addr.address}, {addr.city}</p>
                </div>

                <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-gray-50">
                  <Button
                    onClick={() => setEditingAddress(addr)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-gray-900"
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(addr.id)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
