import { create } from "zustand";
import type { FocusMode } from "@/types/graph";

export type ActiveView = "tree" | "dashboard" | "people" | "unassigned";

type UIState = {
  collapsedIds: Set<string>;
  selectedPersonId: string | null;
  focusMode: FocusMode;
  searchQuery: string;
  detailsOpen: boolean;
  activeView: ActiveView;

  toggleCollapsed: (id: string) => void;
  expandAncestors: (ancestorIds: string[]) => void;
  collapseAll: (ids: string[]) => void;
  expandAll: () => void;

  selectPerson: (id: string | null) => void;
  setFocusMode: (mode: FocusMode) => void;
  setSearchQuery: (query: string) => void;
  setDetailsOpen: (open: boolean) => void;
  setActiveView: (view: ActiveView) => void;
};

/** UI/view state — deliberately kept out of useTreeStore's undo/redo history. */
export const useUIStore = create<UIState>((set) => ({
  collapsedIds: new Set(),
  selectedPersonId: null,
  focusMode: null,
  searchQuery: "",
  detailsOpen: false,
  activeView: "tree",

  toggleCollapsed: (id) =>
    set((state) => {
      const next = new Set(state.collapsedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { collapsedIds: next };
    }),

  expandAncestors: (ancestorIds) =>
    set((state) => {
      if (ancestorIds.length === 0) return state;
      const next = new Set(state.collapsedIds);
      let changed = false;
      for (const id of ancestorIds) {
        if (next.delete(id)) changed = true;
      }
      return changed ? { collapsedIds: next } : state;
    }),

  collapseAll: (ids) => set({ collapsedIds: new Set(ids) }),
  expandAll: () => set({ collapsedIds: new Set() }),

  selectPerson: (id) => set({ selectedPersonId: id, detailsOpen: id !== null }),
  setFocusMode: (mode) => set({ focusMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setDetailsOpen: (open) => set({ detailsOpen: open }),
  setActiveView: (view) => set({ activeView: view }),
}));
