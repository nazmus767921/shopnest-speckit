"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { VariantsSection } from "@/components/dashboard/product-variant-editor/VariantsSection";
import { MetadataSection } from "@/components/dashboard/product-variant-editor/MetadataSection";

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
      className={`px-4 py-3 text-body-md font-medium transition-colors border-b-2 -mb-px ${
        active
          ? "border-ink text-ink"
          : "border-transparent text-shade-50 hover:text-shade-70 hover:border-shade-30"
      }`}
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
    stockCount: product.stockCount,
    lowStockThreshold: product.lowStockThreshold ?? 5,
    isPublished: product.isPublished,
    categoryId: product.categoryId,
    promotionTypes: product.promotionTypes,
    images: product.images,
  };

  return (
    <div>
      {/* ── Header — outside tabs, visible on all tabs ── */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/products"
          className="p-2 border border-hairline-light rounded-full bg-canvas-light text-ink hover:bg-canvas-cream transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-heading-xl tracking-tight text-ink font-semibold leading-none">
            Edit Product
          </h1>
          <p className="text-caption text-shade-50 font-light mt-1">
            Manage and update product details
          </p>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex border-b border-hairline-light mb-6" role="tablist" aria-label="Product sections">
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
          />
        )}

        {activeTab === "variants" && (
          <VariantsSection
            productId={product.id}
            hasVariants={product.hasVariants}
            baseSku={product.id.slice(0, 8).toUpperCase()}
            basePricePaisa={product.pricePaisa}
          />
        )}

        {activeTab === "metadata" && (
          <MetadataSection productId={product.id} />
        )}
      </div>
    </div>
  );
}
