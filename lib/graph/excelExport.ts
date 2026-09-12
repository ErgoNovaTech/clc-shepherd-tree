import * as XLSX from "xlsx";
import type { Person } from "@/types/person";
import type { ShepherdRelationship } from "@/types/relationship";
import { buildTraversalIndex, computeDescendantCounts, getDepth, getShadowShepherdId } from "./traversal";

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  transferred: "Transferred",
};

const COLUMN_WIDTHS = [22, 16, 12, 16, 24, 16, 22, 22, 8, 14, 14, 30];

/**
 * Denormalizes the tree into one flat, human-readable sheet — one row per
 * person, with their shepherd's name and computed level/downline (rather
 * than raw ids) so it's actually useful opened straight in Excel/Sheets.
 */
export function exportTreeAsExcel(
  people: Person[],
  relationships: ShepherdRelationship[],
  filename = `shepherd-tree-${new Date().toISOString().slice(0, 10)}.xlsx`
) {
  const index = buildTraversalIndex(relationships);
  const peopleIds = people.map((p) => p.id);
  const descendantCounts = computeDescendantCounts(peopleIds, index);
  const peopleById = new Map(people.map((p) => [p.id, p]));

  const rows = people
    .map((person) => {
      const shepherdId = index.shepherdByMember.get(person.id);
      const shepherd = shepherdId ? peopleById.get(shepherdId) : undefined;
      const shadowShepherdId = getShadowShepherdId(person.id, index.shepherdByMember);
      const shadowShepherd = shadowShepherdId ? peopleById.get(shadowShepherdId) : undefined;
      return {
        Name: person.name,
        Role: person.role ?? "",
        Status: person.status ? STATUS_LABEL[person.status] : "",
        Phone: person.phone ?? "",
        Email: person.email ?? "",
        Location: person.location ?? "",
        Shepherd: shepherd?.name ?? "",
        "Shadow Shepherd": shadowShepherd?.name ?? "",
        Level: getDepth(person.id, index.shepherdByMember),
        "Direct Reports": index.childrenByShepherd.get(person.id)?.length ?? 0,
        "Total Downline": descendantCounts.get(person.id) ?? 0,
        Notes: person.notes ?? "",
      };
    })
    .sort((a, b) => a.Level - b.Level || a.Name.localeCompare(b.Name));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = COLUMN_WIDTHS.map((wch) => ({ wch }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "People");
  XLSX.writeFile(workbook, filename);
}
