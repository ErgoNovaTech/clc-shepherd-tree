import { useMemo } from "react";
import { computeLayout, type LayoutEdge } from "@/lib/graph/layout";

export function useAutoLayout(visibleIds: string[], edges: LayoutEdge[], rootIds: string[]) {
  return useMemo(() => computeLayout(visibleIds, edges, rootIds), [visibleIds, edges, rootIds]);
}
