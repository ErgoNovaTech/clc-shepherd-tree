"use client";

import { useEffect, useRef } from "react";
import {
  Eye,
  Pencil,
  ArrowRightLeft,
  UserCheck,
  UserPlus,
  Repeat,
  ChevronsUpDown,
  Focus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ContextMenuState = { personId: string; x: number; y: number } | null;

export function ContextMenu({
  state,
  onClose,
  hasChildren,
  isCollapsed,
  isRoot,
  actions,
}: {
  state: ContextMenuState;
  onClose: () => void;
  hasChildren: boolean;
  isCollapsed: boolean;
  isRoot: boolean;
  actions: {
    onViewDetails: (id: string) => void;
    onEdit: (id: string) => void;
    onChangeShepherd: (id: string) => void;
    onSetShadowShepherd: (id: string) => void;
    onAddUnder: (id: string) => void;
    onReplace: (id: string) => void;
    onToggleCollapse: (id: string) => void;
    onFocusBranch: (id: string) => void;
    onDelete: (id: string) => void;
  };
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state) return;
    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [state, onClose]);

  if (!state) return null;

  const { personId, x, y } = state;
  const items: { label: string; icon: React.ReactNode; onClick: () => void; destructive?: boolean }[] = [
    { label: "View Details", icon: <Eye className="h-4 w-4" />, onClick: () => actions.onViewDetails(personId) },
    { label: "Edit Person", icon: <Pencil className="h-4 w-4" />, onClick: () => actions.onEdit(personId) },
    {
      label: "Change Shepherd",
      icon: <ArrowRightLeft className="h-4 w-4" />,
      onClick: () => actions.onChangeShepherd(personId),
    },
    {
      label: "Set Shadow Shepherd",
      icon: <UserCheck className="h-4 w-4" />,
      onClick: () => actions.onSetShadowShepherd(personId),
    },
    { label: "Add Person Under", icon: <UserPlus className="h-4 w-4" />, onClick: () => actions.onAddUnder(personId) },
    { label: "Replace Person", icon: <Repeat className="h-4 w-4" />, onClick: () => actions.onReplace(personId) },
    ...(hasChildren && !isRoot
      ? [
          {
            label: isCollapsed ? "Expand Branch" : "Collapse Branch",
            icon: <ChevronsUpDown className="h-4 w-4" />,
            onClick: () => actions.onToggleCollapse(personId),
          },
        ]
      : []),
    ...(hasChildren
      ? [
          {
            label: "Focus on Branch",
            icon: <Focus className="h-4 w-4" />,
            onClick: () => actions.onFocusBranch(personId),
          },
        ]
      : []),
    {
      label: "Delete Person",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => actions.onDelete(personId),
      destructive: true,
    },
  ];

  const maxLeft = typeof window !== "undefined" ? window.innerWidth - 210 : x;
  const maxTop = typeof window !== "undefined" ? window.innerHeight - items.length * 34 - 16 : y;

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-50 w-52 rounded-md border border-slate-200 bg-white p-1 shadow-lg"
      style={{ left: Math.min(x, Math.max(maxLeft, 8)), top: Math.min(y, Math.max(maxTop, 8)) }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          role="menuitem"
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100",
            item.destructive && "text-red-600 hover:bg-red-50"
          )}
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
