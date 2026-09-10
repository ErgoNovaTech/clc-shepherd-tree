import { create } from "zustand";
import { toast } from "sonner";
import type { Person, PersonInput } from "@/types/person";
import type { ShepherdRelationship } from "@/types/relationship";
import type { DeleteStrategy, ReplaceStrategy } from "@/types/graph";
import { generateId } from "@/lib/utils/id";
import { nowIso } from "@/lib/utils/date";
import { treeRepository } from "@/lib/repository";
import type { TreeSnapshot } from "@/lib/repository/TreeRepository";
import { buildTraversalIndex, getDescendants } from "@/lib/graph/traversal";
import { validateAddRelationship, type AddRelationshipResult } from "@/lib/validation/relationshipRules";
import { createDemoTree } from "@/lib/demoData";

const HISTORY_LIMIT = 50;

type DomainSnapshot = {
  people: Record<string, Person>;
  relationships: ShepherdRelationship[];
};

type TreeState = DomainSnapshot & {
  hydrated: boolean;
  /** Set when the initial load from the server fails. While set, the app must
   *  never treat the (empty) local state as real — that would let a later
   *  save silently overwrite real data in the database. */
  hydrationError: string | null;
  past: DomainSnapshot[];
  future: DomainSnapshot[];

  hydrate: () => Promise<void>;

  addPerson: (input: PersonInput, shepherdId: string | null) => string;
  updatePerson: (id: string, patch: Partial<PersonInput>) => void;

  /** Low-level connect, used by drag-connect on the canvas. Rejects a second
   *  shepherd unless replaceExisting is passed. */
  connectRelationship: (
    shepherdId: string,
    memberId: string,
    opts?: { replaceExisting?: boolean }
  ) => AddRelationshipResult;

  /** Move a person (and their existing subtree, untouched) to a new shepherd,
   *  or to null to make them a root. */
  changeShepherd: (personId: string, newShepherdId: string | null) => AddRelationshipResult;

  replacePerson: (params: {
    originalId: string;
    replacement: { type: "existing"; personId: string } | { type: "new"; input: PersonInput };
    strategy: ReplaceStrategy;
    perPersonAssignments?: Record<string, string | null>;
    deleteOriginalIfEmpty: boolean;
  }) => AddRelationshipResult;

  deletePerson: (
    id: string,
    strategy: DeleteStrategy,
    opts?: { chosenShepherdId?: string | null; perPersonAssignments?: Record<string, string | null> }
  ) => void;

  importTree: (data: TreeSnapshot) => void;
  resetTree: () => Promise<void>;
  loadDemoData: () => void;

  undo: () => void;
  redo: () => void;
};

function toRecord(people: Person[]): Record<string, Person> {
  const record: Record<string, Person> = {};
  for (const p of people) record[p.id] = p;
  return record;
}

function persist(people: Record<string, Person>, relationships: ShepherdRelationship[]) {
  void treeRepository.saveTree({ people: Object.values(people), relationships }).catch((err) => {
    console.error("Failed to persist tree", err);
    toast.error("Couldn't save that change to the server — check your connection and try again.");
  });
}

export const useTreeStore = create<TreeState>((set, get) => {
  /** Wraps a mutation so it counts as exactly one undo step, then persists. */
  function withHistory(mutate: (state: DomainSnapshot) => DomainSnapshot) {
    const current = get();
    const snapshot: DomainSnapshot = {
      people: current.people,
      relationships: current.relationships,
    };
    const next = mutate(snapshot);
    set({
      people: next.people,
      relationships: next.relationships,
      past: [...current.past, snapshot].slice(-HISTORY_LIMIT),
      future: [],
    });
    persist(next.people, next.relationships);
  }

  function removeMemberRelationship(relationships: ShepherdRelationship[], memberId: string) {
    return relationships.filter((r) => r.memberId !== memberId);
  }

  return {
    people: {},
    relationships: [],
    hydrated: false,
    hydrationError: null,
    past: [],
    future: [],

    hydrate: async () => {
      try {
        const tree = await treeRepository.getTree();
        set({
          people: toRecord(tree.people),
          relationships: tree.relationships,
          hydrated: true,
          hydrationError: null,
        });
      } catch (err) {
        console.error("Failed to load tree from the server", err);
        set({
          hydrated: true,
          hydrationError: err instanceof Error ? err.message : "Failed to load tree from the server",
        });
      }
    },

    addPerson: (input, shepherdId) => {
      const id = generateId();
      const timestamp = nowIso();
      const person: Person = { id, ...input, createdAt: timestamp, updatedAt: timestamp };

      withHistory((state) => {
        const people = { ...state.people, [id]: person };
        const relationships = shepherdId
          ? [...state.relationships, { id: generateId(), shepherdId, memberId: id, createdAt: timestamp }]
          : state.relationships;
        return { people, relationships };
      });

      return id;
    },

    updatePerson: (id, patch) => {
      withHistory((state) => {
        const existing = state.people[id];
        if (!existing) return state;
        const people = {
          ...state.people,
          [id]: { ...existing, ...patch, updatedAt: nowIso() },
        };
        return { people, relationships: state.relationships };
      });
    },

    connectRelationship: (shepherdId, memberId, opts) => {
      const { shepherdByMember } = buildTraversalIndex(get().relationships);
      const result = validateAddRelationship(shepherdId, memberId, shepherdByMember, opts);
      if (!result.ok) return result;

      withHistory((state) => ({
        people: state.people,
        relationships: [
          ...removeMemberRelationship(state.relationships, memberId),
          { id: generateId(), shepherdId, memberId, createdAt: nowIso() },
        ],
      }));

      return result;
    },

    changeShepherd: (personId, newShepherdId) => {
      if (newShepherdId === null) {
        withHistory((state) => ({
          people: state.people,
          relationships: removeMemberRelationship(state.relationships, personId),
        }));
        return { ok: true };
      }
      return get().connectRelationship(newShepherdId, personId, { replaceExisting: true });
    },

    replacePerson: ({ originalId, replacement, strategy, perPersonAssignments, deleteOriginalIfEmpty }) => {
      const { childrenByShepherd, shepherdByMember } = buildTraversalIndex(get().relationships);
      const parentOfOriginal = shepherdByMember.get(originalId) ?? null;

      let replacementId: string;
      let createdPerson: Person | null = null;
      if (replacement.type === "existing") {
        replacementId = replacement.personId;
      } else {
        const timestamp = nowIso();
        replacementId = generateId();
        createdPerson = { id: replacementId, ...replacement.input, createdAt: timestamp, updatedAt: timestamp };
      }

      if (parentOfOriginal) {
        const result = validateAddRelationship(parentOfOriginal, replacementId, shepherdByMember, {
          replaceExisting: true,
        });
        if (!result.ok) return result;
      }

      const children = childrenByShepherd.get(originalId) ?? [];

      withHistory((state) => {
        let people = state.people;
        let relationships = state.relationships;

        if (createdPerson) {
          people = { ...people, [replacementId]: createdPerson };
        }

        relationships = removeMemberRelationship(relationships, replacementId);
        if (parentOfOriginal) {
          relationships = [
            ...relationships,
            { id: generateId(), shepherdId: parentOfOriginal, memberId: replacementId, createdAt: nowIso() },
          ];
        }

        for (const childId of children) {
          if (childId === replacementId) continue;
          let newShepherdId: string | null;
          if (strategy === "transfer-all") newShepherdId = replacementId;
          else if (strategy === "keep-under-original") newShepherdId = originalId;
          else newShepherdId = perPersonAssignments?.[childId] ?? originalId;

          relationships = removeMemberRelationship(relationships, childId);
          if (newShepherdId) {
            relationships = [
              ...relationships,
              { id: generateId(), shepherdId: newShepherdId, memberId: childId, createdAt: nowIso() },
            ];
          }
        }

        relationships = removeMemberRelationship(relationships, originalId);

        const remainingChildren = relationships.filter((r) => r.shepherdId === originalId);
        if (deleteOriginalIfEmpty && remainingChildren.length === 0) {
          const nextPeople = { ...people };
          delete nextPeople[originalId];
          people = nextPeople;
        }

        return { people, relationships };
      });

      return { ok: true };
    },

    deletePerson: (id, strategy, opts) => {
      const { childrenByShepherd, shepherdByMember } = buildTraversalIndex(get().relationships);
      const children = childrenByShepherd.get(id) ?? [];
      const ownShepherd = shepherdByMember.get(id) ?? null;

      withHistory((state) => {
        const people = state.people;
        let relationships = state.relationships;

        if (strategy === "delete-branch") {
          const toRemove = new Set([id, ...getDescendants(id, childrenByShepherd)]);
          relationships = relationships.filter(
            (r) => !toRemove.has(r.shepherdId) && !toRemove.has(r.memberId)
          );
          const nextPeople = { ...people };
          for (const removeId of toRemove) delete nextPeople[removeId];
          return { people: nextPeople, relationships };
        }

        for (const childId of children) {
          let newShepherdId: string | null;
          if (strategy === "to-own-shepherd") newShepherdId = ownShepherd;
          else if (strategy === "to-chosen-shepherd") newShepherdId = opts?.chosenShepherdId ?? null;
          else newShepherdId = opts?.perPersonAssignments?.[childId] ?? null;

          relationships = removeMemberRelationship(relationships, childId);
          if (newShepherdId) {
            relationships = [
              ...relationships,
              { id: generateId(), shepherdId: newShepherdId, memberId: childId, createdAt: nowIso() },
            ];
          }
        }

        relationships = relationships.filter((r) => r.shepherdId !== id && r.memberId !== id);
        const nextPeople = { ...people };
        delete nextPeople[id];
        return { people: nextPeople, relationships };
      });
    },

    importTree: (data) => {
      withHistory(() => ({
        people: toRecord(data.people),
        relationships: data.relationships,
      }));
    },

    resetTree: async () => {
      set({ people: {}, relationships: [], past: [], future: [] });
      try {
        await treeRepository.clearAll();
      } catch (err) {
        console.error("Failed to reset tree on the server", err);
        toast.error("Reset locally, but the server still has the old data — check your connection and try again.");
      }
    },

    loadDemoData: () => {
      const demo = createDemoTree();
      withHistory(() => ({
        people: toRecord(demo.people),
        relationships: demo.relationships,
      }));
    },

    undo: () => {
      const { past, future, people, relationships } = get();
      if (past.length === 0) return;
      const previous = past[past.length - 1];
      set({
        people: previous.people,
        relationships: previous.relationships,
        past: past.slice(0, -1),
        future: [{ people, relationships }, ...future],
      });
      persist(previous.people, previous.relationships);
    },

    redo: () => {
      const { past, future, people, relationships } = get();
      if (future.length === 0) return;
      const next = future[0];
      set({
        people: next.people,
        relationships: next.relationships,
        past: [...past, { people, relationships }],
        future: future.slice(1),
      });
      persist(next.people, next.relationships);
    },
  };
});
