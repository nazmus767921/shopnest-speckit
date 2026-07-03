"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Tag, Pencil, Trash2, Percent, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/primitives/Button"
import { Badge } from "@/components/ui/primitives/Badge"
import { Card } from "@/components/ui/layout/Card"
import { DiscountCodeModal } from "./DiscountCodeModal"
import { AlertDialog } from "@/components/ui/feedback/AlertDialog"
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

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-caption text-shade-50">
          {codes.length} code{codes.length !== 1 ? "s" : ""} total
        </p>
        <Button
          id="create-discount-code-btn"
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Code
        </Button>
      </div>

      {codes.length === 0 ? (
        /* Empty State */
        <Card
          variant="default"
          className="flex flex-col items-center justify-center text-center p-12 border border-hairline-light bg-canvas-light"
        >
          <div className="p-3 bg-pistachio-10 rounded-full mb-4">
            <Tag className="h-8 w-8 text-ink stroke-1.5" />
          </div>
          <h3 className="font-display text-heading-md font-semibold text-ink">
            No discount codes yet
          </h3>
          <p className="text-caption text-shade-50 font-light max-w-sm mt-2 mb-6">
            Create your first promotional code to share with customers and drive sales.
          </p>
          <Button
            id="create-first-discount-btn"
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
          >
            Create First Code
          </Button>
        </Card>
      ) : (
        /* Discount Codes Table */
        <div className="border border-hairline-light rounded-2xl bg-canvas-light overflow-hidden">
          <table className="w-full text-left">
            <thead className="border-b border-hairline-light bg-canvas-cream/30">
              <tr>
                <th className="px-5 py-3 text-micro font-bold text-shade-40 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-5 py-3 text-micro font-bold text-shade-40 uppercase tracking-wider">
                  Type / Value
                </th>
                <th className="px-5 py-3 text-micro font-bold text-shade-40 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-5 py-3 text-micro font-bold text-shade-40 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-5 py-3 text-micro font-bold text-shade-40 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-micro font-bold text-shade-40 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-light">
              {codes.map((code) => {
                const expired = isExpired(code.expiresAt)
                const exhausted =
                  code.usageLimit !== null && code.usageCount >= code.usageLimit

                return (
                  <tr
                    key={code.id}
                    className="hover:bg-canvas-cream/20 transition-colors"
                  >
                    {/* Code string */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-semibold text-ink text-body-md bg-canvas-cream border border-hairline-light px-2 py-0.5 rounded">
                        {code.code}
                      </span>
                    </td>

                    {/* Type / Value */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {code.discountType === "percent" ? (
                          <Percent className="h-3.5 w-3.5 text-shade-50" />
                        ) : (
                          <DollarSign className="h-3.5 w-3.5 text-shade-50" />
                        )}
                        <span className="text-caption font-semibold text-ink">
                          {code.discountType === "percent"
                            ? `${code.value}% off`
                            : `৳ ${parseFloat(code.value).toFixed(0)} off`}
                        </span>
                      </div>
                    </td>

                    {/* Usage */}
                    <td className="px-5 py-3.5 text-caption text-shade-60">
                      {code.usageCount}
                      {code.usageLimit !== null ? ` / ${code.usageLimit}` : ""}
                    </td>

                    {/* Expires */}
                    <td className="px-5 py-3.5 text-caption text-shade-60">
                      {formatDate(code.expiresAt)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      {expired ? (
                        <Badge variant="shade" className="bg-red-50 text-red-700">Expired</Badge>
                      ) : exhausted ? (
                        <Badge variant="shade" className="bg-amber-50 text-amber-700">Exhausted</Badge>
                      ) : (
                        <Badge variant="mint">Active</Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(code)}
                          className="p-1.5 hover:bg-canvas-cream rounded-md transition-colors text-shade-50 hover:text-ink"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(code.id, code.code)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 hover:bg-red-50 rounded-md transition-colors text-shade-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <DiscountCodeModal
          editingCode={editingCode}
          onClose={handleModalClose}
        />
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
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
