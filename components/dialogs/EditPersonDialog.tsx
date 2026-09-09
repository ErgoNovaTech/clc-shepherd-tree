"use client";

import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { PersonForm } from "@/components/people/PersonForm";
import { useTreeStore } from "@/store/useTreeStore";
import type { PersonFormValues } from "@/lib/validation/personSchema";

export function EditPersonDialog({
  open,
  onOpenChange,
  personId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personId: string | null;
}) {
  const person = useTreeStore((s) => (personId ? s.people[personId] : undefined));
  const updatePerson = useTreeStore((s) => s.updatePerson);

  if (!person) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Edit Person" description={`Update ${person.name}'s details.`}>
        <PersonForm
          submitLabel="Save Changes"
          onCancel={() => onOpenChange(false)}
          defaultValues={{
            name: person.name,
            photo: person.photo,
            role: person.role,
            phone: person.phone,
            email: person.email,
            location: person.location,
            status: person.status ?? "active",
            notes: person.notes,
          }}
          onSubmit={(values: PersonFormValues) => {
            updatePerson(person.id, values);
            toast.success(`${values.name}'s details have been updated.`);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
