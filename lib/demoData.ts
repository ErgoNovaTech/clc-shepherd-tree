import type { Person } from "@/types/person";
import type { ShepherdRelationship } from "@/types/relationship";
import { generateId } from "@/lib/utils/id";
import { nowIso } from "@/lib/utils/date";
import type { TreeSnapshot } from "@/lib/repository/TreeRepository";

type Node = { name: string; role?: string; children?: Node[] };

const DEMO_TREE: Node = {
  name: "Pastor Samuel",
  role: "Senior Pastor",
  children: [
    {
      name: "Daniel",
      role: "Shepherd",
      children: [{ name: "Michael" }, { name: "Grace" }, { name: "Joseph" }],
    },
    {
      name: "Peter",
      role: "Shepherd",
      children: [{ name: "Esther" }, { name: "David" }],
    },
    {
      name: "John",
      role: "Shepherd",
      children: [{ name: "Sarah" }, { name: "Mary" }],
    },
  ],
};

export function createDemoTree(): TreeSnapshot {
  const people: Person[] = [];
  const relationships: ShepherdRelationship[] = [];

  function walk(node: Node, shepherdId: string | null) {
    const timestamp = nowIso();
    const id = generateId();
    people.push({
      id,
      name: node.name,
      role: node.role,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    if (shepherdId) {
      relationships.push({ id: generateId(), shepherdId, memberId: id, createdAt: timestamp });
    }
    for (const child of node.children ?? []) {
      walk(child, id);
    }
  }

  walk(DEMO_TREE, null);
  return { people, relationships };
}
