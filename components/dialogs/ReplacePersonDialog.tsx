"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { RadioGroup, RadioOption } from "@/components/ui/RadioGroup";
import { ShepherdPicker } from "@/components/people/ShepherdPicker";
import { useTreeStore } from "@/store/useTreeStore";
import { useTraversalIndex } from "@/lib/graph/useTraversalIndex";
import type { ReplaceStrategy } from "@/types/graph";

export function ReplacePersonDialog({
  open,
  onOpenChange,
  personId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personId: string | null;
}) {
  const people = useTreeStore((s) => s.people);
  const replacePerson = useTreeStore((s) => s.replacePerson);
  const index = useTraversalIndex();

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [existingId, setExistingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [strategy, setStrategy] = useState<ReplaceStrategy>("transfer-all");
  const [deleteOriginalIfEmpty, setDeleteOriginalIfEmpty] = useState(true);

  const original = personId ? people[personId] : undefined;
  const children = personId ? index.childrenByShepherd.get(personId) ?? [] : [];

  const candidates = useMemo(
    () =>
      Object.values(people)
        .filter((p) => p.id !== personId)
        .map((p) => ({ id: p.id, name: p.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [people, personId]
  );

  if (!original) return null;

  function reset() {
    setMode("existing");
    setExistingId(null);
    setNewName("");
    setNewRole("");
    setStrategy("transfer-all");
    setDeleteOriginalIfEmpty(true);
  }

  function handleReplace() {
    if (!personId) return;
    if (mode === "existing" && !existingId) {
      toast.error("Choose who is replacing this person.");
      return;
    }
    if (mode === "new" && !newName.trim()) {
      toast.error("Enter a name for the replacement.");
      return;
    }

    const result = replacePerson({
      originalId: personId,
      replacement:
        mode === "existing"
          ? { type: "existing", personId: existingId! }
          : { type: "new", input: { name: newName.trim(), role: newRole.trim() || undefined } },
      strategy,
      deleteOriginalIfEmpty,
    });

    if (!result.ok) {
      toast.error(
        result.code === "WOULD_CREATE_CYCLE"
          ? "That replacement would create a circular shepherding chain."
          : "Couldn't replace this person."
      );
      return;
    }

    const replacementName = mode === "existing" ? people[existingId!]?.name : newName.trim();
    toast.success(`${original!.name} has been replaced by ${replacementName}.`);
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        title="Replace Person"
        description={`${original.name} currently shepherds ${children.length} ${children.length === 1 ? "person" : "people"}.`}
      >
        <div className="space-y-4">
          <div>
            <Label>Replace with</Label>
            <div className="mb-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={mode === "existing" ? "primary" : "outline"}
                onClick={() => setMode("existing")}
              >
                Existing person
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "new" ? "primary" : "outline"}
                onClick={() => setMode("new")}
              >
                New person
              </Button>
            </div>
            {mode === "existing" ? (
              <ShepherdPicker
                label=""
                value={existingId}
                onChange={setExistingId}
                candidates={candidates}
                allowNone={false}
                noneLabel="Select a person"
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <Input placeholder="Role (optional)" value={newRole} onChange={(e) => setNewRole(e.target.value)} />
              </div>
            )}
          </div>

          {children.length > 0 && (
            <div>
              <Label>What should happen to {original.name}&apos;s people?</Label>
              <RadioGroup
                value={strategy}
                onValueChange={(v) => setStrategy(v as ReplaceStrategy)}
                className="space-y-2"
              >
                <RadioOption
                  id="strategy-transfer"
                  value="transfer-all"
                  label="Transfer everyone to the replacement"
                  description="Recommended — preserves the existing structure under the new shepherd."
                />
                <RadioOption
                  id="strategy-keep"
                  value="keep-under-original"
                  label={`Keep ${original.name}'s people under ${original.name}`}
                />
              </RadioGroup>
            </div>
          )}

          {strategy === "transfer-all" && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={deleteOriginalIfEmpty}
                onChange={(e) => setDeleteOriginalIfEmpty(e.target.checked)}
              />
              Remove {original.name} since they no longer shepherd anyone
            </label>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleReplace}>Replace Person</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
