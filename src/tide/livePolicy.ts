/**
 * Dual-control policy for LIVE mode (real TideCloak session).
 *
 * WHAT IS REAL HERE
 *  - Identity: `sub` / `preferred_username` come from the TideCloak-issued token (Tide threshold login;
 *    no admin or server holds the users' credentials).
 *  - Authority: the `expense-approver` realm role is read from the TideCloak token. With TideCloak
 *    Quorum-Enforced Governance (IGA) enabled, granting that role is a change request that needs the
 *    admin quorum to approve before it is committed, so one admin cannot promote themself.
 *
 * WHAT IS NOT (YET) ENFORCED BY TIDE
 *  - The 2-distinct-approver check below runs in this browser app. In production it must run in a
 *    backend that verifies each approver's JWT (e.g. `@tidecloak/verify`), or ideally as a Forseti
 *    contract on the ORK network (`policy-governed-signing` scenario). Custom Forseti contracts are
 *    deployed by the Tide team only, so that step is out of scope for this hackathon prototype.
 *  - The payment rail is mocked; shared state is kept in localStorage (single-browser demo).
 */

export const APPROVER_ROLE = 'expense-approver'
export const REQUESTER_ROLE = 'expense-requester'
export const REQUIRED_APPROVALS = 2

export interface LiveIdentity {
  sub: string
  username: string
  isApprover: boolean
  isRequester: boolean
  isRealmAdmin: boolean
}

export interface LiveApproval {
  sub: string
  username: string
  at: string
  /** SHA-256 of the TideCloak access token presented with this approval (evidence reference). */
  tokenDigest: string
}

export interface LiveExpense {
  id: string
  title: string
  vendor: string
  amount: number
  currency: string
  requesterSub: string
  requesterName: string
  createdAt: string
  approvals: LiveApproval[]
  releasedAt?: string
}

export interface LiveEvent {
  at: string
  kind: 'info' | 'ok' | 'blocked'
  who: string
  text: string
}

export type Decision = { ok: true } | { ok: false; code: string; reason: string }

export function canApprove(id: LiveIdentity, exp: LiveExpense): Decision {
  if (exp.releasedAt) return { ok: false, code: 'ALREADY_RELEASED', reason: 'Funds were already released.' }
  if (!id.isApprover)
    return {
      ok: false,
      code: 'MISSING_TIDECLOAK_ROLE',
      reason: `Your TideCloak token has no "${APPROVER_ROLE}" role. Being an admin does not help: granting it to yourself creates a TideCloak change request that the admin quorum must approve.`,
    }
  if (id.sub === exp.requesterSub)
    return { ok: false, code: 'SELF_APPROVAL', reason: 'The requester cannot approve their own expense.' }
  if (exp.approvals.some((a) => a.sub === id.sub))
    return {
      ok: false,
      code: 'DUPLICATE_IDENTITY',
      reason: 'This TideCloak identity already approved. A second approval must come from a different identity.',
    }
  return { ok: true }
}

/** "SysAdmin force release": always refused unless 2 distinct, token-proven approvals exist. */
export function canForceRelease(exp: LiveExpense): Decision {
  const distinct = new Set(exp.approvals.map((a) => a.sub)).size
  if (distinct >= REQUIRED_APPROVALS) return { ok: true }
  return {
    ok: false,
    code: 'UNILATERAL_OVERRIDE_BLOCKED',
    reason: `There is no "approved" flag for an admin to flip. Release needs ${REQUIRED_APPROVALS} distinct TideCloak identities holding "${APPROVER_ROLE}" (have ${distinct}). An admin cannot invent that role or impersonate approvers: role grants need quorum approval and Tide logins have no admin-held password.`,
  }
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const KEY = 'dcd-live-state-v1'

export interface LiveState {
  expense: LiveExpense | null
  events: LiveEvent[]
}

export function loadState(): LiveState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return { expense: null, events: [] }
}

export function saveState(s: LiveState) {
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function clearState() {
  localStorage.removeItem(KEY)
}

