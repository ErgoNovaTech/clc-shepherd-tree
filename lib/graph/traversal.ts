import type { ShepherdRelationship } from "@/types/relationship";

export type TraversalIndex = {
  childrenByShepherd: Map<string, string[]>;
  shepherdByMember: Map<string, string>;
};

export function buildTraversalIndex(relationships: ShepherdRelationship[]): TraversalIndex {
  const childrenByShepherd = new Map<string, string[]>();
  const shepherdByMember = new Map<string, string>();

  for (const rel of relationships) {
    shepherdByMember.set(rel.memberId, rel.shepherdId);
    const siblings = childrenByShepherd.get(rel.shepherdId);
    if (siblings) {
      siblings.push(rel.memberId);
    } else {
      childrenByShepherd.set(rel.shepherdId, [rel.memberId]);
    }
  }

  return { childrenByShepherd, shepherdByMember };
}

export function getRootIds(peopleIds: Iterable<string>, shepherdByMember: Map<string, string>): string[] {
  const roots: string[] = [];
  for (const id of peopleIds) {
    if (!shepherdByMember.has(id)) roots.push(id);
  }
  return roots;
}

/** Ancestors from immediate shepherd up to the root, nearest first. */
export function getAncestors(personId: string, shepherdByMember: Map<string, string>): string[] {
  const chain: string[] = [];
  const seen = new Set<string>([personId]);
  let cur = shepherdByMember.get(personId);
  while (cur && !seen.has(cur)) {
    chain.push(cur);
    seen.add(cur);
    cur = shepherdByMember.get(cur);
  }
  return chain;
}

/** All descendant ids (not including personId itself), iterative DFS — safe for very deep chains. */
export function getDescendants(personId: string, childrenByShepherd: Map<string, string[]>): string[] {
  const result: string[] = [];
  const stack = [...(childrenByShepherd.get(personId) ?? [])];
  while (stack.length > 0) {
    const id = stack.pop()!;
    result.push(id);
    const children = childrenByShepherd.get(id);
    if (children) stack.push(...children);
  }
  return result;
}

export function countDescendants(personId: string, childrenByShepherd: Map<string, string[]>): number {
  return getDescendants(personId, childrenByShepherd).length;
}

export function getDepth(personId: string, shepherdByMember: Map<string, string>): number {
  return getAncestors(personId, shepherdByMember).length;
}

/**
 * Ids to collapse for the default "one step" view: every non-root person who
 * has their own reports. Roots (and their direct reports, since those are
 * exactly what's left visible once these are collapsed) stay visible.
 */
export function getDefaultCollapsedIds(peopleIds: Iterable<string>, index: TraversalIndex): string[] {
  const ids: string[] = [];
  for (const id of peopleIds) {
    if (index.childrenByShepherd.has(id) && index.shepherdByMember.has(id)) {
      ids.push(id);
    }
  }
  return ids;
}

/**
 * Total-downline count for every person in one O(n) pass (children-before-parent
 * accumulation over a DFS discovery order), instead of an O(n) walk per node —
 * matters once chains get hundreds of levels deep.
 */
export function computeDescendantCounts(
  peopleIds: Iterable<string>,
  index: TraversalIndex
): Map<string, number> {
  const roots = getRootIds(peopleIds, index.shepherdByMember);
  const order: string[] = [];
  const stack = [...roots];
  while (stack.length > 0) {
    const id = stack.pop()!;
    order.push(id);
    const children = index.childrenByShepherd.get(id);
    if (children) stack.push(...children);
  }

  const counts = new Map<string, number>();
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i];
    const children = index.childrenByShepherd.get(id) ?? [];
    let total = children.length;
    for (const childId of children) total += counts.get(childId) ?? 0;
    counts.set(id, total);
  }
  return counts;
}
