"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ShepherdPicker } from "@/components/people/ShepherdPicker";
import { useTreeStore } from "@/store/useTreeStore";
import { useUIStore } from "@/store/useUIStore";
import { useTraversalIndex } from "@/lib/graph/useTraversalIndex";
import { getDescendants } from "@/lib/graph/traversal";

export function ChangeShepherdDialog({
  open,
  onOpenChange,
  personId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personId: string | null;
}) {
  const people = useTreeStore((s) => s.people);
  const changeShepherd = useTreeStore((s) => s.changeShepherd);
  const expandAncestors = useUIStore((s) => s.expandAncestors);
  const index = useTraversalIndex();
  const [shepherdId, setShepherdId] = useState<string | null>(null);

  const person = personId ? people[personId] : undefined;
  const currentShepherdId = personId ? index.shepherdByMember.get(personId) ?? null : null;

  const candidates = useMemo(() => {
    if (!personId) return [];
    const invalid = new Set([personId, ...getDescendants(personId, index.childrenByShepherd)]);
    return Object.values(people)
      .filter((p) => !invalid.has(p.id))
      .map((p) => ({ id: p.id, name: p.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [personId, people, index]);

  // Reset the selection to the current shepherd whenever the dialog (re)opens
  // for a person — computed during render (not an effect) per React's
  // "adjusting state when a prop changes" pattern, so it's ready for the
  // very first paint instead of flashing the previous value.
  const openKey = open ? personId : null;
  const [lastOpenKey, setLastOpenKey] = useState<string | null>(null);
  if (openKey !== lastOpenKey) {
    setLastOpenKey(openKey);
    if (openKey) setShepherdId(currentShepherdId);
  }

  if (!person) return null;

  function handleSave() {
    if (!personId) return;
    const result = changeShepherd(personId, shepherdId);
    if (!result.ok) {
      if (result.code === "WOULD_CREATE_CYCLE") {
        toast.error("That would create a circular shepherding chain — pick someone outside this branch.");
      } else {
        toast.error("Couldn't change shepherd.");
      }
      return;
    }
    if (shepherdId) expandAncestors([shepherdId]);
    const shepherdName = shepherdId ? people[shepherdId]?.name : "no one (root)";
    toast.success(`${person!.name} is now shepherded by ${shepherdName}.`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Change Shepherd"
        description={`Move ${person.name} to a different shepherd. Anyone currently under ${person.name} stays under them.`}
      >
        <ShepherdPicker value={shepherdId} onChange={setShepherdId} candidates={candidates} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={shepherdId === currentShepherdId}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
