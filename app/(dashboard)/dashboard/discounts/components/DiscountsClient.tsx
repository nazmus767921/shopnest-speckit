"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { PlusIcon, TagIcon, PencilIcon, Trash2Icon, PercentIcon, DollarSignIcon, Loader2Icon } from "@/lib/icons";

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DiscountCodeModal } from "./DiscountCodeModal"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import {
  getDiscountCodesAction,
  deleteDiscountCodeAction,
} from "@/app/actions/discounts"

interface DiscountCode {
  id: string
  code: string
  discountType: string
  value: string
  usageLimit: number | null
  usageCount: number
  expiresAt: Date | null
  createdAt: Date
}

interface DiscountsClientProps {
  initialCodes: DiscountCode[]
  merchantId: string
}

function formatDate(date: Date | string | null): string {
  if (!date) return "Never"
  return new Date(date).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function isExpired(expiresAt: Date | string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

export function DiscountsClient({ initialCodes, merchantId }: DiscountsClientProps) {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; codeStr: string } | null>(null)

  const { data: codes = initialCodes } = useQuery({
    queryKey: ["discounts", merchantId],
    queryFn: async () => {
      const res = await getDiscountCodesAction()
      if (!res.success) throw new Error(res.error)
      return (res.codes ?? []) as DiscountCode[]
    },
    initialData: initialCodes,
    staleTime: 30_000,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteDiscountCodeAction(id)
      if (!res.success) throw new Error(res.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts", merchantId] })
    },
  })

  const handleOpenCreate = () => {
    setEditingCode(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (code: DiscountCode) => {
    setEditingCode(code)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string, codeStr: string) => {
    setDeleteTarget({ id, codeStr })
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null)
      },
    })
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingCode(null)
    queryClient.invalidateQueries({ queryKey: ["discounts", merchantId] })
  }

  const columns = React.useMemo<ColumnDef<DiscountCode>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-foreground text-sm bg-muted border border-border px-2 py-0.5 rounded">
            {row.original.code}
          </span>
        )
      },
      {
        id: "typeValue",
        header: "Type / Value",
        cell: ({ row }) => {
          const code = row.original
          return (
            <div className="flex items-center gap-1.5">
              {code.discountType === "percent" ? (
                <PercentIcon className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <DollarSignIcon className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="text-sm font-semibold text-foreground">
                {code.discountType === "percent"
                  ? `${code.value}% off`
                  : `৳ ${parseFloat(code.value).toFixed(0)} off`}
              </span>
            </div>
          )
        }
      },
      {
        id: "usage",
        header: "Usage",
        cell: ({ row }) => {
          const code = row.original
          return (
            <span className="text-sm text-muted-foreground">
              {code.usageCount}
              {code.usageLimit !== null ? ` / ${code.usageLimit}` : ""}
            </span>
          )
        }
      },
      {
        accessorKey: "expiresAt",
        header: "Expires",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.expiresAt)}
          </span>
        )
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const code = row.original
          const expired = isExpired(code.expiresAt)
          const exhausted = code.usageLimit !== null && code.usageCount >= code.usageLimit
          return expired ? (
            <Badge variant="secondary" className="bg-red-50 text-red-700 dark:bg-red-950/20">Expired</Badge>
          ) : exhausted ? (
            <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950/20">Exhausted</Badge>
          ) : (
            <Badge variant="default">Active</Badge>
          )
        }
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const code = row.original
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenEdit(code)}
                className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                title="Edit"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(code.id, code.code)}
                disabled={deleteMutation.isPending}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors text-muted-foreground hover:text-red-650 cursor-pointer"
                title="Delete"
              >
                <Trash2Icon className="h-4 w-4" />
              </button>
            </div>
          )
        }
      }
    ],
    [deleteMutation.isPending]
  )

  return (
    <div className="flex flex-col gap-6 text-foreground">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {codes.length} code{codes.length !== 1 ? "s" : ""} total
        </p>
        <Button
          id="create-discount-code-btn"
          onClick={handleOpenCreate}
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Create Code
        </Button>
      </div>

      {codes.length === 0 ? (
        /* Empty State */
        <Card
          className="flex flex-col items-center justify-center text-center p-12 border border-border bg-card rounded-xl"
        >
          <div className="p-3 bg-muted rounded-full mb-4">
            <TagIcon className="h-8 w-8 text-foreground stroke-1.5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No discount codes yet
          </h3>
          <p className="text-sm text-muted-foreground font-light max-w-sm mt-2 mb-6">
            Create your first promotional code to share with customers and drive sales.
          </p>
          <Button
            id="create-first-discount-btn"
            onClick={handleOpenCreate}
          >
            Create First Code
          </Button>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={codes}
          getRowId={(row) => row.id}
          hideSelectionCount={true}
        />
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <DiscountCodeModal
          editingCode={editingCode}
          onClose={handleModalClose}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Discount Code "${deleteTarget?.codeStr}"?`}
        description="This action cannot be undone. Customers will no longer be able to apply this discount code during checkout."
        confirmText="Delete Code"
        variant="danger"
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
