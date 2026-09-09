import { get, set, del } from "idb-keyval";
import type { Person } from "@/types/person";
import type { ShepherdRelationship } from "@/types/relationship";
import type { TreeRepository, TreeSnapshot } from "./TreeRepository";

const STORAGE_KEY = "shepherd-tree-data";

type StoredBlob = TreeSnapshot & { meta: { version: 1; updatedAt: string } };

const EMPTY: TreeSnapshot = { people: [], relationships: [] };

export class LocalTreeRepository implements TreeRepository {
  async getTree(): Promise<TreeSnapshot> {
    try {
      const blob = await get<StoredBlob>(STORAGE_KEY);
      if (!blob) return EMPTY;
      return { people: blob.people ?? [], relationships: blob.relationships ?? [] };
    } catch (err) {
      console.error("Failed to read tree from storage", err);
      return EMPTY;
    }
  }

  async saveTree(data: TreeSnapshot): Promise<void> {
    const blob: StoredBlob = {
      ...data,
      meta: { version: 1, updatedAt: new Date().toISOString() },
    };
    await set(STORAGE_KEY, blob);
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
      relationships: tree.relationships.filter(
        (r) => r.shepherdId !== id && r.memberId !== id
      ),
    });
  }

  async addRelationship(rel: ShepherdRelationship): Promise<void> {
    const tree = await this.getTree();
    await this.saveTree({ ...tree, relationships: [...tree.relationships, rel] });
  }

  async removeRelationship(id: string): Promise<void> {
    const tree = await this.getTree();
    await this.saveTree({
      ...tree,
      relationships: tree.relationships.filter((r) => r.id !== id),
    });
  }

  async clearAll(): Promise<void> {
    await del(STORAGE_KEY);
  }
}
