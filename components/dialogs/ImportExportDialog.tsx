"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { useTreeStore } from "@/store/useTreeStore";
import { downloadJson, readFileAsText } from "@/lib/utils/download";
import { treeDataSchema } from "@/lib/validation/personSchema";
import { parseCsvImport, type CsvImportIssue } from "@/lib/validation/csvImport";
import { exportTreeAsExcel } from "@/lib/graph/excelExport";

export function ImportExportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const people = useTreeStore((s) => s.people);
  const relationships = useTreeStore((s) => s.relationships);
  const importTree = useTreeStore((s) => s.importTree);
  const resetTree = useTreeStore((s) => s.resetTree);

  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<{ people: typeof people; relationships: typeof relationships } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [csvIssues, setCsvIssues] = useState<CsvImportIssue[]>([]);

  function handleExport() {
    downloadJson(`shepherd-tree-export-${new Date().toISOString().slice(0, 10)}.json`, {
      version: 1,
      people: Object.values(people),
      relationships,
    });
    toast.success("Tree exported.");
  }

  function handleExportExcel() {
    if (Object.keys(people).length === 0) {
      toast.error("There's no one in the tree yet.");
      return;
    }
    exportTreeAsExcel(Object.values(people), relationships);
    toast.success("Tree exported as Excel.");
  }

  async function handleJsonFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const parsed = treeDataSchema.parse(JSON.parse(text));
      const peopleRecord: typeof people = {};
      for (const p of parsed.people) peopleRecord[p.id] = p;
      setPendingImport({ people: peopleRecord, relationships: parsed.relationships });
    } catch (err) {
      console.error(err);
      toast.error("That file isn't a valid Shepherd Tree export.");
    }
  }

  async function handleCsvFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const result = parseCsvImport(text);
      if (result.people.length === 0) {
        toast.error("No valid rows found in that CSV.");
        return;
      }
      importTree({
        people: [...Object.values(people), ...result.people],
        relationships: [...relationships, ...result.relationships],
      });
      setCsvIssues(result.issues);
      toast.success(`Imported ${result.people.length} ${result.people.length === 1 ? "person" : "people"} from CSV.`);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't parse that CSV file.");
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent title="Data" description="Back up, restore, or reset your shepherd tree.">
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-slate-900">Export</h3>
              <p className="mb-2 text-sm text-slate-500">
                Download the entire tree as a JSON backup file, or as an Excel sheet for browsing/sharing with
                leadership.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleExport}>
                  Export Tree (JSON)
                </Button>
                <Button variant="outline" onClick={handleExportExcel}>
                  Export Tree (Excel)
                </Button>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-900">Import JSON</h3>
              <p className="mb-2 text-sm text-slate-500">Restore a tree from a previously exported JSON file.</p>
              <Button variant="outline" onClick={() => jsonInputRef.current?.click()}>
                Choose JSON File
              </Button>
              <input ref={jsonInputRef} type="file" accept="application/json" className="hidden" onChange={handleJsonFileSelected} />
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-900">Import CSV</h3>
              <p className="mb-2 text-sm text-slate-500">
                Columns: name, role, phone, email, shepherd. Adds to the current tree — shepherds not found are placed under Unassigned.
              </p>
              <Button variant="outline" onClick={() => csvInputRef.current?.click()}>
                Choose CSV File
              </Button>
              <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvFileSelected} />
              {csvIssues.length > 0 && (
                <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                  {csvIssues.map((issue, i) => (
                    <li key={i}>
                      {issue.personName}: {issue.message}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="text-sm font-semibold text-red-700">Reset Application</h3>
              <p className="mb-2 text-sm text-slate-500">Permanently remove the current local tree.</p>
              <Button variant="destructive" onClick={() => setResetOpen(true)}>
                Reset Application
              </Button>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingImport !== null}
        onOpenChange={(o) => !o && setPendingImport(null)}
        title="Replace current tree?"
        description="Importing this file will replace the current tree. Do you want to continue?"
        destructive
        confirmLabel="Import & Replace"
        onConfirm={() => {
          if (!pendingImport) return;
          importTree({ people: Object.values(pendingImport.people), relationships: pendingImport.relationships });
          toast.success("Tree imported successfully.");
        }}
      />

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset the application?"
        description="This will permanently remove the current local tree. Make sure you have exported a backup first."
        destructive
        confirmLabel="Reset"
        requireTypedConfirmation="RESET"
        onConfirm={() => {
          void resetTree();
          toast.success("Tree has been reset.");
          onOpenChange(false);
        }}
      />
    </>
  );
}
