"use client";

import { useMemo, useState } from "react";
import { PersonAvatar } from "@/components/people/PersonAvatar";
import { Select } from "@/components/ui/Select";
import { useTreeStore } from "@/store/useTreeStore";
import { useUIStore } from "@/store/useUIStore";
import { useTraversalIndex } from "@/lib/graph/useTraversalIndex";

const ALL = "__all__";

export function PeopleListView() {
  const people = useTreeStore((s) => s.people);
  const selectPerson = useUIStore((s) => s.selectPerson);
  const index = useTraversalIndex();

  const [role, setRole] = useState(ALL);
  const [location, setLocation] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  const allPeople = useMemo(() => Object.values(people), [people]);
  const roles = useMemo(
    () => Array.from(new Set(allPeople.map((p) => p.role).filter(Boolean))) as string[],
    [allPeople]
  );
  const locations = useMemo(
    () => Array.from(new Set(allPeople.map((p) => p.location).filter(Boolean))) as string[],
    [allPeople]
  );

  const filtered = allPeople.filter(
    (p) =>
      (role === ALL || p.role === role) &&
      (location === ALL || p.location === location) &&
      (status === ALL || p.status === status)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="w-40">
          <Select
            value={role}
            onValueChange={setRole}
            options={[{ value: ALL, label: "All roles" }, ...roles.map((r) => ({ value: r, label: r }))]}
          />
        </div>
        <div className="w-40">
          <Select
            value={location}
            onValueChange={setLocation}
            options={[{ value: ALL, label: "All locations" }, ...locations.map((l) => ({ value: l, label: l }))]}
          />
        </div>
        <div className="w-40">
          <Select
            value={status}
            onValueChange={setStatus}
            options={[
              { value: ALL, label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "transferred", label: "Transferred" },
            ]}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">No people match these filters.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((person) => {
              const shepherdId = index.shepherdByMember.get(person.id);
              return (
                <li key={person.id}>
                  <button
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
                    onClick={() => selectPerson(person.id)}
                  >
                    <PersonAvatar name={person.name} photo={person.photo} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{person.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {[person.role, person.location].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {shepherdId ? `Under ${people[shepherdId]?.name}` : "Root"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
