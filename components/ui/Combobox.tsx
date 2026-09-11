"use client";

import { useMemo, useState } from "react";
import * as RadixPopover from "@radix-ui/react-popover";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { SelectOption } from "./Select";

/** A Select with a search box — for lists long enough that scrolling to find
 *  an entry (e.g. picking a shepherd among hundreds of people) is painful. */
export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyLabel = "No matches",
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <RadixPopover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <RadixPopover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
            !selected && "text-slate-400",
            className
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          align="start"
          sideOffset={4}
          className="z-50 min-w-56 rounded-md border border-slate-200 bg-white shadow-lg"
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <div className="flex items-center gap-2 border-b border-slate-100 px-2 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtered.length > 0) {
                  onValueChange(filtered[0].value);
                  setOpen(false);
                }
              }}
              placeholder={searchPlaceholder}
              className="w-full text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-slate-400">{emptyLabel}</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100",
                    option.value === value && "bg-slate-50 font-medium"
                  )}
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value && <Check className="h-4 w-4 shrink-0 text-slate-900" />}
                </button>
              ))
            )}
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
