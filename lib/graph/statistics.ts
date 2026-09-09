import type { Person } from "@/types/person";
import type { Statistics } from "@/types/graph";
import { getRootIds, type TraversalIndex } from "./traversal";

export function computeStatistics(people: Person[], index: TraversalIndex): Statistics {
  const peopleIds = people.map((p) => p.id);
  const rootIds = getRootIds(peopleIds, index.shepherdByMember);

  // A root with no one under them is "unassigned" (not yet placed) rather
  // than a genuine branch head, so the two stats don't overlap.
  const unassignedIds = rootIds.filter((id) => !index.childrenByShepherd.has(id));
  const rootLeaderIds = rootIds.filter((id) => index.childrenByShepherd.has(id));
  const shepherds = new Set(index.childrenByShepherd.keys()).size;

  return {
    totalPeople: people.length,
    shepherds,
    rootLeaders: rootLeaderIds.length,
    branches: rootLeaderIds.length,
    unassigned: unassignedIds.length,
  };
}
