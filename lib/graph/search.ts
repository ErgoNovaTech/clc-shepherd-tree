import type { Person } from "@/types/person";

const SEARCHABLE_FIELDS: (keyof Person)[] = ["name", "phone", "email", "role", "location"];

export function searchPeople(people: Person[], query: string): Person[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return people.filter((person) =>
    SEARCHABLE_FIELDS.some((field) => {
      const value = person[field];
      return typeof value === "string" && value.toLowerCase().includes(q);
    })
  );
}
