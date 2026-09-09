"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** When set, the confirm button stays disabled until the user types this text exactly. */
  requireTypedConfirmation?: string;
  onConfirm: () => void;
  children?: React.ReactNode;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  requireTypedConfirmation,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const disabled = requireTypedConfirmation !== undefined && typed !== requireTypedConfirmation;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setTyped("");
        onOpenChange(next);
      }}
    >
      <DialogContent title={title} description={description}>
        {children}
        {requireTypedConfirmation && (
          <div className="mt-4">
            <label className="mb-1 block text-sm text-slate-600">
              Type <span className="font-semibold">{requireTypedConfirmation}</span> to confirm
            </label>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "primary"}
            disabled={disabled}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
              setTyped("");
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
