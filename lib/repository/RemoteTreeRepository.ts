import type { Person } from "@/types/person";
import type { ShepherdRelationship } from "@/types/relationship";
import type { TreeRepository, TreeSnapshot } from "./TreeRepository";

const ENDPOINT = "/api/tree";

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body?.error ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Talks to app/api/tree (backed by Mongo Atlas) instead of local browser storage.
 * The tree is now shared, central state — every admin sees the same data.
 */
export class RemoteTreeRepository implements TreeRepository {
  async getTree(): Promise<TreeSnapshot> {
    const res = await fetch(ENDPOINT, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, "Failed to load tree from the server"));
    }
    const data = await res.json();
    return { people: data.people ?? [], relationships: data.relationships ?? [] };
  }

  async saveTree(data: TreeSnapshot): Promise<void> {
    const res = await fetch(ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, "Failed to save tree to the server"));
    }
  }

  async addPerson(person: Person): Promise<void> {
    const tree = await this.getTree();
    await this.saveTree({ ...tree, people: [...tree.people, person] });
  }

  async updatePerson(id: string, patch: Partial<Person>): Promise<void> {
    const tree = await this.getTree();
    await this.saveTree({
      ...tree,
      people: tree.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  }

  async deletePerson(id: string): Promise<void> {
    const tree = await this.getTree();
    await this.saveTree({
      ...tree,
      people: tree.people.filter((p) => p.id !== id),
      relationships: tree.relationships.filter((r) => r.shepherdId !== id && r.memberId !== id),
    });
  }

  async addRelationship(rel: ShepherdRelationship): Promise<void> {
    const tree = await this.getTree();
    await this.saveTree({ ...tree, relationships: [...tree.relationships, rel] });
  }

  async removeRelationship(id: string): Promise<void> {
    const tree = await this.getTree();
    await this.saveTree({ ...tree, relationships: tree.relationships.filter((r) => r.id !== id) });
  }

  async clearAll(): Promise<void> {
    const res = await fetch(ENDPOINT, { method: "DELETE" });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, "Failed to reset tree on the server"));
    }
  }
}
