"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Option</DialogTitle>
          <DialogDescription>
            Removing &ldquo;{optionLabel}&rdquo; will delete {variantCount} variant{variantCount !== 1 ? "s" : ""} with custom pricing.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            All variants that include &ldquo;{optionLabel}&rdquo; will be
            permanently deleted. Active carts referencing these variants will
            show them as &ldquo;No longer available.&rdquo;
          </p>
        </div>
        <DialogFooter className="flex justify-end gap-3 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
