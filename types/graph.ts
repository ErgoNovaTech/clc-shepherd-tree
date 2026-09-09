export type FocusMode = "upline" | "downline" | "branch" | null;

export type VisibleEdge = {
  source: string;
  target: string;
};

export type VisibleGraph = {
  visibleIds: string[];
  edges: VisibleEdge[];
};

export type DeleteStrategy =
  | "to-own-shepherd"
  | "to-chosen-shepherd"
  | "per-person"
  | "delete-branch";

export type ReplaceStrategy = "transfer-all" | "keep-under-original" | "per-person";

export type Statistics = {
  totalPeople: number;
  shepherds: number;
  rootLeaders: number;
  branches: number;
  unassigned: number;
};
