import { z } from "zod";

export const personStatusSchema = z.enum(["active", "inactive", "transferred"]);

export const personInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  photo: z.string().optional(),
  role: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  location: z.string().trim().optional(),
  status: personStatusSchema.optional(),
  notes: z.string().trim().optional(),
});

export const personSchema = personInputSchema.extend({
  id: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const shepherdRelationshipSchema = z.object({
  id: z.string().min(1),
  shepherdId: z.string().min(1),
  memberId: z.string().min(1),
  createdAt: z.string(),
});

export const treeSnapshotSchema = z.object({
  people: z.array(personSchema),
  relationships: z.array(shepherdRelationshipSchema),
});

export const treeDataSchema = treeSnapshotSchema.extend({
  version: z.literal(1),
});

export type PersonFormValues = z.infer<typeof personInputSchema>;
