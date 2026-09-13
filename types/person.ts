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
  /** An additional overseer, explicitly assigned — independent of the regular
   *  shepherd hierarchy (set via "Set Shadow Shepherd", not the person form). */
  shadowShepherdId?: string;
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
