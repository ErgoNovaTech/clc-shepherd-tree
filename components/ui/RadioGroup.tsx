"use client";

import * as RadixRadioGroup from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils/cn";

export const RadioGroup = RadixRadioGroup.Root;

export function RadioOption({
  value,
  id,
  label,
  description,
  className,
}: {
  value: string;
  id: string;
  label: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <RadixRadioGroup.Item
        id={id}
        value={value}
        className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 data-[state=checked]:border-slate-900"
      >
        <RadixRadioGroup.Indicator className="flex h-full w-full items-center justify-center after:h-2 after:w-2 after:rounded-full after:bg-slate-900" />
      </RadixRadioGroup.Item>
      <label htmlFor={id} className="cursor-pointer text-sm">
        <span className="font-medium text-slate-900">{label}</span>
        {description && <span className="block text-slate-500">{description}</span>}
      </label>
    </div>
  );
}
