"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({
  className,
  children,
  title,
  description,
  ...props
}: RadixDialog.DialogContentProps & { title: string; description?: string }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-40 bg-slate-950/40 data-[state=open]:animate-in data-[state=open]:fade-in" />
      <RadixDialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2",
          "overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-xl",
          "focus:outline-none",
          className
        )}
        {...props}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <RadixDialog.Title className="text-lg font-semibold text-slate-900">{title}</RadixDialog.Title>
            {description && (
              <RadixDialog.Description className="mt-1 text-sm text-slate-500">
                {description}
              </RadixDialog.Description>
            )}
          </div>
          <RadixDialog.Close className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </RadixDialog.Close>
        </div>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-6 flex justify-end gap-2", className)} {...props} />;
}
