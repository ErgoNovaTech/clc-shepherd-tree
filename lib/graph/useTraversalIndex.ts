import { useMemo } from "react";
import { useTreeStore } from "@/store/useTreeStore";
import { buildTraversalIndex, computeDescendantCounts } from "./traversal";

/** Memoized traversal index — recomputes only when the relationships array reference changes. */
export function useTraversalIndex() {
  const relationships = useTreeStore((s) => s.relationships);
  return useMemo(() => buildTraversalIndex(relationships), [relationships]);
}

/** Total-downline count per person, recomputed only when people or relationships change. */
export function useDescendantCounts() {
  const people = useTreeStore((s) => s.people);
  const index = useTraversalIndex();
  return useMemo(() => computeDescendantCounts(Object.keys(people), index), [people, index]);
}
