"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import ReactDOM from "react-dom";
import { X, Minus, Plus, ShoppingCart, Check } from "lucide-react";
import {
  VariantSelector,
  type VariantOption,
  type AttributeInfo,
} from "./variant-selector/VariantSelector";
import { formatTaka } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DialogProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  pricePaisa: number;
  stockCount: number;
  attributes: AttributeInfo[];
  variants: VariantOption[];
}

interface VariantQuickSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: DialogProduct | null;
  /** Active storefront theme class, e.g. "storefront-theme-default" */
  themeClass: string;
  onAddToCart: (variantId: string, quantity: number) => Promise<void>;
}

// ─── Focus Trap Utility ──────────────────────────────────────────────────────

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled"));
}

// ─── Portal ───────────────────────────────────────────────────────────────────
// Render directly into document.body (no wrapper div with position:fixed so
// the overlay's own position:fixed resolves to the viewport, not an ancestor).

function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof document === "undefined") return null;
  return ReactDOM.createPortal(children, document.body);
}

// ─── Main Dialog ─────────────────────────────────────────────────────────────

export function VariantQuickSelectDialog({
  open,
  onOpenChange,
  product,
  themeClass,
  onAddToCart,
}: VariantQuickSelectDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [didSucceed, setDidSucceed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setQuantity(1);
      setSelectedVariant(null);
      setIsLoading(false);
      setDidSucceed(false);
      // Focus close button after animation frame
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
    }
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Keyboard: Escape + tab-cycle focus trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
        return;
      }

      if (e.key === "Tab" && panelRef.current) {
        const focusable = getFocusableElements(panelRef.current);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onOpenChange],
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onOpenChange(false);
      }
    },
    [onOpenChange],
  );

  const handleAddToCart = useCallback(async () => {
    if (!selectedVariant || isLoading) return;
    setIsLoading(true);
    try {
      await onAddToCart(selectedVariant.id, quantity);
      setDidSucceed(true);
      setTimeout(() => {
        onOpenChange(false);
        setDidSucceed(false);
      }, 900);
    } catch {
      // Parent handles error toast; re-enable button
    } finally {
      setIsLoading(false);
    }
  }, [selectedVariant, quantity, isLoading, onAddToCart, onOpenChange]);

  const displayPrice =
    selectedVariant?.pricePaisa !== null && selectedVariant?.pricePaisa !== undefined
      ? selectedVariant.pricePaisa
      : product?.pricePaisa ?? 0;

  const isOutOfStock = product?.stockCount === 0;
  const canAddToCart = !!selectedVariant && !isOutOfStock && !isLoading;

  if (!open || !product) return null;

  return (
    <Portal>
      {/* Overlay — themeClass applied here so --dialog-* variables cascade to children */}
      <div
        className={`vqsd-overlay ${themeClass}`}
        onClick={handleOverlayClick}
        aria-hidden="true"
      >
        {/* Panel */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="vqsd-title"
          onKeyDown={handleKeyDown}
          tabIndex={-1}
          className="vqsd-panel"
        >
          {/* ── Header ── */}
          <div className="vqsd-header">
            <div className="vqsd-product-identity">
              {/* Thumbnail */}
              {product.imageUrl && (
                <div className="vqsd-thumb">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="vqsd-thumb-img"
                  />
                </div>
              )}
              <div className="vqsd-title-block">
                <h2 id="vqsd-title" className="vqsd-product-name text-storefront-heading-sm">
                  {product.name}
                </h2>
                <p className="vqsd-price text-storefront-body-lg">
                  {formatTaka(displayPrice)}
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => onOpenChange(false)}
              className="vqsd-close"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4 stroke-[2]" />
            </button>
          </div>

          {/* Divider */}
          <div className="vqsd-divider" aria-hidden="true" />

          {/* ── Variant Selector ── */}
          <div className="vqsd-body">
            {product.attributes.length > 0 ? (
              <VariantSelector
                attributes={product.attributes}
                variants={product.variants}
                basePricePaisa={product.pricePaisa}
                onVariantSelect={setSelectedVariant}
              />
            ) : (
              <p className="vqsd-no-variants text-storefront-body-md">
                No variant options for this product.
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="vqsd-divider" aria-hidden="true" />

          {/* ── Quantity + CTA ── */}
          <div className="vqsd-footer">
            {/* Quantity Stepper */}
            <div className="vqsd-stepper" role="group" aria-label="Quantity">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="vqsd-stepper-btn"
              >
                <Minus className="h-4 w-4 stroke-[2.5]" />
              </button>
              <span className="vqsd-stepper-count" aria-live="polite" aria-atomic="true">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="vqsd-stepper-btn"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Add to Cart CTA */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={[
                "vqsd-cta btn-storefront-primary",
                !canAddToCart ? "vqsd-cta-disabled" : "",
                didSucceed ? "vqsd-cta-success" : "",
              ].join(" ").trim()}
              aria-disabled={!canAddToCart}
            >
              {isLoading ? (
                <span className="vqsd-spinner" aria-label="Adding to cart…" />
              ) : didSucceed ? (
                <>
                  <Check className="h-4 w-4 stroke-[2.5] mr-2" aria-hidden="true" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 stroke-[1.5] mr-2" aria-hidden="true" />
                  <span>
                    {isOutOfStock
                      ? "Out of Stock"
                      : !selectedVariant
                        ? "Select Options"
                        : "Add to Cart"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
