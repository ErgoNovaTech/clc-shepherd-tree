"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import { useTreeStore } from "@/store/useTreeStore";
import { useUIStore } from "@/store/useUIStore";
import { useTraversalIndex, useDescendantCounts } from "@/lib/graph/useTraversalIndex";
import { getVisibleGraph } from "@/lib/graph/visibility";
import { getFocusedIds } from "@/lib/graph/focus";
import { getAncestors, getDescendants } from "@/lib/graph/traversal";
import { computeLayout, NODE_WIDTH, NODE_HEIGHT } from "@/lib/graph/layout";
import { searchPeople } from "@/lib/graph/search";
import { PersonNode, type PersonNodeData } from "@/components/graph/PersonNode";
import { GraphControls } from "@/components/graph/GraphControls";
import { ContextMenu, type ContextMenuState } from "@/components/graph/ContextMenu";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";

const nodeTypes = { person: PersonNode };

type TreeCanvasProps = {
  onEdit: (id: string) => void;
  onChangeShepherd: (id: string) => void;
  onAddUnder: (id: string) => void;
  onReplace: (id: string) => void;
  onDelete: (id: string) => void;
};

function TreeCanvasInner(props: TreeCanvasProps) {
  const people = useTreeStore((s) => s.people);
  const connectRelationship = useTreeStore((s) => s.connectRelationship);

  const collapsedIds = useUIStore((s) => s.collapsedIds);
  const selectedPersonId = useUIStore((s) => s.selectedPersonId);
  const focusMode = useUIStore((s) => s.focusMode);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const toggleCollapsed = useUIStore((s) => s.toggleCollapsed);
  const selectPerson = useUIStore((s) => s.selectPerson);
  const expandIds = useUIStore((s) => s.expandIds);
  const setFocusMode = useUIStore((s) => s.setFocusMode);

  const index = useTraversalIndex();
  const descendantCounts = useDescendantCounts();
  const { setCenter } = useReactFlow();

  const peopleIds = useMemo(() => Object.keys(people), [people]);

  const visibleGraph = useMemo(
    () => getVisibleGraph(peopleIds, index, collapsedIds),
    [peopleIds, index, collapsedIds]
  );

  const focusedIds = useMemo(
    () => getFocusedIds(selectedPersonId, focusMode, index),
    [selectedPersonId, focusMode, index]
  );

  const { finalVisibleIds, finalEdges, layoutRootIds } = useMemo(() => {
    let ids: string[];
    let edges: { source: string; target: string }[];

    if (focusedIds) {
      // Focus mode (View Upline/Downline/Full Branch) shows everyone it asks
      // for in full, regardless of collapse state — building it straight from
      // focusedIds instead of intersecting with visibleGraph avoids losing
      // descendants that sit behind a branch the admin still has collapsed.
      ids = Array.from(focusedIds);
      edges = [];
      for (const id of ids) {
        const shepherdId = index.shepherdByMember.get(id);
        if (shepherdId && focusedIds.has(shepherdId)) {
          edges.push({ source: shepherdId, target: id });
        }
      }
    } else {
      ids = visibleGraph.visibleIds;
      edges = visibleGraph.edges;
    }

    const targets = new Set(edges.map((e) => e.target));
    const roots = ids.filter((id) => !targets.has(id));
    return { finalVisibleIds: ids, finalEdges: edges, layoutRootIds: roots };
  }, [visibleGraph, focusedIds, index]);

  const highlightedIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    return new Set(searchPeople(Object.values(people), searchQuery).map((p) => p.id));
  }, [people, searchQuery]);

  const [layoutVersion, setLayoutVersion] = useState(0);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<PersonNodeData>>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [pendingConnect, setPendingConnect] = useState<{
    shepherdId: string;
    memberId: string;
    existingShepherdName: string;
  } | null>(null);

  const handleToggleCollapse = useCallback(
    (id: string) => {
      // Root leaders can't be collapsed — doing so would hide the entire
      // tree with no easy way back (collapse state is deliberately excluded
      // from undo/redo, since it's view state, not data).
      if (!index.shepherdByMember.has(id)) return;
      toggleCollapsed(id);
    },
    [toggleCollapsed, index]
  );
  const handleOpenMenu = useCallback(
    (id: string, x: number, y: number) => setContextMenu({ personId: id, x, y }),
    []
  );

  // Clicking a node selects it and reveals its whole branch at once — the
  // tree defaults to root + direct reports only, so this is how you drill in.
  const handleNodeClick = useCallback(
    (id: string) => {
      selectPerson(id);
      const descendants = getDescendants(id, index.childrenByShepherd);
      if (descendants.length > 0) expandIds([id, ...descendants]);
    },
    [selectPerson, expandIds, index]
  );

  useEffect(() => {
    const positions = computeLayout(finalVisibleIds, finalEdges, layoutRootIds);

    setNodes(
      finalVisibleIds.map((id) => ({
        id,
        type: "person",
        position: positions[id] ?? { x: 0, y: 0 },
        selected: id === selectedPersonId,
        data: {
          person: people[id],
          descendantCount: descendantCounts.get(id) ?? 0,
          hasChildren: index.childrenByShepherd.has(id),
          isCollapsed: collapsedIds.has(id),
          isHighlighted: highlightedIds.has(id),
          isRoot: !index.shepherdByMember.has(id),
          onToggleCollapse: handleToggleCollapse,
          onOpenMenu: handleOpenMenu,
        } satisfies PersonNodeData,
      }))
    );

    setEdges(
      finalEdges.map((e) => ({
        id: `${e.source}->${e.target}`,
        source: e.source,
        target: e.target,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalVisibleIds, finalEdges, layoutRootIds, layoutVersion]);

  // Keep node data (selection/highlight/collapse) fresh without re-running layout.
  useEffect(() => {
    setNodes((prev) =>
      prev.map((node) => ({
        ...node,
        selected: node.id === selectedPersonId,
        data: {
          ...node.data,
          person: people[node.id],
          descendantCount: descendantCounts.get(node.id) ?? 0,
          hasChildren: index.childrenByShepherd.has(node.id),
          isCollapsed: collapsedIds.has(node.id),
          isHighlighted: highlightedIds.has(node.id),
          isRoot: !index.shepherdByMember.has(node.id),
        },
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people, descendantCounts, index, collapsedIds, highlightedIds, selectedPersonId]);

  const didInitialFit = useRef(false);
  useEffect(() => {
    if (didInitialFit.current || finalVisibleIds.length === 0) return;
    didInitialFit.current = true;
    const id = requestAnimationFrame(() => {
      const positions = computeLayout(finalVisibleIds, finalEdges, layoutRootIds);
      const xs = Object.values(positions).map((p) => p.x);
      const ys = Object.values(positions).map((p) => p.y);
      if (xs.length === 0) return;
      setCenter(
        (Math.min(...xs) + Math.max(...xs) + NODE_WIDTH) / 2,
        (Math.min(...ys) + Math.max(...ys) + NODE_HEIGHT) / 2,
        { zoom: 0.8, duration: 0 }
      );
    });
    return () => cancelAnimationFrame(id);
  }, [finalVisibleIds, finalEdges, layoutRootIds, setCenter]);

  // Expand ancestors of a newly selected person (e.g. from search) so a
  // collapsed ancestor doesn't keep them hidden.
  useEffect(() => {
    if (!selectedPersonId) return;
    expandIds(getAncestors(selectedPersonId, index.shepherdByMember));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPersonId]);

  // Center on the selected person once they actually show up in the visible
  // set — that may take one extra render after the expand above lands, since
  // finalVisibleIds here is still the pre-expand snapshot until it re-renders.
  const lastCenteredId = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedPersonId || lastCenteredId.current === selectedPersonId) return;
    if (!finalVisibleIds.includes(selectedPersonId)) return;
    const id = requestAnimationFrame(() => {
      const positions = computeLayout(finalVisibleIds, finalEdges, layoutRootIds);
      const pos = positions[selectedPersonId];
      if (pos) {
        lastCenteredId.current = selectedPersonId;
        setCenter(pos.x + NODE_WIDTH / 2, pos.y + NODE_HEIGHT / 2, { zoom: 1, duration: 400 });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [selectedPersonId, finalVisibleIds, finalEdges, layoutRootIds, setCenter]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const result = connectRelationship(connection.source, connection.target);
      if (result.ok) {
        toast.success("Relationship created.");
        return;
      }
      if (result.code === "ALREADY_HAS_SHEPHERD") {
        setPendingConnect({
          shepherdId: connection.source,
          memberId: connection.target,
          existingShepherdName: people[result.existingShepherdId]?.name ?? "someone else",
        });
      } else if (result.code === "WOULD_CREATE_CYCLE") {
        toast.error("That connection would create a circular shepherding chain.");
      } else {
        toast.error("A person cannot be their own shepherd.");
      }
    },
    [connectRelationship, people]
  );

  const contextTarget = contextMenu ? people[contextMenu.personId] : undefined;

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={() => {}}
        onConnect={handleConnect}
        onNodeContextMenu={(e, node) => {
          e.preventDefault();
          setContextMenu({ personId: node.id, x: e.clientX, y: e.clientY });
        }}
        onNodeClick={(_, node) => handleNodeClick(node.id)}
        onPaneClick={() => setContextMenu(null)}
        fitView={false}
        minZoom={0.05}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} color="#e2e8f0" />
        <MiniMap
          pannable
          zoomable
          nodeColor="#cbd5e1"
          maskColor="rgba(241,245,249,0.6)"
          className="!bottom-4 !right-4"
        />
      </ReactFlow>

      <div className="absolute right-4 top-4">
        <GraphControls onAutoLayout={() => setLayoutVersion((v) => v + 1)} />
      </div>

      {focusMode && (
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm">
          Focused: {focusMode === "upline" ? "Upline" : focusMode === "downline" ? "Downline" : "Full branch"}
          <button className="font-medium text-slate-900 hover:underline" onClick={() => setFocusMode(null)}>
            Clear
          </button>
        </div>
      )}

      {contextTarget && (
        <ContextMenu
          state={contextMenu}
          onClose={() => setContextMenu(null)}
          hasChildren={index.childrenByShepherd.has(contextTarget.id)}
          isCollapsed={collapsedIds.has(contextTarget.id)}
          isRoot={!index.shepherdByMember.has(contextTarget.id)}
          actions={{
            onViewDetails: selectPerson,
            onEdit: props.onEdit,
            onChangeShepherd: props.onChangeShepherd,
            onAddUnder: props.onAddUnder,
            onReplace: props.onReplace,
            onToggleCollapse: handleToggleCollapse,
            onFocusBranch: (id) => {
              selectPerson(id);
              setFocusMode("branch");
            },
            onDelete: props.onDelete,
          }}
        />
      )}

      <ConfirmDialog
        open={pendingConnect !== null}
        onOpenChange={(open) => !open && setPendingConnect(null)}
        title="Replace existing shepherd?"
        description={
          pendingConnect
            ? `${people[pendingConnect.memberId]?.name} already has a shepherd (${pendingConnect.existingShepherdName}). Replace it with ${people[pendingConnect.shepherdId]?.name}?`
            : undefined
        }
        confirmLabel="Replace"
        onConfirm={() => {
          if (!pendingConnect) return;
          connectRelationship(pendingConnect.shepherdId, pendingConnect.memberId, { replaceExisting: true });
          toast.success(`${people[pendingConnect.memberId]?.name} has been moved under ${people[pendingConnect.shepherdId]?.name}.`);
        }}
      />
    </div>
  );
}

export function TreeCanvas(props: TreeCanvasProps) {
  return (
    <ReactFlowProvider>
      <TreeCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
