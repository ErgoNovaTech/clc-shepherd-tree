"use client";

import { toast } from "sonner";
import { PersonAvatar } from "@/components/people/PersonAvatar";
import { ShepherdPicker } from "@/components/people/ShepherdPicker";
import { useTreeStore } from "@/store/useTreeStore";
import { useTraversalIndex } from "@/lib/graph/useTraversalIndex";
import { getRootIds } from "@/lib/graph/traversal";

export function UnassignedListView() {
  const people = useTreeStore((s) => s.people);
  const changeShepherd = useTreeStore((s) => s.changeShepherd);
  const index = useTraversalIndex();

  const peopleIds = Object.keys(people);
  const rootIds = getRootIds(peopleIds, index.shepherdByMember);
  const unassigned = rootIds.filter((id) => !index.childrenByShepherd.has(id));

  const candidates = Object.values(people)
    .map((p) => ({ id: p.id, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (unassigned.length === 0) {
    return <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">Everyone has a shepherd.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <ul className="divide-y divide-slate-100">
        {unassigned.map((id) => {
          const person = people[id];
          return (
            <li key={id} className="flex items-center gap-3 px-4 py-2.5">
              <PersonAvatar name={person.name} photo={person.photo} size="sm" />
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{person.name}</p>
              <div className="w-52">
                <ShepherdPicker
                  label=""
                  value={null}
                  onChange={(shepherdId) => {
                    if (!shepherdId) return;
                    const result = changeShepherd(id, shepherdId);
                    if (result.ok) {
                      toast.success(`${person.name} has been assigned to ${people[shepherdId]?.name}.`);
                    } else {
                      toast.error("Couldn't assign this shepherd.");
                    }
                  }}
                  candidates={candidates.filter((c) => c.id !== id)}
                  allowNone={false}
                  noneLabel="Assign shepherd..."
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
