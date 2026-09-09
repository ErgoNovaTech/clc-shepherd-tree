"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personInputSchema, type PersonFormValues } from "@/lib/validation/personSchema";
import { resizeImageFile } from "@/lib/utils/image";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { DialogFooter } from "@/components/ui/Dialog";
import { PersonAvatar } from "@/components/people/PersonAvatar";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "transferred", label: "Transferred" },
];

export function PersonForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  children,
}: {
  defaultValues?: Partial<PersonFormValues>;
  onSubmit: (values: PersonFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
  /** Extra fields rendered above the form (e.g. a shepherd picker on Add). */
  children?: React.ReactNode;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(personInputSchema),
    defaultValues: { status: "active", ...defaultValues },
  });

  const photo = watch("photo");
  const name = watch("name") || "New person";
  const status = watch("status");

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await resizeImageFile(file);
      setValue("photo", dataUrl, { shouldDirty: true });
    } catch {
      toast.error("Couldn't process that image");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {children}

      <div className="flex items-center gap-4">
        <PersonAvatar name={name} photo={photo} size="lg" />
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? "Processing..." : photo ? "Change photo" : "Upload photo"}
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          {photo && (
            <button
              type="button"
              className="ml-2 text-xs text-slate-500 hover:text-slate-700"
              onClick={() => setValue("photo", undefined, { shouldDirty: true })}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="name">Full Name *</Label>
        <Input id="name" {...register("name")} placeholder="e.g. John Mensah" />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="role">Role / Title</Label>
          <Input id="role" {...register("role")} placeholder="e.g. Shepherd" />
        </div>
        <div>
          <Label>Status</Label>
          <Select
            value={status ?? "active"}
            onValueChange={(v) => setValue("status", v as PersonFormValues["status"])}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} placeholder="024xxxxxxx" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} placeholder="name@example.com" />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="location">Location / Branch</Label>
        <Input id="location" {...register("location")} placeholder="e.g. Oyibi" />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register("notes")} placeholder="Optional notes" />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
