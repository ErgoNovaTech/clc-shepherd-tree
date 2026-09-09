"use client";

import { Plus, Undo2, Redo2 } from "lucide-react";
import { PersonSearch } from "@/components/people/PersonSearch";
import { Button } from "@/components/ui/Button";
import { useTreeStore } from "@/store/useTreeStore";
import { useUIStore, type ActiveView } from "@/store/useUIStore";

const MOBILE_VIEWS: { value: ActiveView; label: string }[] = [
  { value: "tree", label: "Tree" },
  { value: "dashboard", label: "Dashboard" },
  { value: "people", label: "People" },
  { value: "unassigned", label: "Unassigned" },
];

export function Toolbar({ onAddPerson }: { onAddPerson: () => void }) {
  const past = useTreeStore((s) => s.past);
  const future = useTreeStore((s) => s.future);
  const undo = useTreeStore((s) => s.undo);
  const redo = useTreeStore((s) => s.redo);
  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);

  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
      <h1 className="shrink-0 text-base font-semibold text-slate-900">Shepherd Tree</h1>

      <select
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm md:hidden"
        value={activeView}
        onChange={(e) => setActiveView(e.target.value as ActiveView)}
      >
        {MOBILE_VIEWS.map((v) => (
          <option key={v.value} value={v.value}>
            {v.label}
          </option>
        ))}
      </select>

      <div className="flex-1" />

      <PersonSearch />

      <Button variant="ghost" size="icon" onClick={undo} disabled={past.length === 0} aria-label="Undo">
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={redo} disabled={future.length === 0} aria-label="Redo">
        <Redo2 className="h-4 w-4" />
      </Button>

      <Button onClick={onAddPerson}>
        <Plus className="h-4 w-4" /> Add Person
      </Button>
    </header>
  );
}
