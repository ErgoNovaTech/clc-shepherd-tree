"use client";

import { X, Mail, Phone, MapPin, Pencil, ArrowRightLeft, UserPlus, Repeat, Trash2 } from "lucide-react";
import { PersonAvatar } from "@/components/people/PersonAvatar";
import { BreadcrumbTrail } from "@/components/people/BreadcrumbTrail";
import { Button } from "@/components/ui/Button";
import { useTreeStore } from "@/store/useTreeStore";
import { useUIStore } from "@/store/useUIStore";
import { useTraversalIndex, useDescendantCounts } from "@/lib/graph/useTraversalIndex";
import { getDepth } from "@/lib/graph/traversal";
import type { FocusMode } from "@/types/graph";

const STATUS_LABEL: Record<string, string> = { active: "Active", inactive: "Inactive", transferred: "Transferred" };

export function PersonDetailsPanel({
  onEdit,
  onChangeShepherd,
  onAddUnder,
  onReplace,
  onDelete,
}: {
  onEdit: (id: string) => void;
  onChangeShepherd: (id: string) => void;
  onAddUnder: (id: string) => void;
  onReplace: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const people = useTreeStore((s) => s.people);
  const selectedPersonId = useUIStore((s) => s.selectedPersonId);
  const detailsOpen = useUIStore((s) => s.detailsOpen);
  const setDetailsOpen = useUIStore((s) => s.setDetailsOpen);
  const selectPerson = useUIStore((s) => s.selectPerson);
  const setFocusMode = useUIStore((s) => s.setFocusMode);
  const index = useTraversalIndex();
  const descendantCounts = useDescendantCounts();

  const person = selectedPersonId ? people[selectedPersonId] : undefined;

  if (!detailsOpen || !person) return null;

  const shepherdId = index.shepherdByMember.get(person.id) ?? null;
  const shepherd = shepherdId ? people[shepherdId] : null;
  const children = index.childrenByShepherd.get(person.id) ?? [];
  const level = getDepth(person.id, index.shepherdByMember);
  const totalDownline = descendantCounts.get(person.id) ?? 0;

  function focus(mode: FocusMode) {
    setFocusMode(mode);
  }

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-30 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white p-4 shadow-2xl
                 md:static md:z-auto md:h-full md:w-80 md:max-h-none md:shrink-0 md:overflow-y-auto md:rounded-none md:border-l md:border-t-0 md:shadow-none"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <BreadcrumbTrail personId={person.id} />
        <button
          className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          onClick={() => setDetailsOpen(false)}
          aria-label="Close details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <PersonAvatar name={person.name} photo={person.photo} size="lg" />
        <div>
          <h2 className="text-base font-semibold text-slate-900">{person.name}</h2>
          {person.role && <p className="text-sm text-slate-500">{person.role}</p>}
          {person.status && <p className="text-xs text-slate-400">{STATUS_LABEL[person.status]}</p>}
        </div>
      </div>

      <div className="mt-4 space-y-1.5 text-sm text-slate-600">
        {person.phone && (
          <p className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-slate-400" /> {person.phone}
          </p>
        )}
        {person.email && (
          <p className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-slate-400" /> {person.email}
          </p>
        )}
        {person.location && (
          <p className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-slate-400" /> {person.location}
          </p>
        )}
        {person.notes && <p className="rounded-md bg-slate-50 p-2 text-slate-600">{person.notes}</p>}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-md bg-slate-50 p-2 text-center">
        <div>
          <p className="text-sm font-semibold text-slate-900">{level === 0 ? "Root" : level}</p>
          <p className="text-[11px] text-slate-500">{level === 0 ? "Level" : "Level"}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{children.length}</p>
          <p className="text-[11px] text-slate-500">Direct Reports</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{totalDownline}</p>
          <p className="text-[11px] text-slate-500">Total Downline</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Shepherd</p>
        {shepherd ? (
          <button
            className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
            onClick={() => selectPerson(shepherd.id)}
          >
            {shepherd.name}
          </button>
        ) : (
          <p className="text-sm text-slate-400">No shepherd (root leader)</p>
        )}
      </div>

      <div className="mt-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
          People under {person.name} ({children.length})
        </p>
        {children.length === 0 ? (
          <p className="text-sm text-slate-400">No one yet</p>
        ) : (
          <ol className="space-y-1">
            {children.map((childId) => (
              <li key={childId}>
                <button
                  className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
                  onClick={() => selectPerson(childId)}
                >
                  {people[childId]?.name}
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <Button size="sm" variant="outline" onClick={() => focus("upline")}>
          View Upline
        </Button>
        <Button size="sm" variant="outline" onClick={() => focus("downline")}>
          View Downline
        </Button>
        <Button size="sm" variant="outline" onClick={() => focus("branch")}>
          View Full Branch
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button size="sm" variant="secondary" onClick={() => onEdit(person.id)}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onChangeShepherd(person.id)}>
          <ArrowRightLeft className="h-3.5 w-3.5" /> Change Shepherd
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onAddUnder(person.id)}>
          <UserPlus className="h-3.5 w-3.5" /> Add Under
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onReplace(person.id)}>
          <Repeat className="h-3.5 w-3.5" /> Replace
        </Button>
        <Button size="sm" variant="destructive" className="col-span-2" onClick={() => onDelete(person.id)}>
          <Trash2 className="h-3.5 w-3.5" /> Delete Person
        </Button>
      </div>
    </aside>
  );
}
