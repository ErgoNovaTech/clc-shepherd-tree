"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ShepherdPicker } from "@/components/people/ShepherdPicker";
import { useTreeStore } from "@/store/useTreeStore";

export function SetShadowShepherdDialog({
  open,
  onOpenChange,
  personId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personId: string | null;
}) {
  const people = useTreeStore((s) => s.people);
  const updatePerson = useTreeStore((s) => s.updatePerson);
  const [shadowShepherdId, setShadowShepherdId] = useState<string | null>(null);

  const person = personId ? people[personId] : undefined;
  const currentShadowShepherdId = person?.shadowShepherdId ?? null;

  const candidates = useMemo(() => {
    if (!personId) return [];
    return Object.values(people)
      .filter((p) => p.id !== personId)
      .map((p) => ({ id: p.id, name: p.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [personId, people]);

  // Reset the selection to the current shadow shepherd whenever the dialog
  // (re)opens for a person — computed during render (not an effect) per
  // React's "adjusting state when a prop changes" pattern, so it's ready for
  // the very first paint instead of flashing the previous value.
  const openKey = open ? personId : null;
  const [lastOpenKey, setLastOpenKey] = useState<string | null>(null);
  if (openKey !== lastOpenKey) {
    setLastOpenKey(openKey);
    if (openKey) setShadowShepherdId(currentShadowShepherdId);
  }

  if (!person) return null;

  function handleSave() {
    if (!personId) return;
    updatePerson(personId, { shadowShepherdId: shadowShepherdId ?? undefined });
    const name = shadowShepherdId ? people[shadowShepherdId]?.name : "no one";
    toast.success(`${person!.name}'s shadow shepherd is now ${name}.`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Set Shadow Shepherd"
        description={`Assign an additional overseer for ${person.name}, separate from their regular shepherd.`}
      >
        <ShepherdPicker
          label="Shadow Shepherd"
          value={shadowShepherdId}
          onChange={setShadowShepherdId}
          candidates={candidates}
          noneLabel="No Shadow Shepherd"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={shadowShepherdId === currentShadowShepherdId}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
