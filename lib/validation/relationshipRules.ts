export type AddRelationshipError =
  | { ok: false; code: "SELF_LOOP" }
  | { ok: false; code: "ALREADY_HAS_SHEPHERD"; existingShepherdId: string }
  | { ok: false; code: "WOULD_CREATE_CYCLE" };

export type AddRelationshipResult = { ok: true } | AddRelationshipError;

/**
 * Walks up from shepherdId; if memberId appears in that ancestor chain, connecting
 * shepherdId -> memberId would close a loop. Also rejects a direct self-loop.
 */
export function wouldCreateCycle(
  shepherdId: string,
  memberId: string,
  shepherdByMember: Map<string, string>
): boolean {
  if (shepherdId === memberId) return true;

  const seen = new Set<string>([shepherdId]);
  let cur = shepherdByMember.get(shepherdId);
  while (cur) {
    if (cur === memberId || seen.has(cur)) return true;
    seen.add(cur);
    cur = shepherdByMember.get(cur);
  }
  return false;
}

/**
 * Validates a proposed shepherdId -> memberId relationship.
 * Pass replaceExisting: true when the caller (e.g. an explicit "Change Shepherd"
 * dialog) has already confirmed intent to move memberId away from their current
 * shepherd; otherwise a second shepherd is rejected rather than silently added.
 */
export function validateAddRelationship(
  shepherdId: string,
  memberId: string,
  shepherdByMember: Map<string, string>,
  opts?: { replaceExisting?: boolean }
): AddRelationshipResult {
  if (shepherdId === memberId) {
    return { ok: false, code: "SELF_LOOP" };
  }

  const existingShepherdId = shepherdByMember.get(memberId);
  if (existingShepherdId && existingShepherdId !== shepherdId && !opts?.replaceExisting) {
    return { ok: false, code: "ALREADY_HAS_SHEPHERD", existingShepherdId };
  }

  if (wouldCreateCycle(shepherdId, memberId, shepherdByMember)) {
    return { ok: false, code: "WOULD_CREATE_CYCLE" };
  }

  return { ok: true };
}
