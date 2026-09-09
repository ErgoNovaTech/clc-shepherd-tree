"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Toolbar } from "@/components/layout/Toolbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { EmptyState } from "@/components/layout/EmptyState";
import { TreeCanvas } from "@/components/graph/TreeCanvas";
import { PersonDetailsPanel } from "@/components/people/PersonDetailsPanel";
import { StatisticsPanel } from "@/components/people/StatisticsPanel";
import { PeopleListView } from "@/components/people/PeopleListView";
import { UnassignedListView } from "@/components/people/UnassignedListView";
import { Toaster } from "@/components/ui/Toaster";
import { AddPersonDialog } from "@/components/dialogs/AddPersonDialog";
import { EditPersonDialog } from "@/components/dialogs/EditPersonDialog";
import { ChangeShepherdDialog } from "@/components/dialogs/ChangeShepherdDialog";
import { ReplacePersonDialog } from "@/components/dialogs/ReplacePersonDialog";
import { DeletePersonDialog } from "@/components/dialogs/DeletePersonDialog";
import { ImportExportDialog } from "@/components/dialogs/ImportExportDialog";
import { Button } from "@/components/ui/Button";
import { useTreeStore } from "@/store/useTreeStore";
import { useUIStore } from "@/store/useUIStore";
import { useUndoRedoShortcuts } from "@/lib/hooks/useUndoRedoShortcuts";

export function AppShell() {
  const hydrated = useTreeStore((s) => s.hydrated);
  const peopleCount = useTreeStore((s) => Object.keys(s.people).length);
  const hydrate = useTreeStore((s) => s.hydrate);
  const loadDemoData = useTreeStore((s) => s.loadDemoData);
  const activeView = useUIStore((s) => s.activeView);

  useUndoRedoShortcuts();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [addPersonDefaultShepherd, setAddPersonDefaultShepherd] = useState<string | null>(null);
  const [editPersonId, setEditPersonId] = useState<string | null>(null);
  const [changeShepherdPersonId, setChangeShepherdPersonId] = useState<string | null>(null);
  const [replacePersonId, setReplacePersonId] = useState<string | null>(null);
  const [deletePersonId, setDeletePersonId] = useState<string | null>(null);
  const [importExportOpen, setImportExportOpen] = useState(false);

  function openAddPerson(defaultShepherdId: string | null = null) {
    setAddPersonDefaultShepherd(defaultShepherdId);
    setAddPersonOpen(true);
  }

  if (!hydrated) {
    return <div className="flex h-screen items-center justify-center text-sm text-slate-400">Loading...</div>;
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <Toaster />
      <Toolbar onAddPerson={() => openAddPerson(null)} />

      {peopleCount === 0 ? (
        <EmptyState
          onAddFirstPerson={() => openAddPerson(null)}
          onLoadDemoData={() => {
            loadDemoData();
            toast.success("Demo data loaded.");
          }}
          onImportBackup={() => setImportExportOpen(true)}
        />
      ) : (
        <div className="flex min-h-0 flex-1">
          <Sidebar onOpenData={() => setImportExportOpen(true)} />

          <main className="min-w-0 flex-1 overflow-y-auto">
            {activeView === "tree" && (
              <TreeCanvas
                onEdit={setEditPersonId}
                onChangeShepherd={setChangeShepherdPersonId}
                onAddUnder={openAddPerson}
                onReplace={setReplacePersonId}
                onDelete={setDeletePersonId}
              />
            )}

            {activeView === "dashboard" && (
              <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
                  <Button variant="outline" size="sm" onClick={() => setImportExportOpen(true)}>
                    Import / Export
                  </Button>
                </div>
                <StatisticsPanel />
              </div>
            )}

            {activeView === "people" && (
              <div className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">People</h2>
                <PeopleListView />
              </div>
            )}

            {activeView === "unassigned" && (
              <div className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">Unassigned People</h2>
                <UnassignedListView />
              </div>
            )}
          </main>

          <PersonDetailsPanel
            onEdit={setEditPersonId}
            onChangeShepherd={setChangeShepherdPersonId}
            onAddUnder={openAddPerson}
            onReplace={setReplacePersonId}
            onDelete={setDeletePersonId}
          />
        </div>
      )}

      <AddPersonDialog open={addPersonOpen} onOpenChange={setAddPersonOpen} defaultShepherdId={addPersonDefaultShepherd} />
      <EditPersonDialog open={editPersonId !== null} onOpenChange={(o) => !o && setEditPersonId(null)} personId={editPersonId} />
      <ChangeShepherdDialog
        open={changeShepherdPersonId !== null}
        onOpenChange={(o) => !o && setChangeShepherdPersonId(null)}
        personId={changeShepherdPersonId}
      />
      <ReplacePersonDialog
        open={replacePersonId !== null}
        onOpenChange={(o) => !o && setReplacePersonId(null)}
        personId={replacePersonId}
      />
      <DeletePersonDialog
        open={deletePersonId !== null}
        onOpenChange={(o) => !o && setDeletePersonId(null)}
        personId={deletePersonId}
      />
      <ImportExportDialog open={importExportOpen} onOpenChange={setImportExportOpen} />
    </div>
  );
}
