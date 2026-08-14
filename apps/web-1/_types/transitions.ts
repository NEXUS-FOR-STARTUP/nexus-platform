/**
 * Shared actor-aware transition gate (D14).
 *
 * Maps each XState transition name to the role(s) allowed to fire it plus the
 * actor relationship required. The backend machine guards are owner-only for
 * customer transitions (D18), so every customer transition is gated as
 * "owner" here to stay consistent with the shipped backend.
 */

export type TransitionActor =
  | "owner"
  | "ownerOrMember"
  | "assignedSupporter"
  | "none";

export interface TransitionActorRule {
  roles: string[];
  actor: TransitionActor;
}

export const TRANSITION_ACTOR_RULES: Record<string, TransitionActorRule> = {
  T2_SUBMIT_INTAKE: { roles: ["CUSTOMER"], actor: "owner" },
  T3_RESUBMIT_AFTER_REJECT: { roles: ["CUSTOMER"], actor: "owner" },
  T4_RESUBMIT_AFTER_VETO: { roles: ["CUSTOMER"], actor: "owner" },
  T5_ACCEPT: { roles: ["ADMIN"], actor: "none" },
  T6_ASSIGN_SUPPORTER: { roles: ["ADMIN"], actor: "none" },
  T7_START_WORK: { roles: ["SUPPORTER"], actor: "assignedSupporter" },
  T8_REQUEST_INFO: { roles: ["SUPPORTER"], actor: "assignedSupporter" },
  T9_SUBMIT_REVISION: { roles: ["CUSTOMER"], actor: "owner" },
  T10_START_REVIEW_REVISION: { roles: ["SUPPORTER"], actor: "assignedSupporter" },
  T11_SUBMIT_OUTPUT: { roles: ["SUPPORTER"], actor: "assignedSupporter" },
  T12_REJECT: { roles: ["ADMIN"], actor: "none" },
  T13_VETO: { roles: ["ADMIN"], actor: "none" },
  T14_COMPLETE: { roles: ["SUPPORTER"], actor: "assignedSupporter" },
  T15_CANCEL: { roles: ["CUSTOMER"], actor: "owner" },
  T16_EDIT_INTAKE: { roles: ["CUSTOMER"], actor: "owner" },
};

export interface TransitionActorContext {
  role: string;
  isOwner: boolean;
  isAssignedSupporter: boolean;
}

/** Normalize a FE role string ("user" | "admin" | "supporter") to the canonical uppercase role. */
function normalizeRole(role: string): string {
  const r = role.trim().toLowerCase();
  if (r === "user" || r === "customer") return "CUSTOMER";
  return r.toUpperCase();
}

/** Return the subset of `transitions` this actor is allowed to fire. */
export function filterTransitions(
  transitions: string[],
  ctx: TransitionActorContext,
): string[] {
  const { role, isOwner, isAssignedSupporter } = ctx;
  const normalizedRole = normalizeRole(role);

  return transitions.filter((t) => {
    const rule = TRANSITION_ACTOR_RULES[t];
    if (!rule) return false;
    if (!rule.roles.includes(normalizedRole)) return false;

    switch (rule.actor) {
      case "owner":
      case "ownerOrMember": // D18: owner-only — member === owner semantics
        return isOwner;
      case "assignedSupporter":
        return isAssignedSupporter;
      case "none":
        return true;
    }
  });
}
