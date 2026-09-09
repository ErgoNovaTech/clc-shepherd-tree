import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ChevronDown, ChevronRight, MoreVertical, Users } from "lucide-react";
import { PersonAvatar } from "@/components/people/PersonAvatar";
import { cn } from "@/lib/utils/cn";
import type { Person } from "@/types/person";

export type PersonNodeData = {
  person: Person;
  descendantCount: number;
  hasChildren: boolean;
  isCollapsed: boolean;
  isHighlighted: boolean;
  isRoot: boolean;
  onToggleCollapse: (id: string) => void;
  onOpenMenu: (id: string, x: number, y: number) => void;
};

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  inactive: "bg-slate-400",
  transferred: "bg-amber-500",
};

function PersonNodeImpl({ id, data, selected }: { id: string; data: PersonNodeData; selected?: boolean }) {
  const { person, descendantCount, hasChildren, isCollapsed, isHighlighted, isRoot } = data;

  return (
    <div
      className={cn(
        "w-60 rounded-xl border bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md",
        selected ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200",
        isHighlighted && "ring-2 ring-amber-400"
      )}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-slate-400" />

      <div className="flex items-start gap-3">
        <div className="relative">
          <PersonAvatar name={person.name} photo={person.photo} size="md" />
          {person.status && (
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                STATUS_DOT[person.status]
              )}
              title={person.status}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{person.name}</p>
          {person.role && <p className="truncate text-xs text-slate-500">{person.role}</p>}
        </div>
        <button
          type="button"
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            data.onOpenMenu(id, rect.left, rect.bottom);
          }}
          aria-label={`Actions for ${person.name}`}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {hasChildren && isRoot && (
        <span
          className="mt-2 flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500"
          title="Root leaders can't be collapsed — it would hide the entire tree"
        >
          <Users className="h-3 w-3" />
          {descendantCount} {descendantCount === 1 ? "person" : "people"}
        </span>
      )}

      {hasChildren && !isRoot && (
        <button
          type="button"
          className="mt-2 flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleCollapse(id);
          }}
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          <Users className="h-3 w-3" />
          {descendantCount} {descendantCount === 1 ? "person" : "people"}
        </button>
      )}

      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-slate-400" />
    </div>
  );
}

export const PersonNode = memo(PersonNodeImpl);
