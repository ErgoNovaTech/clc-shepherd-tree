import dagre from "@dagrejs/dagre";

export const NODE_WIDTH = 240;
export const NODE_HEIGHT = 100;

const SUPER_ROOT = "__super_root__";

export type LayoutEdge = { source: string; target: string };

/**
 * Computes a clean top-to-bottom hierarchical layout for an arbitrary forest
 * (any number of independent roots, any mix of depth/width). A virtual
 * super-root is wired to every real root purely for layout purposes so
 * independent trees are placed deterministically without overlapping, then
 * discarded before returning positions.
 */
export function computeLayout(
  visibleIds: string[],
  edges: LayoutEdge[],
  rootIds: string[]
): Record<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 48, ranksep: 96, marginx: 40, marginy: 40 });

  for (const id of visibleIds) {
    g.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  g.setNode(SUPER_ROOT, { width: 1, height: 1 });
  for (const rootId of rootIds) {
    g.setEdge(SUPER_ROOT, rootId);
  }

  dagre.layout(g);

  const positions: Record<string, { x: number; y: number }> = {};
  let minY = Infinity;
  for (const id of visibleIds) {
    const node = g.node(id);
    const x = node.x - NODE_WIDTH / 2;
    const y = node.y - NODE_HEIGHT / 2;
    positions[id] = { x, y };
    if (y < minY) minY = y;
  }

  if (minY !== Infinity && minY !== 0) {
    for (const id of visibleIds) {
      positions[id].y -= minY;
    }
  }

  return positions;
}
