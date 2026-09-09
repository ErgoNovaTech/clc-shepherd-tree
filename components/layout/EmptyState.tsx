"use client";

import { Button } from "@/components/ui/Button";
import { GitBranch } from "lucide-react";

export function EmptyState({
  onAddFirstPerson,
  onLoadDemoData,
  onImportBackup,
}: {
  onAddFirstPerson: () => void;
  onLoadDemoData: () => void;
  onImportBackup: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-full bg-slate-100 p-4">
        <GitBranch className="h-8 w-8 text-slate-400" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Welcome to Shepherd Tree</h1>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Build and manage your church&apos;s shepherding structure — no account needed. Everything is saved
          right here in your browser.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={onAddFirstPerson}>Add First Person</Button>
        <Button variant="outline" onClick={onLoadDemoData}>
          Load Demo Data
        </Button>
      </div>
      <button className="text-sm text-slate-500 underline hover:text-slate-700" onClick={onImportBackup}>
        Restore from a backup file instead
      </button>
    </div>
  );
}
