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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Attribute</DialogTitle>
          <DialogDescription>
            Delete &ldquo;{attributeName}&rdquo; and its {variantCount} associated variant{variantCount !== 1 ? "s" : ""}? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            All variants linked to this attribute will be permanently deleted.
            Active carts referencing these variants will show them as
            &ldquo;No longer available,&rdquo; and customers must remove them
            before checkout.
          </p>
          {variantCount > 0 && (
            <p className="font-medium text-destructive">
              {variantCount} variant{variantCount !== 1 ? "s" : ""} will be deleted.
            </p>
          )}
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
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
