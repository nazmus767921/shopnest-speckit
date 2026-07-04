"use client";

import { Dialog } from "@/components/ui/feedback/Dialog";
import { Button } from "@/components/ui/primitives/Button";

type RemoveOptionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  optionLabel: string;
  variantCount: number;
  onConfirm: () => void;
};

export function RemoveOptionDialog({
  open,
  onOpenChange,
  optionLabel,
  variantCount,
  onConfirm,
}: RemoveOptionDialogProps) {
  return (
    <Dialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Remove Option"
      description={`Removing "${optionLabel}" will delete ${variantCount} variant${variantCount !== 1 ? "s" : ""} with custom pricing.`}
    >
      <div className="flex flex-col gap-2 text-sm text-shade-40">
        <p>
          All variants that include &ldquo;{optionLabel}&rdquo; will be
          permanently deleted. Active carts referencing these variants will
          show them as &ldquo;No longer available.&rdquo;
        </p>
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
          Remove
        </Button>
      </div>
    </Dialog>
  );
}
