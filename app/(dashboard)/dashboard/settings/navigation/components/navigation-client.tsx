"use client"

import React, { useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { Plus, Trash2, ArrowUp, ArrowDown, ChevronRight, Menu, Save, RotateCcw, X, Edit, Link2, PanelBottom } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label as FormLabel } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { saveMenuItemsAction, resetMenuToDefaultsAction } from "@/app/actions/navigation"
import { menuItemSchema } from "@/lib/validations/navigation"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NavigationClientProps {
  merchantId: string
  initialMenus: any[]
  pages: Array<{ id: string; title: string; slug: string }>
  categories: Array<{ id: string; name: string; slug: string }>
  products: Array<{ id: string; name: string; slug: string }>
}

interface LocalMenuItem {
  id: string
  parentId: string | null
  label: string
  type: "url" | "page" | "category" | "product"
  referenceId: string | null
  url: string | null
  position: number
}

export function NavigationClient({
  merchantId,
  initialMenus,
  pages,
  categories,
  products,
}: NavigationClientProps) {
  const [menus, setMenus] = useState(initialMenus)
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(
    initialMenus.length > 0 ? initialMenus[0].id : null
  )

  const [items, setItems] = useState<LocalMenuItem[]>([])
  const [initialItems, setInitialItems] = useState<LocalMenuItem[]>([])

  const hasChanges = JSON.stringify(items) !== JSON.stringify(initialItems)

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [itemLabel, setItemLabel] = useState("")
  const [itemType, setItemType] = useState<"text-only" | "url" | "page" | "category" | "product">("url")
  const [itemReferenceId, setItemReferenceId] = useState("")
  const [itemUrl, setItemUrl] = useState("")
  const [itemParentId, setItemParentId] = useState("")
  const [itemError, setItemError] = useState<string | null>(null)

  const [globalError, setGlobalError] = useState<string | null>(null)
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedMenuId) {
      setItems([])
      return
    }
    const currentMenu = menus.find((m) => m.id === selectedMenuId)
    if (currentMenu && currentMenu.items) {
      const parents = currentMenu.items.filter((it: any) => !it.parentId)
      const children = currentMenu.items.filter((it: any) => !!it.parentId)

      parents.sort((a: any, b: any) => a.position - b.position)

      const sortedList: LocalMenuItem[] = []
      for (const parent of parents) {
        sortedList.push(parent)
        const parentChildren = children
          .filter((c: any) => c.parentId === parent.id)
          .sort((a: any, b: any) => a.position - b.position)
        sortedList.push(...parentChildren)
      }

      setItems(sortedList)
      setInitialItems(sortedList)
    } else {
      setItems([])
      setInitialItems([])
    }
    closeDrawer()
  }, [selectedMenuId, menus])

  const closeDrawer = () => {
    setIsDrawerOpen(false)
    setEditingItemId(null)
    setItemLabel("")
    setItemType("url")
    setItemReferenceId("")
    setItemUrl("")
    setItemParentId("")
    setItemError(null)
  }

  const openAddDrawer = (parentId: string = "") => {
    closeDrawer()
    setItemParentId(parentId)
    setIsDrawerOpen(true)
  }

  const openEditDrawer = (item: LocalMenuItem) => {
    closeDrawer()
    setEditingItemId(item.id)
    setItemLabel(item.label)
    
    if (item.type === "url" && item.url === "#") {
      setItemType("text-only")
      setItemUrl("")
    } else {
      setItemType(item.type)
      setItemUrl(item.url || "")
    }

    setItemReferenceId(item.referenceId || "")
    setItemParentId(item.parentId || "")
    setIsDrawerOpen(true)
  }

  const resetMenuMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await resetMenuToDefaultsAction(id)
      if (!res.success) throw new Error(res.error || "Failed to reset menu")
    },
    onSuccess: () => {
      window.location.reload()
    },
    onError: (err: any) => {
      setGlobalError(err.message)
    },
  })

  const saveItemsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMenuId) return
      for (const item of items) {
        const val = menuItemSchema.safeParse(item)
        if (!val.success) {
          throw new Error(`Item "${item.label}": ${val.error.issues[0].message}`)
        }
      }
      const res = await saveMenuItemsAction(selectedMenuId, items)
      if (!res.success) throw new Error(res.error)
      return res.items
    },
    onSuccess: (savedItems) => {
      setGlobalSuccess("Menu structure saved successfully!")
      setGlobalError(null)
      setMenus(
        menus.map((m) =>
          m.id === selectedMenuId ? { ...m, items: savedItems } : m
        )
      )
    },
    onError: (err: any) => {
      setGlobalError(err.message)
      setGlobalSuccess(null)
    },
  })

  const handleDrawerFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setItemError(null)

    if (!itemLabel.trim()) {
      setItemError("Label is required")
      return
    }

    const tempId = crypto.randomUUID()
    const isTextOnly = itemType === "text-only"

    const rawItem = {
      id: editingItemId || tempId,
      parentId: itemParentId || null,
      label: itemLabel,
      type: isTextOnly ? "url" : itemType,
      referenceId: (!isTextOnly && itemType !== "url") ? itemReferenceId : null,
      url: isTextOnly ? "#" : (itemType === "url" ? itemUrl : null),
      position: items.length,
    }

    const val = menuItemSchema.safeParse(rawItem)
    if (!val.success) {
      setItemError(val.error.issues[0].message)
      return
    }

    if (editingItemId) {
      const updated = items.map((it) =>
        it.id === editingItemId
          ? {
              ...it,
              label: rawItem.label,
              type: rawItem.type as any,
              referenceId: rawItem.referenceId,
              url: rawItem.url,
              parentId: rawItem.parentId,
            }
          : it
      )
      rebuildFlatListFromHierarchy(updated)
    } else {
      const updated = [...items, { ...rawItem, type: rawItem.type as any }]
      rebuildFlatListFromHierarchy(updated)
    }

    closeDrawer()
  }

  const handleDeleteItem = (id: string) => {
    if (confirm("Are you sure you want to delete this link? Deleting a parent link will also delete all of its nested sub-links.")) {
      const remaining = items.filter((it) => it.id !== id && it.parentId !== id)
      rebuildFlatListFromHierarchy(remaining)
    }
  }

  const moveParent = (parentId: string, direction: "up" | "down") => {
    const parentList = items.filter((it) => !it.parentId)
    const idx = parentList.findIndex((p) => p.id === parentId)
    if (idx === -1) return
    const nextIdx = direction === "up" ? idx - 1 : idx + 1
    if (nextIdx < 0 || nextIdx >= parentList.length) return

    const temp = parentList[idx]
    parentList[idx] = parentList[nextIdx]
    parentList[nextIdx] = temp

    rebuildFlatListFromHierarchy(items, parentList)
  }

  const moveChild = (childId: string, parentId: string, direction: "up" | "down") => {
    const parentList = items.filter((it) => !it.parentId)
    const childList = items.filter((it) => it.parentId === parentId)
    const idx = childList.findIndex((c) => c.id === childId)
    if (idx === -1) return
    const nextIdx = direction === "up" ? idx - 1 : idx + 1
    if (nextIdx < 0 || nextIdx >= childList.length) return

    const temp = childList[idx]
    childList[idx] = childList[nextIdx]
    childList[nextIdx] = temp

    rebuildFlatListFromHierarchy(items, parentList, { [parentId]: childList })
  }

  const rebuildFlatListFromHierarchy = (
    baseItems: LocalMenuItem[],
    customParentsOrder?: LocalMenuItem[],
    customChildrenMap: Record<string, LocalMenuItem[]> = {}
  ) => {
    const parents = customParentsOrder || baseItems.filter((it) => !it.parentId)
    const children = baseItems.filter((it) => !!it.parentId)

    const flat: LocalMenuItem[] = []
    let globalPos = 0

    parents.forEach((parent) => {
      flat.push({ ...parent, position: globalPos++ })

      const parentChildren = customChildrenMap[parent.id] !== undefined
        ? customChildrenMap[parent.id]
        : children.filter((c) => c.parentId === parent.id)

      parentChildren.forEach((child) => {
        flat.push({ ...child, position: globalPos++ })
      })
    })

    setItems(flat)
  }

  const selectedMenu = menus.find((m) => m.id === selectedMenuId)
  const parents = items.filter((it) => !it.parentId)
  const getChildren = (parentId: string) => items.filter((it) => it.parentId === parentId)

  const potentialParents = items.filter(
    (it) => !it.parentId && it.id !== editingItemId
  )

  const typeOptions = [
    { value: "text-only", label: "Text Only / Category Header (No link)" },
    { value: "url", label: "Custom URL" },
    { value: "page", label: "Standard Page" },
    { value: "category", label: "Category Collection" },
    { value: "product", label: "Product Page" },
  ]
  const selectedTypeOpt = typeOptions.find(o => o.value === itemType) || null

  const refOptions =
    itemType === "page"
      ? pages.map((p) => ({ value: p.id, label: `${p.title} (${p.slug})` }))
      : itemType === "category"
      ? categories.map((c) => ({ value: c.id, label: `${c.name} (${c.slug})` }))
      : itemType === "product"
      ? products.map((pr) => ({ value: pr.id, label: `${pr.name} (${pr.slug})` }))
      : []
  const selectedRefOpt = refOptions.find(o => o.value === itemReferenceId) || null

  const parentOptions = [
    { value: "none", label: "None (Top-level Link)" },
    ...potentialParents.map((parent) => ({ value: parent.id, label: parent.label }))
  ]
  const selectedParentOpt = parentOptions.find(o => o.value === (itemParentId || "none")) || null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative items-start text-foreground">
      
      {/* Left: Menus List Card */}
      <div className="flex flex-col gap-6">
        <Card className="p-6 flex flex-col gap-6 border-border bg-card shadow-none rounded-xl">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-4">
            Navigation Settings
          </h2>

          <div className="flex flex-col gap-2">
            {[...menus].sort((a, b) => {
              if (a.slug === "main-menu") return -1
              if (b.slug === "main-menu") return 1
              if (a.slug === "footer-menu") return -1
              if (b.slug === "footer-menu") return 1
              return 0
            }).map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMenuId(m.id)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center justify-between border",
                  selectedMenuId === m.id
                    ? "bg-primary/5 text-primary border-primary/20 font-medium"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-2">
                  {m.slug === "main-menu" ? (
                    <Menu className="h-4 w-4" />
                  ) : m.slug === "footer-menu" ? (
                    <PanelBottom className="h-4 w-4" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  {m.name}
                </span>
                <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                  {m.slug}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Right: Tree Builder Dashboard */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {selectedMenu ? (
          <>
            {globalError && (
              <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm">
                {globalError}
              </div>
            )}
            {globalSuccess && (
              <div className="p-4 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 rounded-lg text-sm">
                {globalSuccess}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground tracking-tight">
                  {selectedMenu.name} Links
                </h2>
                <p className="text-sm text-muted-foreground font-light mt-0.5">
                  Configure dynamic links, dropdown nesting, or text category headers.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Are you sure you want to reset this menu to its defaults? Any current link configuration will be lost.")) {
                      resetMenuMutation.mutate(selectedMenu.id)
                    }
                  }}
                  className="rounded-md flex items-center gap-1.5 text-xs font-medium"
                  disabled={resetMenuMutation.isPending}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Defaults
                </Button>

                <Button
                  onClick={() => saveItemsMutation.mutate()}
                  disabled={saveItemsMutation.isPending || !hasChanges}
                  className="rounded-md px-5 py-2 text-sm font-semibold flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{saveItemsMutation.isPending ? "Saving..." : "Save Changes"}</span>
                </Button>
              </div>
            </div>

            {/* Tree structure representation */}
            <div className="flex flex-col gap-4">
              {parents.map((parent, parentIdx) => {
                const childrenItems = getChildren(parent.id)
                return (
                  <Card key={parent.id} className="p-5 border-border bg-card shadow-none flex flex-col gap-4 rounded-xl relative overflow-hidden group">
                    
                    {/* Parent row item */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Menu className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                            {parent.label}
                            {parent.type === "url" && parent.url === "#" && (
                              <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold font-mono">
                                Text Header
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground leading-none mt-1">
                            {parent.type === "url" && parent.url === "#"
                              ? "Category label header (no hyperlink)"
                              : parent.type === "url"
                              ? parent.url
                              : `${parent.type}: ${
                                  parent.type === "page"
                                    ? pages.find((p) => p.id === parent.referenceId)?.title
                                    : parent.type === "category"
                                    ? categories.find((c) => c.id === parent.referenceId)?.name
                                    : products.find((pr) => pr.id === parent.referenceId)?.name
                                }`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => moveParent(parent.id, "up")}
                          disabled={parentIdx === 0}
                          className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-20 rounded-lg hover:bg-muted cursor-pointer border-none bg-transparent"
                          title="Move Parent Up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveParent(parent.id, "down")}
                          disabled={parentIdx === parents.length - 1}
                          className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-20 rounded-lg hover:bg-muted cursor-pointer border-none bg-transparent"
                          title="Move Parent Down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        
                        <Button
                          variant="outline"
                          onClick={() => openAddDrawer(parent.id)}
                          className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Child Link
                        </Button>

                        <button
                          type="button"
                          onClick={() => openEditDrawer(parent)}
                          className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5 cursor-pointer border-none bg-transparent"
                          title="Edit Parent"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(parent.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 cursor-pointer border-none bg-transparent"
                          title="Delete Parent"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Children sub-list */}
                    {childrenItems.length > 0 && (
                      <div className="ml-6 pl-4 border-l-2 border-border flex flex-col gap-3 pt-2">
                        {childrenItems.map((child, childIdx) => (
                          <div key={child.id} className="flex items-center justify-between py-2.5 px-3 bg-muted/20 border border-border rounded-lg relative group/child">
                            <div className="flex items-center gap-3">
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/45 shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-foreground flex items-center gap-2">
                                  {child.label}
                                  {child.type === "url" && child.url === "#" && (
                                    <span className="text-[8px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono font-semibold">
                                      Text Header
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-muted-foreground leading-none mt-1">
                                  {child.type === "url" && child.url === "#"
                                    ? "Label label header (no hyperlink)"
                                    : child.type === "url"
                                    ? child.url
                                    : `${child.type}: ${
                                        child.type === "page"
                                          ? pages.find((p) => p.id === child.referenceId)?.title
                                          : child.type === "category"
                                          ? categories.find((c) => c.id === child.referenceId)?.name
                                          : products.find((pr) => pr.id === child.referenceId)?.name
                                      }`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-70 group-hover/child:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => moveChild(child.id, parent.id, "up")}
                                disabled={childIdx === 0}
                                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 rounded hover:bg-muted cursor-pointer border-none bg-transparent"
                                title="Move Child Up"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveChild(child.id, parent.id, "down")}
                                disabled={childIdx === childrenItems.length - 1}
                                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 rounded hover:bg-muted cursor-pointer border-none bg-transparent"
                                title="Move Child Down"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditDrawer(child)}
                                className="p-1 text-muted-foreground hover:text-primary rounded hover:bg-primary/5 cursor-pointer border-none bg-transparent"
                                title="Edit Child"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(child.id)}
                                className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10 cursor-pointer border-none bg-transparent"
                                title="Delete Child"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )
              })}

              {parents.length === 0 && (
                <div className="text-center py-16 border border-dashed border-border rounded-xl text-sm text-muted-foreground bg-muted/10">
                  This menu has no links yet. Click "Add Top Level Link" below to begin.
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => openAddDrawer()}
              className="w-full py-4 border-dashed border-border text-sm text-primary hover:bg-primary/5 rounded-xl flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Top Level Link</span>
            </Button>
          </>
        ) : (
          <Card className="p-12 flex flex-col items-center justify-center text-center border border-border bg-card rounded-xl h-96 shadow-none">
            <h3 className="text-lg font-semibold text-foreground">
              Navigation Setup
            </h3>
            <p className="text-sm text-muted-foreground font-light mt-1.5 max-w-sm">
              Please select either Main Menu or Footer Menu on the left to configure.
            </p>
          </Card>
        )}
      </div>

      {/* Floating Right Slide-over Link Editor Drawer Overlay */}
      <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
        <SheetContent side="right" className="sm:max-w-md flex flex-col h-full gap-0 p-0">
          <SheetHeader className="p-6 border-b border-border">
            <SheetTitle>{editingItemId ? "Edit Menu Link" : "Add Menu Link"}</SheetTitle>
            <SheetDescription>
              Configure the details of this navigation link.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleDrawerFormSubmit} className="flex flex-col flex-1 min-h-0 text-foreground">
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {itemError && (
                <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-medium">
                  {itemError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <FormLabel htmlFor="itemLabel">Link Label</FormLabel>
                <Input
                  id="itemLabel"
                  placeholder="e.g. Shop All, Our Story"
                  value={itemLabel}
                  onChange={(e) => setItemLabel(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <FormLabel htmlFor="itemType">Link Destination Type</FormLabel>
                <Select
                  value={itemType}
                  onValueChange={(val) => {
                    setItemType(val as any)
                    setItemReferenceId("")
                    setItemUrl("")
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select destination type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {itemType === "url" && (
                <div className="flex flex-col gap-1.5">
                  <FormLabel htmlFor="itemUrl">URL Link Destination</FormLabel>
                  <Input
                    id="itemUrl"
                    placeholder="e.g. /custom-route or https://..."
                    value={itemUrl}
                    onChange={(e) => setItemUrl(e.target.value)}
                  />
                </div>
              )}

              {itemType !== "url" && itemType !== "text-only" && (
                <div className="flex flex-col gap-1.5">
                  <FormLabel htmlFor="itemRef">Choose target resource</FormLabel>
                  <Select
                    value={itemReferenceId}
                    onValueChange={setItemReferenceId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose target..." />
                    </SelectTrigger>
                    <SelectContent>
                      {refOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <FormLabel htmlFor="itemParent">Parent Link (Optional nesting)</FormLabel>
                <Select
                  value={itemParentId || "none"}
                  onValueChange={(val) => setItemParentId(val === "none" ? "" : val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select parent link..." />
                  </SelectTrigger>
                  <SelectContent>
                    {parentOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-muted/20 flex gap-3 mt-auto">
              <Button
                type="button"
                variant="outline"
                onClick={closeDrawer}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
              >
                {editingItemId ? "Save Changes" : "Add Link"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

    </div>
  )
}
