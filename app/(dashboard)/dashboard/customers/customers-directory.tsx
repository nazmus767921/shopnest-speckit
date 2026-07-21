"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { type ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { 
  SearchIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ExternalLinkIcon 
} from "@/lib/icons"

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

  // Define DataTable columns mapping
  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      header: "Customer Name",
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">{row.original.name}</span>
      )
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const cleanEmail = row.original.email.includes("+") 
          ? row.original.email.split("+")[0] + "@" + row.original.email.split("@")[1] 
          : row.original.email
        return <span className="font-semibold text-slate-650">{cleanEmail}</span>
      }
    },
    {
      accessorKey: "banned",
      header: "Status",
      cell: ({ row }) => (
        row.original.banned ? (
          <Badge variant="destructive">Suspended</Badge>
        ) : (
          <Badge variant="mint">Active</Badge>
        )
      )
    },
    {
      accessorKey: "createdAt",
      header: "Joined Date",
      cell: ({ row }) => {
        const dateStr = new Date(row.original.createdAt).toLocaleDateString("en-BD", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
        return <span className="font-semibold text-slate-500">{dateStr}</span>
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Link 
            href={`/dashboard/customers/${row.original.id}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-650 hover:text-indigo-900 hover:underline cursor-pointer"
          >
            View Details
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-6 text-foreground pb-24 relative font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl tracking-tight text-slate-900 font-semibold leading-none">
            Customer Directory
          </h1>
          <p className="text-sm text-slate-505 font-medium mt-1">
            Manage your store&apos;s customer database, view details, and handle account status suspensions
          </p>
        </div>
      </div>

      {/* Search Controls & Count Badge Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full max-w-md">
          <div className="relative w-full">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="search-input"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search customers by name or email..."
              className="pl-9 rounded-xl border-slate-200 focus-visible:bg-white text-sm h-10"
            />
          </div>
          <Button type="submit" className="rounded-xl font-semibold h-10 px-5 cursor-pointer">
            Search
          </Button>
        </form>
        <div className="text-xs text-slate-500 font-bold border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-2.5 w-fit">
          Total Customers: <span className="font-extrabold text-slate-900">{totalCount}</span>
        </div>
      </div>

      {/* Customers List Table Card Container */}
      <DataTable 
        columns={columns} 
        data={customers} 
        hidePagination 
      />

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <span className="text-sm text-slate-505 font-semibold">
            Showing Page <span className="font-extrabold text-slate-900">{currentPage}</span> of{" "}
            <span className="font-extrabold text-slate-900">{totalPages}</span>
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl h-9 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl h-9 cursor-pointer flex items-center gap-1"
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
