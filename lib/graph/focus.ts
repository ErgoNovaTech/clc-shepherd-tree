import type { FocusMode } from "@/types/graph";
import { getAncestors, getDescendants, type TraversalIndex } from "./traversal";

/** Returns the id set a focus mode restricts the view to, or null for "no restriction". */
export function getFocusedIds(
  personId: string | null,
  mode: FocusMode,
  index: TraversalIndex
): Set<string> | null {
  if (!personId || !mode) return null;

  if (mode === "upline") {
    return new Set([personId, ...getAncestors(personId, index.shepherdByMember)]);
  }
  if (mode === "downline") {
    return new Set([personId, ...getDescendants(personId, index.childrenByShepherd)]);
  }
  // "branch": full context — ancestors, self, and descendants
  return new Set([
    personId,
    ...getAncestors(personId, index.shepherdByMember),
    ...getDescendants(personId, index.childrenByShepherd),
  ]);
}
