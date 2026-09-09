"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type SelectOption = { value: string; label: string };

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <RadixSelect.Root value={value || undefined} onValueChange={onValueChange}>
      <RadixSelect.Trigger
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
          className
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          className="z-50 max-h-72 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg"
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm text-slate-700",
                  "data-[highlighted]:bg-slate-100 data-[highlighted]:outline-none"
                )}
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator>
                  <Check className="h-4 w-4" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
