"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { SearchIcon } from "@/lib/icons"

interface Customer {
  id: string
  name: string
  email: string
  banned: boolean | null
  createdAt: Date | string
}

interface CustomersDirectoryProps {
  customers: Customer[]
  totalCount: number
  search: string
  limit: number
  offset: number
}

export default function CustomersDirectory({
  customers,
  totalCount,
  search: initialSearch,
  limit,
  offset,
}: CustomersDirectoryProps) {
  const router = useRouter()
  const [searchVal, setSearchVal] = useState(initialSearch)
  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(totalCount / limit)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchVal) params.set("search", searchVal)
    params.set("page", "1")
    router.push(`/dashboard/customers?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams()
    if (searchVal) params.set("search", searchVal)
    params.set("page", page.toString())
    router.push(`/dashboard/customers?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-6 w-full p-6 bg-white border border-gray-150 rounded-2xl shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Customers</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your store's customer database and moderation settings
          </p>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full max-w-md">
        <div className="relative w-full">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            id="search-input"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search customers by name or email..."
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="border border-gray-150 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-150 text-left text-sm">
          <thead className="bg-gray-50 font-medium text-gray-500">
            <tr>
              <th className="px-6 py-3.5">Customer Name</th>
              <th className="px-6 py-3.5">Email</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Joined Date</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((c) => {
                const cleanEmail = c.email.includes("+") ? c.email.split("+")[0] + "@" + c.email.split("@")[1] : c.email
                const dateStr = new Date(c.createdAt).toLocaleDateString("en-BD", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{c.name}</td>
                    <td className="px-6 py-4">{cleanEmail}</td>
                    <td className="px-6 py-4">
                      {c.banned ? (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-600 rounded-full border border-red-100">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-green-50 text-green-600 rounded-full border border-green-100">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">{dateStr}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/customers/${c.id}`}>
                        <span className="text-sm font-medium text-primary hover:underline cursor-pointer">
                          View Details
                        </span>
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-150">
          <span className="text-sm text-gray-500">
            Showing Page <span className="font-semibold text-gray-900">{currentPage}</span> of{" "}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
