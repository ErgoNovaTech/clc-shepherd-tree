import { LocalTreeRepository } from "./LocalTreeRepository";
import type { TreeRepository } from "./TreeRepository";

export const treeRepository: TreeRepository = new LocalTreeRepository();

export type { TreeRepository, TreeSnapshot } from "./TreeRepository";
