"use client";

import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils/cn";

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;

export function DropdownMenuContent({ className, ...props }: RadixDropdown.DropdownMenuContentProps) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        align="start"
        sideOffset={4}
        className={cn(
          "z-50 min-w-48 rounded-md border border-slate-200 bg-white p-1 shadow-lg",
          className
        )}
        {...props}
      />
    </RadixDropdown.Portal>
  );
}

export function DropdownMenuItem({
  className,
  destructive,
  ...props
}: RadixDropdown.DropdownMenuItemProps & { destructive?: boolean }) {
  return (
    <RadixDropdown.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-700 outline-none",
        "data-[highlighted]:bg-slate-100",
        destructive && "text-red-600 data-[highlighted]:bg-red-50",
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: RadixDropdown.DropdownMenuSeparatorProps) {
  return <RadixDropdown.Separator className={cn("my-1 h-px bg-slate-200", className)} {...props} />;
}
