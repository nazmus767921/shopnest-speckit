"use client"

import React, { useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { Plus, Trash2, ArrowUp, ArrowDown, ChevronRight, Menu, Save, RotateCcw, X, Edit, Link2 } from "lucide-react"
import { Button } from "@/components/ui/primitives/Button"
import { Card } from "@/components/ui/layout/Card"
import { FormLabel } from "@/components/ui/primitives/FormLabel"
import { Input } from "@/components/ui/primitives/Input"
import { resetMenuToDefaultsAction, saveMenuItemsAction } from "@/app/actions/navigation"
import { menuItemSchema } from "@/lib/validations/navigation"

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

  // Menu Items state (flat array)
  const [items, setItems] = useState<LocalMenuItem[]>([])

  // Drawer Edit Form State
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

  // Reconstruct hierarchy on selectedMenuId or menus updates
  useEffect(() => {
    if (!selectedMenuId) {
      setItems([])
      return
    }
    const currentMenu = menus.find((m) => m.id === selectedMenuId)
    if (currentMenu && currentMenu.items) {
      // Correctly group and sort children under parents
      const parents = currentMenu.items.filter((it: any) => !it.parentId)
      const children = currentMenu.items.filter((it: any) => !!it.parentId)

      // Sort parents and children by position
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
    } else {
      setItems([])
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
    
    // Map text-only type back from saved url
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

  // Mutations
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
      // Validate all items using Zod before submitting
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

  // Submit Menu Item Form inside Drawer
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
      position: items.length, // Temporary
    }

    // Validate using Zod schema
    const val = menuItemSchema.safeParse(rawItem)
    if (!val.success) {
      setItemError(val.error.issues[0].message)
      return
    }

    if (editingItemId) {
      // Edit existing
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
      // Re-index tree
      rebuildFlatListFromHierarchy(updated)
    } else {
      // Add new item
      const updated = [...items, { ...rawItem, type: rawItem.type as any }]
      rebuildFlatListFromHierarchy(updated)
    }

    closeDrawer()
  }

  const handleDeleteItem = (id: string) => {
    if (confirm("Are you sure you want to delete this link? Deleting a parent link will also delete all of its nested sub-links.")) {
      // Filter out this item and any children belonging to this item
      const remaining = items.filter((it) => it.id !== id && it.parentId !== id)
      rebuildFlatListFromHierarchy(remaining)
    }
  }

  // Hierarchical Up/Down Moving
  const moveParent = (parentId: string, direction: "up" | "down") => {
    const parentList = items.filter((it) => !it.parentId)
    const idx = parentList.findIndex((p) => p.id === parentId)
    if (idx === -1) return
    const nextIdx = direction === "up" ? idx - 1 : idx + 1
    if (nextIdx < 0 || nextIdx >= parentList.length) return

    // Swap parents
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

    // Swap children
    const temp = childList[idx]
    childList[idx] = childList[nextIdx]
    childList[nextIdx] = temp

    rebuildFlatListFromHierarchy(items, parentList, { [parentId]: childList })
  }

  // Re-flat list and assign sequential positions
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

  // Potential parents (only top-level links that are not the item being edited)
  const potentialParents = items.filter(
    (it) => !it.parentId && it.id !== editingItemId
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative items-start">
      
      {/* Left: Menus List Card */}
      <div className="flex flex-col gap-6">
        <Card className="p-6 flex flex-col gap-6 border-[var(--color-hairline-light)] bg-[var(--color-canvas-light)] shadow-none">
          <h2 className="text-body-strong font-semibold text-[var(--color-ink)] border-b border-[var(--color-hairline-light)] pb-4">
            Navigation Settings
          </h2>

          <div className="flex flex-col gap-2">
            {menus.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMenuId(m.id)}
                className={`w-full text-left px-4 py-3.5 rounded-xl text-caption transition-all flex items-center justify-between border ${
                  selectedMenuId === m.id
                    ? "bg-primary/5 text-primary border-primary/20 font-medium"
                    : "border-transparent text-shade-60 hover:bg-canvas-dark"
                }`}
              >
                <span>{m.name}</span>
                <span className="text-[10px] bg-canvas-dark text-shade-50 px-2 py-0.5 rounded-full font-mono font-light uppercase tracking-wider">
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
              <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-caption">
                {globalError}
              </div>
            )}
            {globalSuccess && (
              <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl text-caption">
                {globalSuccess}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-heading-md font-semibold text-[var(--color-ink)] tracking-tight">
                  {selectedMenu.name} Links
                </h2>
                <p className="text-caption text-shade-50 font-light mt-0.5">
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
                  className="text-primary hover:text-primary-dark border-primary/20 hover:bg-primary/5 rounded-full flex items-center gap-1.5 text-micro font-medium"
                  disabled={resetMenuMutation.isPending}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Defaults
                </Button>

                <Button
                  variant="primary"
                  onClick={() => saveItemsMutation.mutate()}
                  disabled={saveItemsMutation.isPending}
                  className="rounded-full px-5 py-2 text-caption font-semibold flex items-center gap-2"
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
                  <Card key={parent.id} className="p-5 border-[var(--color-hairline-light)] bg-[var(--color-canvas-light)] shadow-none flex flex-col gap-4 relative overflow-hidden group">
                    
                    {/* Parent row item */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Menu className="h-4 w-4 text-shade-30 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-caption font-semibold text-[var(--color-ink)] flex items-center gap-2">
                            {parent.label}
                            {parent.type === "url" && parent.url === "#" && (
                              <span className="text-[9px] bg-shade-20 text-shade-60 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold font-mono">
                                Text Header
                              </span>
                            )}
                          </span>
                          <span className="text-micro text-shade-40 leading-none mt-1">
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
                          onClick={() => moveParent(parent.id, "up")}
                          disabled={parentIdx === 0}
                          className="p-1.5 text-shade-40 hover:text-[var(--color-ink)] disabled:opacity-20 rounded-lg hover:bg-canvas-dark cursor-pointer border-none bg-transparent"
                          title="Move Parent Up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => moveParent(parent.id, "down")}
                          disabled={parentIdx === parents.length - 1}
                          className="p-1.5 text-shade-40 hover:text-[var(--color-ink)] disabled:opacity-20 rounded-lg hover:bg-canvas-dark cursor-pointer border-none bg-transparent"
                          title="Move Parent Down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        
                        <Button
                          variant="outline"
                          onClick={() => openAddDrawer(parent.id)}
                          className="text-micro px-2.5 py-1 rounded-full text-primary border-primary/10 hover:bg-primary/5 flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Child Link
                        </Button>

                        <button
                          onClick={() => openEditDrawer(parent)}
                          className="p-1.5 text-shade-40 hover:text-primary rounded-lg hover:bg-primary/5 cursor-pointer border-none bg-transparent"
                          title="Edit Parent"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(parent.id)}
                          className="p-1.5 text-shade-40 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer border-none bg-transparent"
                          title="Delete Parent"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Children sub-list */}
                    {childrenItems.length > 0 && (
                      <div className="ml-6 pl-4 border-l-2 border-l-[var(--color-hairline-light)] flex flex-col gap-3 pt-2">
                        {childrenItems.map((child, childIdx) => (
                          <div key={child.id} className="flex items-center justify-between py-2.5 px-3 bg-canvas-dark/40 border border-[var(--color-hairline-light)] rounded-xl relative group/child">
                            <div className="flex items-center gap-3">
                              <ChevronRight className="h-3.5 w-3.5 text-shade-30 shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-micro font-medium text-[var(--color-ink)] flex items-center gap-2">
                                  {child.label}
                                  {child.type === "url" && child.url === "#" && (
                                    <span className="text-[8px] bg-shade-20 text-shade-50 px-1.5 py-0.5 rounded font-mono font-semibold">
                                      Text Header
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-shade-40 leading-none mt-1">
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
                                onClick={() => moveChild(child.id, parent.id, "up")}
                                disabled={childIdx === 0}
                                className="p-1 text-shade-40 hover:text-[var(--color-ink)] disabled:opacity-20 rounded hover:bg-canvas-dark cursor-pointer border-none bg-transparent"
                                title="Move Child Up"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => moveChild(child.id, parent.id, "down")}
                                disabled={childIdx === childrenItems.length - 1}
                                className="p-1 text-shade-40 hover:text-[var(--color-ink)] disabled:opacity-20 rounded hover:bg-canvas-dark cursor-pointer border-none bg-transparent"
                                title="Move Child Down"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => openEditDrawer(child)}
                                className="p-1 text-shade-40 hover:text-primary rounded hover:bg-primary/5 cursor-pointer border-none bg-transparent"
                                title="Edit Child"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(child.id)}
                                className="p-1 text-shade-40 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer border-none bg-transparent"
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
                <div className="text-center py-16 border-2 border-dashed border-[var(--color-hairline-light)] rounded-2xl text-caption text-shade-40 bg-canvas-dark/20">
                  This menu has no links yet. Click "Add Top Level Link" below to begin.
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => openAddDrawer()}
              className="w-full py-4 border-dashed border-[var(--color-hairline-light)] text-caption text-primary hover:bg-primary/5 rounded-2xl flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Top Level Link</span>
            </Button>
          </>
        ) : (
          <Card className="p-12 flex flex-col items-center justify-center text-center border border-hairline-light bg-canvas-light rounded-2xl h-96 shadow-none">
            <h3 className="font-display text-heading-md font-semibold text-[var(--color-ink)]">
              Navigation Setup
            </h3>
            <p className="text-caption text-shade-50 font-light mt-1.5 max-w-sm">
              Please select either Main Menu or Footer Menu on the left to configure.
            </p>
          </Card>
        )}
      </div>

      {/* Floating Right Slide-over Link Editor Drawer Overlay */}
      {isDrawerOpen && (
        <>
          {/* Drawer backdrop overlay */}
          <div 
            className="fixed inset-0 bg-zinc-950/20 backdrop-blur-sm z-50 transition-opacity duration-300 animate-fade-in"
            onClick={closeDrawer}
          />

          {/* Drawer Panel content */}
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[var(--color-canvas-light)] border-l border-[var(--color-hairline-light)] p-6 flex flex-col gap-6 shadow-2xl z-50 transform transition-transform duration-300 animate-slide-in-right overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-hairline-light)] pb-4">
              <h3 className="text-body-strong font-semibold text-[var(--color-ink)] flex items-center gap-2">
                <Link2 className="h-4.5 w-4.5 text-primary" />
                {editingItemId ? "Edit Menu Link" : "Add Menu Link"}
              </h3>
              <button 
                onClick={closeDrawer}
                className="p-1.5 hover:bg-canvas-dark text-shade-50 hover:text-[var(--color-ink)] rounded-full transition-all border-none bg-transparent cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDrawerFormSubmit} className="flex flex-col gap-5 flex-1 justify-between">
              <div className="flex flex-col gap-5">
                {itemError && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-micro font-medium">
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
                  <select
                    id="itemType"
                    value={itemType}
                    onChange={(e) => {
                      setItemType(e.target.value as any)
                      setItemReferenceId("")
                      setItemUrl("")
                    }}
                    className="w-full text-caption border border-[var(--color-hairline-light)] rounded-xl px-3 py-3 bg-[var(--color-canvas-light)] text-[var(--color-ink)] outline-none focus:border-shade-60 transition-all font-sans"
                  >
                    <option value="text-only">Text Only / Category Header (No link)</option>
                    <option value="url">Custom URL</option>
                    <option value="page">Standard Page</option>
                    <option value="category">Category Collection</option>
                    <option value="product">Product Page</option>
                  </select>
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
                    <select
                      id="itemRef"
                      value={itemReferenceId}
                      onChange={(e) => setItemReferenceId(e.target.value)}
                      className="w-full text-caption border border-[var(--color-hairline-light)] rounded-xl px-3 py-3 bg-[var(--color-canvas-light)] text-[var(--color-ink)] outline-none focus:border-shade-60 transition-all font-sans"
                      required
                    >
                      <option value="">-- Choose target --</option>
                      {itemType === "page" &&
                        pages.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.slug})
                          </option>
                        ))}
                      {itemType === "category" &&
                        categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.slug})
                          </option>
                        ))}
                      {itemType === "product" &&
                        products.map((pr) => (
                          <option key={pr.id} value={pr.id}>
                            {pr.name} ({pr.slug})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Nesting: Parent selector */}
                <div className="flex flex-col gap-1.5">
                  <FormLabel htmlFor="itemParent">Parent Link (Optional nesting)</FormLabel>
                  <select
                    id="itemParent"
                    value={itemParentId}
                    onChange={(e) => setItemParentId(e.target.value)}
                    className="w-full text-caption border border-[var(--color-hairline-light)] rounded-xl px-3 py-3 bg-[var(--color-canvas-light)] text-[var(--color-ink)] outline-none focus:border-shade-60 transition-all font-sans"
                  >
                    <option value="">None (Top-level Link)</option>
                    {potentialParents.map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 border-t border-[var(--color-hairline-light)] pt-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDrawer}
                  className="rounded-full w-full justify-center text-caption py-3 border-[var(--color-hairline-light)]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="rounded-full w-full justify-center text-caption py-3"
                >
                  {editingItemId ? "Save Changes" : "Add Link"}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}

    </div>
  )
}
