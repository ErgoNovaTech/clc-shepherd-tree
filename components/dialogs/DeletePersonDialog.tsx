"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import { RadioGroup, RadioOption } from "@/components/ui/RadioGroup";
import { ShepherdPicker } from "@/components/people/ShepherdPicker";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { useTreeStore } from "@/store/useTreeStore";
import { useUIStore } from "@/store/useUIStore";
import { useTraversalIndex } from "@/lib/graph/useTraversalIndex";
import { countDescendants } from "@/lib/graph/traversal";
import type { DeleteStrategy } from "@/types/graph";

export function DeletePersonDialog({
  open,
  onOpenChange,
  personId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personId: string | null;
}) {
  const people = useTreeStore((s) => s.people);
  const deletePerson = useTreeStore((s) => s.deletePerson);
  const selectPerson = useUIStore((s) => s.selectPerson);
  const index = useTraversalIndex();

  const [strategy, setStrategy] = useState<DeleteStrategy>("to-own-shepherd");
  const [chosenShepherdId, setChosenShepherdId] = useState<string | null>(null);
  const [perPersonAssignments, setPerPersonAssignments] = useState<Record<string, string | null>>({});
  const [confirmBranchDeleteOpen, setConfirmBranchDeleteOpen] = useState(false);

  const person = personId ? people[personId] : undefined;
  const children = useMemo(
    () => (personId ? index.childrenByShepherd.get(personId) ?? [] : []),
    [personId, index]
  );
  const ownShepherdId = personId ? index.shepherdByMember.get(personId) ?? null : null;
  const ownShepherdName = ownShepherdId ? people[ownShepherdId]?.name : "no one (they become roots)";

  const candidates = useMemo(
    () =>
      Object.values(people)
        .filter((p) => p.id !== personId && !children.includes(p.id))
        .map((p) => ({ id: p.id, name: p.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [people, personId, children]
  );

  if (!person) return null;

  function reset() {
    setStrategy("to-own-shepherd");
    setChosenShepherdId(null);
    setPerPersonAssignments({});
  }

  function performDelete() {
    if (!personId) return;
    deletePerson(personId, strategy, { chosenShepherdId, perPersonAssignments });
    const descendantCount = countDescendants(personId, index.childrenByShepherd);
    if (strategy === "delete-branch") {
      toast.success(`${person!.name} and ${descendantCount} ${descendantCount === 1 ? "person" : "people"} under them have been deleted.`);
    } else {
      toast.success(`${person!.name} has been deleted.`);
    }
    selectPerson(null);
    onOpenChange(false);
    reset();
  }

  function handleConfirm() {
    if (strategy === "delete-branch") {
      setConfirmBranchDeleteOpen(true);
      return;
    }
    if (strategy === "to-chosen-shepherd" && !chosenShepherdId) {
      toast.error("Choose a shepherd to receive these people.");
      return;
    }
    performDelete();
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) reset();
          onOpenChange(next);
        }}
      >
        <DialogContent
          title="Delete Person"
          description={
            children.length > 0
              ? `${person.name} currently shepherds ${children.length} ${children.length === 1 ? "person" : "people"}. What should happen to them?`
              : `Delete ${person.name}? This can be undone with Ctrl+Z.`
          }
        >
          {children.length > 0 && (
            <div className="space-y-4">
              <RadioGroup value={strategy} onValueChange={(v) => setStrategy(v as DeleteStrategy)} className="space-y-3">
                <RadioOption
                  id="del-own"
                  value="to-own-shepherd"
                  label={`Transfer everyone to ${ownShepherdName}`}
                  description={`${person.name}'s own shepherd`}
                />
                <RadioOption id="del-chosen" value="to-chosen-shepherd" label="Transfer everyone to another shepherd" />
                <RadioOption id="del-per" value="per-person" label="Choose a different shepherd for each person" />
                <RadioOption
                  id="del-branch"
                  value="delete-branch"
                  label="Delete the entire branch"
                  description="Removes everyone under them too — cannot be undone casually."
                />
              </RadioGroup>

              {strategy === "to-chosen-shepherd" && (
                <ShepherdPicker
                  label="New shepherd"
                  value={chosenShepherdId}
                  onChange={setChosenShepherdId}
                  candidates={candidates}
                  allowNone={false}
                />
              )}

              {strategy === "per-person" && (
                <div className="space-y-2">
                  <Label>Assign each person</Label>
                  {children.map((childId) => (
                    <div key={childId} className="flex items-center gap-2">
                      <span className="w-32 shrink-0 truncate text-sm text-slate-700">
                        {people[childId]?.name}
                      </span>
                      <div className="flex-1">
                        <ShepherdPicker
                          label=""
                          value={perPersonAssignments[childId] ?? null}
                          onChange={(v) =>
                            setPerPersonAssignments((prev) => ({ ...prev, [childId]: v }))
                          }
                          candidates={candidates}
                          noneLabel="Unassigned"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Delete Person
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmBranchDeleteOpen}
        onOpenChange={setConfirmBranchDeleteOpen}
        title="Delete entire branch?"
        description={`This permanently deletes ${person.name} and everyone under them (${countDescendants(person.id, index.childrenByShepherd)} people). This cannot be undone once you leave this session.`}
        destructive
        confirmLabel="Delete Branch"
        requireTypedConfirmation="DELETE"
        onConfirm={performDelete}
      />
    </>
  );
}
