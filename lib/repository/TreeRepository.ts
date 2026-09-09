import type { Person } from "@/types/person";
import type { ShepherdRelationship } from "@/types/relationship";

export type TreeSnapshot = {
  people: Person[];
  relationships: ShepherdRelationship[];
};

/**
 * Abstraction over tree persistence. LocalTreeRepository backs this with
 * IndexedDB today; a future PostgresTreeRepository (or any server-backed
 * implementation) can implement the same interface without touching the
 * store or UI layers.
 */
export interface TreeRepository {
  getTree(): Promise<TreeSnapshot>;
  saveTree(data: TreeSnapshot): Promise<void>;
  addPerson(person: Person): Promise<void>;
  updatePerson(id: string, patch: Partial<Person>): Promise<void>;
  deletePerson(id: string): Promise<void>;
  addRelationship(rel: ShepherdRelationship): Promise<void>;
  removeRelationship(id: string): Promise<void>;
  clearAll(): Promise<void>;
}
