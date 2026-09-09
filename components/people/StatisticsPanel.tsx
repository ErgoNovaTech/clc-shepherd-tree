"use client";

import { useTreeStore } from "@/store/useTreeStore";
import { useUIStore } from "@/store/useUIStore";
import { useTraversalIndex } from "@/lib/graph/useTraversalIndex";
import { computeStatistics } from "@/lib/graph/statistics";

export function StatisticsPanel() {
  const people = useTreeStore((s) => s.people);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const index = useTraversalIndex();
  const stats = computeStatistics(Object.values(people), index);

  const tiles: { label: string; value: number; onClick?: () => void }[] = [
    { label: "Total People", value: stats.totalPeople },
    { label: "Shepherds", value: stats.shepherds },
    { label: "Root Leaders", value: stats.rootLeaders },
    { label: "Branches", value: stats.branches },
    { label: "Unassigned", value: stats.unassigned, onClick: () => setActiveView("unassigned") },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => (
        <button
          key={tile.label}
          onClick={tile.onClick}
          disabled={!tile.onClick}
          className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors enabled:hover:border-slate-300 enabled:hover:bg-slate-50 disabled:cursor-default"
        >
          <p className="text-2xl font-semibold text-slate-900">{tile.value}</p>
          <p className="text-sm text-slate-500">{tile.label}</p>
        </button>
      ))}
    </div>
  );
}
