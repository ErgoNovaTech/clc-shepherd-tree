import { RemoteTreeRepository } from "./RemoteTreeRepository";
import type { TreeRepository } from "./TreeRepository";

// Backed by MongoDB Atlas via app/api/tree — see lib/mongodb.ts. Swap back to
// `new LocalTreeRepository()` (idb-keyval, browser-only) if you ever want to
// run without a shared database.
export const treeRepository: TreeRepository = new RemoteTreeRepository();

export type { TreeRepository, TreeSnapshot } from "./TreeRepository";
