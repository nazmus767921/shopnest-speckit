"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ImageIcon, StarIcon, CopyIcon, Trash2Icon, Edit2Icon, FolderOutputIcon } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { format } from "date-fns"

interface MediaFile {
  id: string
  url: string
  key: string
  name: string
  size: number
  type: string
  folder: string
  isStarred: boolean
  createdAt: Date
}

interface MediaDataTableProps {
  data: MediaFile[]
  selectedIds: Set<string>
  onToggleSelect: (id: string, selected: boolean, shiftKey?: boolean) => void
  onSelectAll: (selected: boolean) => void
  onRename: (file: MediaFile) => void
  onMove: (file: MediaFile) => void
  onDelete: (file: MediaFile) => void
  onToggleStar: (file: MediaFile) => void
  onCopyUrl: (file: MediaFile) => void
  onDragStart?: (e: React.DragEvent, id: string) => void
}

export function MediaDataTable({
  data,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onRename,
  onMove,
  onDelete,
  onToggleStar,
  onCopyUrl,
  onDragStart
}: MediaDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const columns: ColumnDef<MediaFile>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => onSelectAll(!!value)}
          aria-label="Select all"
          className="translate-y-[2px] rounded border-foreground/20"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={(value) => onToggleSelect(row.original.id, !!value)}
          aria-label="Select row"
          className="translate-y-[2px] rounded border-foreground/20"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const file = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-foreground/10 bg-muted/30 overflow-hidden flex items-center justify-center shrink-0">
              {file.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
              )}
            </div>
            <span className="font-medium truncate max-w-[200px]" title={file.name}>{file.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "size",
      header: "Size",
      cell: ({ row }) => {
        const bytes = row.getValue("size") as number
        if (bytes < 1024) return <span className="text-muted-foreground">{bytes} B</span>
        const kb = bytes / 1024
        if (kb < 1024) return <span className="text-muted-foreground">{kb.toFixed(1)} KB</span>
        const mb = kb / 1024
        return <span className="text-muted-foreground">{mb.toFixed(1)} MB</span>
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date Uploaded",
      cell: ({ row }) => {
        return <span className="text-muted-foreground whitespace-nowrap">{format(new Date(row.getValue("createdAt")), "MMM d, yyyy")}</span>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const file = row.original
        return (
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onToggleStar(file)}>
              <StarIcon className={file.isStarred ? "fill-foreground text-foreground" : ""} size={16} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-none border-foreground/10 shadow-xl">
                <DropdownMenuItem onClick={() => onCopyUrl(file)}>
                  <CopyIcon className="mr-2 h-4 w-4" /> Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRename(file)}>
                  <Edit2Icon className="mr-2 h-4 w-4" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove(file)}>
                  <FolderOutputIcon className="mr-2 h-4 w-4" /> Move
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(file)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <Trash2Icon className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      rowSelection: Object.fromEntries(Array.from(selectedIds).map(id => [id, true]))
    },
    onRowSelectionChange: (updater) => {
      if (typeof updater === 'function') {
        const newSelection = updater(Object.fromEntries(Array.from(selectedIds).map(id => [id, true])))
        const isAllSelected = Object.keys(newSelection).length === data.length
        if (isAllSelected) onSelectAll(true)
        else if (Object.keys(newSelection).length === 0) onSelectAll(false)
      }
    }
  })

  return (
    <div className="rounded-md border border-foreground/10 bg-background overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-foreground/10 hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={selectedIds.has(row.original.id) && "selected"}
                className="group border-foreground/5 hover:bg-foreground/[0.02] cursor-pointer select-none"
                onClick={(e) => onToggleSelect(row.original.id, !selectedIds.has(row.original.id), e.shiftKey)}
                draggable
                onDragStart={(e) => onDragStart?.(e, row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} onClick={(e) => {
                    // Prevent row click if clicking interactive elements
                    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="checkbox"]')) {
                      e.stopPropagation()
                    }
                  }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                No files found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

