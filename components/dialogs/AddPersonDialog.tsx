"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { PersonForm } from "@/components/people/PersonForm";
import { ShepherdPicker } from "@/components/people/ShepherdPicker";
import { useTreeStore } from "@/store/useTreeStore";
import { useUIStore } from "@/store/useUIStore";
import type { PersonFormValues } from "@/lib/validation/personSchema";

export function AddPersonDialog({
  open,
  onOpenChange,
  defaultShepherdId = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultShepherdId?: string | null;
}) {
  const people = useTreeStore((s) => s.people);
  const addPerson = useTreeStore((s) => s.addPerson);
  const selectPerson = useUIStore((s) => s.selectPerson);
  const expandIds = useUIStore((s) => s.expandIds);
  const [shepherdId, setShepherdId] = useState<string | null>(defaultShepherdId);

  // Reset the shepherd selection each time the dialog opens — computed during
  // render (not an effect) per React's "adjusting state when a prop changes"
  // pattern, so it's correct for the very first paint.
  const [lastOpenAt, setLastOpenAt] = useState(false);
  if (open !== lastOpenAt) {
    setLastOpenAt(open);
    if (open) setShepherdId(defaultShepherdId);
  }

  const candidates = Object.values(people)
    .map((p) => ({ id: p.id, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Add Person" description="Add a new person to the shepherd tree.">
        <PersonForm
          submitLabel="Add Person"
          onCancel={() => onOpenChange(false)}
          onSubmit={(values: PersonFormValues) => {
            const id = addPerson(values, shepherdId);
            if (shepherdId) expandIds([shepherdId]);
            toast.success(`${values.name} has been added${shepherdId ? "" : " as a root leader"}.`);
            onOpenChange(false);
            selectPerson(id);
          }}
        >
          <ShepherdPicker value={shepherdId} onChange={setShepherdId} candidates={candidates} />
        </PersonForm>
      </DialogContent>
    </Dialog>
  );
}
