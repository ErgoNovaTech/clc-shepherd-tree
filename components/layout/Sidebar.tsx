"use client";

import { useState } from "react";
import { LayoutDashboard, GitBranch, Users, UserX, Database, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUIStore, type ActiveView } from "@/store/useUIStore";

const NAV_ITEMS: { view: ActiveView; label: string; icon: React.ReactNode }[] = [
  { view: "tree", label: "Tree", icon: <GitBranch className="h-4 w-4" /> },
  { view: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { view: "people", label: "People", icon: <Users className="h-4 w-4" /> },
  { view: "unassigned", label: "Unassigned", icon: <UserX className="h-4 w-4" /> },
];

export function Sidebar({ onOpenData }: { onOpenData: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-slate-200 bg-white p-2 transition-all md:flex",
        collapsed ? "w-14" : "w-52"
      )}
    >
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium",
              activeView === item.view ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            )}
            title={item.label}
          >
            {item.icon}
            {!collapsed && item.label}
          </button>
        ))}

        <div className="pt-2">
          {!collapsed && <p className="px-2.5 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Data</p>}
          <button
            onClick={onOpenData}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            title="Import / Export"
          >
            <Database className="h-4 w-4" />
            {!collapsed && "Import / Export"}
          </button>
        </div>
      </nav>

      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-center rounded-md py-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
