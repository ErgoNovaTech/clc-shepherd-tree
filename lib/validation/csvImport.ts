import Papa from "papaparse";
import type { Person } from "@/types/person";
import type { ShepherdRelationship } from "@/types/relationship";
import { generateId } from "@/lib/utils/id";
import { nowIso } from "@/lib/utils/date";

type CsvRow = {
  name?: string;
  role?: string;
  phone?: string;
  email?: string;
  shepherd?: string;
};

export type CsvImportIssue = {
  row: number;
  personName: string;
  message: string;
};

export type CsvImportResult = {
  people: Person[];
  relationships: ShepherdRelationship[];
  issues: CsvImportIssue[];
};

/**
 * Parses a shepherd-tree CSV (name,role,phone,email,shepherd). Shepherd is
 * matched by name (case-insensitive) against other rows in the same file;
 * an unresolved shepherd leaves the person unassigned and is reported as an
 * issue rather than silently dropped or rejected.
 */
export function parseCsvImport(csvText: string): CsvImportResult {
  const parsed = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const people: Person[] = [];
  const relationships: ShepherdRelationship[] = [];
  const issues: CsvImportIssue[] = [];
  const idByNameLower = new Map<string, string>();
  const pendingShepherdName = new Map<string, string>(); // personId -> shepherd name

  parsed.data.forEach((row, i) => {
    const name = row.name?.trim();
    if (!name) {
      issues.push({ row: i + 2, personName: "(blank)", message: "Missing name — row skipped" });
      return;
    }

    const id = generateId();
    const timestamp = nowIso();
    people.push({
      id,
      name,
      role: row.role?.trim() || undefined,
      phone: row.phone?.trim() || undefined,
      email: row.email?.trim() || undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    idByNameLower.set(name.toLowerCase(), id);

    const shepherdName = row.shepherd?.trim();
    if (shepherdName) pendingShepherdName.set(id, shepherdName);
  });

  for (const [memberId, shepherdName] of pendingShepherdName) {
    const shepherdId = idByNameLower.get(shepherdName.toLowerCase());
    const member = people.find((p) => p.id === memberId)!;
    if (!shepherdId) {
      issues.push({
        row: 0,
        personName: member.name,
        message: `Shepherd "${shepherdName}" not found — placed under Unassigned`,
      });
      continue;
    }
    if (shepherdId === memberId) {
      issues.push({
        row: 0,
        personName: member.name,
        message: `Cannot be their own shepherd — placed under Unassigned`,
      });
      continue;
    }
    relationships.push({
      id: generateId(),
      shepherdId,
      memberId,
      createdAt: nowIso(),
    });
  }

  return { people, relationships, issues };
}
