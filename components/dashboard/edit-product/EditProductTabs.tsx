"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, ChevronLeftIcon } from "@/lib/icons";

import { ProductForm } from "@/components/dashboard/ProductForm";
import { VariantsSection } from "@/components/dashboard/product-variant-editor/VariantsSection";
import { MetadataSection } from "@/components/dashboard/product-variant-editor/MetadataSection";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Tab Button ──────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-3 text-sm font-semibold transition-all border-b-2 -mb-px cursor-pointer",
        active
          ? "border-primary text-foreground font-bold"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      )}
      role="tab"
      aria-selected={active}
    >
      {children}
    </button>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface EditProductTabsProps {
  merchantId: string;
  product: {
    id: string;
    name: string;
    description: string | null;
    pricePaisa: number;
    compareAtPricePaisa?: number | null;
    stockCount: number;
    lowStockThreshold: number | null;
    isPublished: boolean;
    categoryId: string | null;
    promotionTypes: string[];
    images: { storagePath: string }[];
    hasVariants: boolean;
  };
  maxImages: number;
  imageSizeLimitMb: number;
}

// ─── Tabs Component ──────────────────────────────────────────────────────────

export function EditProductTabs({
  merchantId,
  product,
  maxImages,
  imageSizeLimitMb,
}: EditProductTabsProps) {
  const [activeTab, setActiveTab] = useState<"info" | "variants" | "metadata">("info");

  const formattedProduct = {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    pricePaisa: product.pricePaisa,
    compareAtPricePaisa: product.compareAtPricePaisa,
    stockCount: product.stockCount,
    lowStockThreshold: product.lowStockThreshold ?? 5,
    isPublished: product.isPublished,
    categoryId: product.categoryId,
    promotionTypes: product.promotionTypes,
    images: product.images,
  };

  return (
    <div className="text-foreground">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-lg" className="rounded-sm" type="button" asChild>
            <Link href="/dashboard/products">
              <ChevronLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground leading-none">
              Edit Product
            </h1>
            <p className="text-sm text-muted-foreground font-light mt-1">
              Manage and update product details
            </p>
          </div>
        </div>
        <div id="edit-product-header-actions" />
      </div>

      {/* ── Tab bar ── */}
      <div className="flex border-b border-border mb-6" role="tablist" aria-label="Product sections">
        <TabButton active={activeTab === "info"} onClick={() => setActiveTab("info")}>
          Product Info
        </TabButton>
        <TabButton active={activeTab === "variants"} onClick={() => setActiveTab("variants")}>
          Variants
        </TabButton>
        <TabButton active={activeTab === "metadata"} onClick={() => setActiveTab("metadata")}>
          Metadata
        </TabButton>
      </div>

      {/* ── Tab panels ── */}
      <div role="tabpanel" aria-label={activeTab === "info" ? "Product Info" : activeTab === "variants" ? "Variants" : "Metadata"}>
        {activeTab === "info" && (
          <ProductForm
            merchantId={merchantId}
            productId={product.id}
            initialData={formattedProduct}
            maxImages={maxImages}
            imageSizeLimitMb={imageSizeLimitMb}
            hideHeader
            hasVariants={product.hasVariants}
            totalVariantStock={product.stockCount}
          />
        )}

        {activeTab === "variants" && (
          <VariantsSection
            productId={product.id}
            hasVariants={product.hasVariants}
            baseSku={product.id.slice(0, 8).toUpperCase()}
            basePricePaisa={product.pricePaisa}
            productImages={product.images}
          />
        )}

        {activeTab === "metadata" && (
          <MetadataSection productId={product.id} />
        )}
      </div>
    </div>
  );
}
