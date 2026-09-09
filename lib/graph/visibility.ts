import type { VisibleGraph } from "@/types/graph";
import { getRootIds, type TraversalIndex } from "./traversal";

/**
 * Derives the visible node/edge set from the full people/relationships graph,
 * skipping any subtree whose root is collapsed. Iterative (stack-based), so
 * cost is O(visible nodes) regardless of how large a hidden branch is.
 */
export function getVisibleGraph(
  peopleIds: Iterable<string>,
  index: TraversalIndex,
  collapsedIds: ReadonlySet<string>
): VisibleGraph {
  const { childrenByShepherd, shepherdByMember } = index;
  const roots = getRootIds(peopleIds, shepherdByMember);

  const visibleIds: string[] = [];
  const edges: { source: string; target: string }[] = [];
  const stack = [...roots];

  while (stack.length > 0) {
    const id = stack.pop()!;
    visibleIds.push(id);

    const shepherdId = shepherdByMember.get(id);
    if (shepherdId) edges.push({ source: shepherdId, target: id });

    if (!collapsedIds.has(id)) {
      const children = childrenByShepherd.get(id);
      if (children) stack.push(...children);
    }
  }

  return { visibleIds, edges };
}
