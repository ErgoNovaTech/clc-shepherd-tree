import type { Person } from "./person";

export type ShepherdRelationship = {
  id: string;
  shepherdId: string;
  memberId: string;
  createdAt: string;
};

export type TreeData = {
  version: 1;
  people: Person[];
  relationships: ShepherdRelationship[];
};
