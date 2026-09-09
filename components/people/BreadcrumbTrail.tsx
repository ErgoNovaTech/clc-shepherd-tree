import { ChevronRight } from "lucide-react";
import { useTreeStore } from "@/store/useTreeStore";
import { useUIStore } from "@/store/useUIStore";
import { useTraversalIndex } from "@/lib/graph/useTraversalIndex";
import { getAncestors } from "@/lib/graph/traversal";

export function BreadcrumbTrail({ personId }: { personId: string }) {
  const people = useTreeStore((s) => s.people);
  const selectPerson = useUIStore((s) => s.selectPerson);
  const index = useTraversalIndex();

  const chain = [...getAncestors(personId, index.shepherdByMember).reverse(), personId];

  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs text-slate-500" aria-label="Shepherding chain">
      {chain.map((id, i) => (
        <span key={id} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {id === personId ? (
            <span className="font-medium text-slate-900">{people[id]?.name}</span>
          ) : (
            <button className="hover:text-slate-900 hover:underline" onClick={() => selectPerson(id)}>
              {people[id]?.name}
            </button>
          )}
        </span>
      ))}
    </nav>
  );
}
