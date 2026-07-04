"use client";

import { Dialog } from "@/components/ui/feedback/Dialog";
import { Button } from "@/components/ui/primitives/Button";

type DeleteAttributeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attributeName: string;
  variantCount: number;
  onConfirm: () => void;
};

export function DeleteAttributeDialog({
  open,
  onOpenChange,
  attributeName,
  variantCount,
  onConfirm,
}: DeleteAttributeDialogProps) {
  return (
    <Dialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Delete Attribute"
      description={`Delete "${attributeName}" and its ${variantCount} associated variant${variantCount !== 1 ? "s" : ""}? This cannot be undone.`}
    >
      <div className="flex flex-col gap-2 text-sm text-shade-40">
        <p>
          All variants linked to this attribute will be permanently deleted.
          Active carts referencing these variants will show them as
          &ldquo;No longer available,&rdquo; and customers must remove them
          before checkout.
        </p>
        {variantCount > 0 && (
          <p className="font-medium text-red-600">
            {variantCount} variant{variantCount !== 1 ? "s" : ""} will be
            deleted.
          </p>
        )}
      </div>
      <div className="flex justify-end gap-3 mt-2">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
        >
          Delete
        </Button>
      </div>
    </Dialog>
  );
}
