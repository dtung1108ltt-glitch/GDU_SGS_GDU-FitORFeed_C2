import { useEffect, useState } from 'react'
import { useTideCloak, useAuthCallback, Authenticated, Unauthenticated } from '@tidecloak/react'
import {
  APPROVER_ROLE,
  REQUESTER_ROLE,
  REQUIRED_APPROVALS,
  canApprove,
  canForceRelease,
  clearState,
  loadState,
  saveState,
  sha256Hex,
  type LiveEvent,
  type LiveExpense,
  type LiveIdentity,
  type LiveState,
} from './livePolicy'

/** Root for LIVE mode. Callback + init handling follows the official Tide React/Vite template. */
export function LiveRoot() {
  const { isInitializing, initError } = useTideCloak()
  const { isCallback, isProcessing, error: callbackError } = useAuthCallback({
    onSuccess: (returnUrl) => window.location.assign(returnUrl || '/'),
    onError: () => window.location.assign('/'),
    onMissingVerifierRedirectTo: '/',
  })

  if (isCallback) {
    if (callbackError) return <Center>Authentication failed: {callbackError.message}</Center>
    return <Center>{isProcessing ? 'Completing TideCloak login…' : 'Redirecting…'}</Center>
  }
  if (initError) return <Center>TideCloak init error: {initError.message}</Center>
  if (isInitializing) return <Center>Initializing TideCloak…</Center>

  return (
    <>
      <Authenticated>
        <LiveDesk />
      </Authenticated>
      <Unauthenticated>
        <LoginPage />
      </Unauthenticated>
    </>
  )
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200 p-6 text-center">
      <div>{children}</div>
    </div>
  )
}

function LoginPage() {
  const { login } = useTideCloak()
  return (
    <Center>
      <div className="max-w-md space-y-4">
        <div className="text-xs font-mono text-emerald-400">LIVE MODE · TideCloak connected</div>
        <h1 className="text-2xl font-bold text-white">Dual-Control Expense Desk</h1>
        <p className="text-slate-400 text-sm">
          Sign in with your Tide identity. Your role ({REQUESTER_ROLE} / {APPROVER_ROLE}) comes from TideCloak, not
          from this app's database.
        </p>
        <button onClick={login} className="px-5 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold">
          Login with Tide
        </button>
        <p className="text-xs text-slate-500">
          <a className="underline" href="/?mode=simulation">
            Open the offline simulation instead
          </a>
        </p>
      </div>
    </Center>
  )
}

function safe(fn: () => boolean) {
  try {
    return fn()
  } catch {
    return false
  }
}

function LiveDesk() {
  const tc = useTideCloak()
  const [state, setState] = useState<LiveState>(loadState)
  const [notice, setNotice] = useState<{ ok: boolean; title: string; text: string } | null>(null)

  const identity: LiveIdentity = {
    sub: String(tc.getValueFromIdToken('sub') ?? tc.getValueFromToken('sub') ?? 'unknown'),
    username: String(
      tc.getValueFromIdToken('preferred_username') ?? tc.getValueFromToken('preferred_username') ?? 'unknown',
    ),
    isApprover: safe(() => tc.hasRealmRole(APPROVER_ROLE)),
    isRequester: safe(() => tc.hasRealmRole(REQUESTER_ROLE)),
    isRealmAdmin:
      safe(() => tc.hasClientRole('tide-realm-admin', 'realm-management')) ||
      safe(() => tc.hasRealmRole('tide-realm-admin')),
  }

  // Keep tabs in sync (approver B can use a second tab / after re-login).
  useEffect(() => {
    const onStorage = () => setState(loadState())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const commit = (next: LiveState) => {
    saveState(next)
    setState(next)
  }
  const log = (s: LiveState, kind: LiveEvent['kind'], text: string): LiveState => ({
    ...s,
    events: [{ at: new Date().toISOString(), kind, who: identity.username, text }, ...s.events].slice(0, 40),
  })

  const exp = state.expense

  const submit = () => {
    if (!identity.isRequester && !identity.isApprover) {
      setNotice({ ok: false, title: 'Blocked', text: `Your TideCloak token has no "${REQUESTER_ROLE}" role.` })
      return
    }
    const e: LiveExpense = {
      id: `EXP-${Date.now().toString().slice(-5)}`,
      title: 'Sovereign compute contract (mock payment)',
      vendor: 'CloudScale Sovereign Compute Ltd.',
      amount: 48500,
      currency: 'USDC',
      requesterSub: identity.sub,
      requesterName: identity.username,
      createdAt: new Date().toISOString(),
      approvals: [],
    }
    commit(log({ ...state, expense: e }, 'info', `Step 1 · submitted ${e.id} ($48,500). 0/${REQUIRED_APPROVALS} approvals.`))
    setNotice(null)
  }

  const approve = async () => {
    if (!exp) return
    const d = canApprove(identity, exp)
    if (!d.ok) {
      commit(log(state, 'blocked', `${d.code}: ${d.reason}`))
      setNotice({ ok: false, title: d.code, text: d.reason })
      return
    }
    const token = (await tc.getToken()) ?? ''
    const approvals = [
      ...exp.approvals,
      { sub: identity.sub, username: identity.username, at: new Date().toISOString(), tokenDigest: await sha256Hex(token) },
    ]
    const released = approvals.length >= REQUIRED_APPROVALS
    const next: LiveExpense = { ...exp, approvals, releasedAt: released ? new Date().toISOString() : undefined }
    commit(
      log(
        { ...state, expense: next },
        'ok',
        released
          ? `Step 4 · approval ${approvals.length}/${REQUIRED_APPROVALS} from a 2nd distinct identity → mock payment RELEASED.`
          : `Step 2 · approval ${approvals.length}/${REQUIRED_APPROVALS}. Funds stay locked.`,
      ),
    )
    setNotice({
      ok: true,
      title: released ? 'Released (2/2)' : `Approved (${approvals.length}/2)`,
      text: released ? 'Two distinct TideCloak identities approved.' : 'Waiting for a second, different approver.',
    })
  }

  const forceRelease = () => {
    if (!exp) return
    const d = canForceRelease(exp)
    if (!d.ok) {
      commit(log(state, 'blocked', `${d.code}: ${d.reason}`))
      setNotice({ ok: false, title: d.code, text: d.reason })
    }
  }

  const reset = () => {
    clearState()
    setState(loadState())
    setNotice(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-mono text-emerald-400">LIVE MODE · real TideCloak session</div>
            <h1 className="text-2xl font-bold text-white">Dual-Control Expense Desk</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={reset} className="px-3 py-1.5 rounded bg-slate-800 text-sm">Reset demo</button>
            <a href="/?mode=simulation" className="px-3 py-1.5 rounded bg-slate-800 text-sm">Simulation</a>
            <button onClick={tc.logout} className="px-3 py-1.5 rounded bg-amber-500 text-slate-950 text-sm font-semibold">
              Log out / switch identity
            </button>
          </div>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm grid sm:grid-cols-2 gap-2">
          <div>Signed in as <b className="text-white">{identity.username}</b></div>
          <div className="font-mono text-xs text-slate-400 break-all">sub: {identity.sub}</div>
          <div>
            Roles from TideCloak token:{' '}
            <Badge on={identity.isRequester}>{REQUESTER_ROLE}</Badge> <Badge on={identity.isApprover}>{APPROVER_ROLE}</Badge>{' '}
            <Badge on={identity.isRealmAdmin}>tide-realm-admin</Badge>
          </div>
          <div className="text-xs text-slate-400">
            Admins can't give themselves {APPROVER_ROLE}: with Quorum-Enforced Governance on, the grant waits as a
            change request until the admin quorum approves it.
          </div>
        </section>

        {notice && (
          <div className={`rounded-xl p-4 border ${notice.ok ? 'border-emerald-600 bg-emerald-950/40' : 'border-red-600 bg-red-950/40'}`}>
            <div className="font-bold">{notice.ok ? '✅' : '⛔'} {notice.title}</div>
            <div className="text-sm text-slate-300">{notice.text}</div>
          </div>
        )}

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
          {!exp ? (
            <button onClick={submit} className="px-4 py-2 rounded bg-sky-500 text-slate-950 font-semibold">
              Step 1 · Submit $48,500 expense
            </button>
          ) : (
            <>
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <div className="font-semibold text-white">{exp.id} · {exp.title}</div>
                  <div className="text-xs text-slate-400">
                    {exp.vendor} · requested by {exp.requesterName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">${exp.amount.toLocaleString()} {exp.currency}</div>
                  <div className={exp.releasedAt ? 'text-emerald-400' : 'text-amber-400'}>
                    {exp.releasedAt ? 'RELEASED' : 'LOCKED'} · {exp.approvals.length}/{REQUIRED_APPROVALS} approvals
                  </div>
                </div>
              </div>
              <ul className="text-xs font-mono space-y-1">
                {exp.approvals.map((a, i) => (
                  <li key={a.sub}>
                    #{i + 1} {a.username} · sub {a.sub.slice(0, 12)}… · token sha256 {a.tokenDigest.slice(0, 16)}…
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <button onClick={approve} className="px-4 py-2 rounded bg-emerald-500 text-slate-950 font-semibold">
                  Approve as {identity.username}
                </button>
                <button onClick={forceRelease} className="px-4 py-2 rounded bg-red-600 text-white font-semibold">
                  SysAdmin: force release
                </button>
              </div>
            </>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="text-sm font-semibold mb-2">Audit trail</div>
          <ul className="text-xs font-mono space-y-1 max-h-72 overflow-auto">
            {state.events.map((e, i) => (
              <li key={i} className={e.kind === 'blocked' ? 'text-red-400' : e.kind === 'ok' ? 'text-emerald-400' : 'text-slate-300'}>
                {e.at.slice(11, 19)} [{e.who}] {e.text}
              </li>
            ))}
          </ul>
        </section>

        <p className="text-xs text-slate-500">
          Prototype note: identity and roles are real TideCloak; the 2-distinct-approver check runs in this browser
          and the payment rail is mocked. See README for what is and is not enforced by Tide.
        </p>
      </div>
    </div>
  )
}

function Badge({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${on ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-800 text-slate-500 line-through'}`}>
      {children}
    </span>
  )
}

