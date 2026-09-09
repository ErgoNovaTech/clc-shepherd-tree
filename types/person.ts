export type PersonStatus = "active" | "inactive" | "transferred";

export type Person = {
  id: string;
  name: string;
  photo?: string;
  role?: string;
  phone?: string;
  email?: string;
  location?: string;
  status?: PersonStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type PersonInput = {
  name: string;
  photo?: string;
  role?: string;
  phone?: string;
  email?: string;
  location?: string;
  status?: PersonStatus;
  notes?: string;
};
