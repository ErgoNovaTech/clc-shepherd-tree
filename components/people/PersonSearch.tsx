"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useTreeStore } from "@/store/useTreeStore";
import { useUIStore } from "@/store/useUIStore";
import { searchPeople } from "@/lib/graph/search";

export function PersonSearch() {
  const people = useTreeStore((s) => s.people);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const selectPerson = useUIStore((s) => s.selectPerson);
  const [focused, setFocused] = useState(false);

  const results = useMemo(
    () => (searchQuery.trim() ? searchPeople(Object.values(people), searchQuery).slice(0, 8) : []),
    [people, searchQuery]
  );

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Search people..."
        className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      />
      {searchQuery && (
        <button
          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
          onClick={() => setSearchQuery("")}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {focused && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {results.map((person) => (
            <button
              key={person.id}
              className="flex w-full flex-col px-3 py-1.5 text-left text-sm hover:bg-slate-100"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                selectPerson(person.id);
                setSearchQuery("");
              }}
            >
              <span className="font-medium text-slate-900">{person.name}</span>
              {(person.role || person.location) && (
                <span className="text-xs text-slate-500">
                  {[person.role, person.location].filter(Boolean).join(" · ")}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
