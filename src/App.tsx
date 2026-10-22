import React, { useEffect, useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  FilePlus2,
  Terminal,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Fingerprint,
  Database,
  Ban,
  Building2,
  Wallet,
  Clock,
  ChevronRight,
  Info,
  Layers,
  Cpu,
  Activity,
  Hash,
} from 'lucide-react';
import {
  TIDECLOAK_USERS,
  UserId,
  ExpenseRequest,
  AuditLogEntry,
  PolicyViolationEvent,
  initializeTideCloakKeys,
  evaluateTideCloakApproval,
  getCanonicalExpensePayload,
} from './lib/tidecloakEngine';

const INITIAL_DEMO_EXPENSE: ExpenseRequest = {
  id: 'EXP-2026-0842',
  title: 'Production H100 GPU Cluster & Cloud Infrastructure Renewal',
  vendor: 'CloudScale Sovereign Compute Ltd.',
  category: 'Critical Vendor Payment',
  amount: 48500,
  currency: 'USDC',
  recipientWallet: '0x71C...9A4B (Multi-Chain Treasury Vault)',
  description:
    'Q4 dedicated bare-metal cluster settlement required to keep mainnet validator & AI inference nodes online.',
  requesterId: 'user-a',
  requesterName: TIDECLOAK_USERS['user-a'].name,
  requesterSub: TIDECLOAK_USERS['user-a'].tidecloakSub,
  createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
  status: 'PENDING_FIRST_APPROVAL',
  approvals: [],
  violations: [],
};

export function App({ liveAvailable = false }: { liveAvailable?: boolean }) {
  const [activeUserId, setActiveUserId] = useState<UserId>('user-a');
  const [expenses, setExpenses] = useState<ExpenseRequest[]>([INITIAL_DEMO_EXPENSE]);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>(INITIAL_DEMO_EXPENSE.id);
  const [keyThumbprints, setKeyThumbprints] = useState<Record<UserId, string>>({
    'user-a': 'Generating ECDSA P-256...',
    'user-b': 'Generating ECDSA P-256...',
    'user-c': 'Generating ECDSA P-256...',
  });
  const [storyStep, setStoryStep] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [activeViolationModal, setActiveViolationModal] = useState<PolicyViolationEvent | null>(null);
  const [showNewExpenseForm, setShowNewExpenseForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'enclave' | 'comparison'>('enclave');
  const [treasuryBalance, setTreasuryBalance] = useState<number>(1250000);

  // New Expense Form state
  const [newTitle, setNewTitle] = useState('Zero-Knowledge Security Audit Retainer');
  const [newVendor, setNewVendor] = useState('VeriShield Cryptography Group');
  const [newCategory, setNewCategory] = useState('Critical Vendor Payment');
  const [newAmount, setNewAmount] = useState('32000');
  const [newRecipient, setNewRecipient] = useState('0x94F...3E12 (VeriShield Escrow)');
  const [newDescription, setNewDescription] = useState(
    'Smart contract & threshold signature audit milestone #2 invoice.'
  );

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'log-init-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      level: 'INFO',
      actor: 'TideCloak Enclave',
      action: 'POLICY_LOADED',
      details:
        'Loaded cryptographic policy [TC-DUAL-CONTROL-2OFN-V1]: Requires k=2 distinct ECDSA P-256 approver signatures over canonical expense digest.',
    },
    {
      id: 'log-init-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      level: 'INFO',
      actor: 'User A (Alice Vance)',
      action: 'EXPENSE_INITIALIZED',
      details:
        'Step 1 Complete: Submitted EXP-2026-0842 ($48,500 USDC to CloudScale Sovereign Compute Ltd.). Status: 0/2 Approvals.',
    },
  ]);

  useEffect(() => {
    initializeTideCloakKeys().then((res) => {
      setKeyThumbprints({
        'user-a': res['user-a'].thumbprint,
        'user-b': res['user-b'].thumbprint,
        'user-c': res['user-c'].thumbprint,
      });
    });
  }, []);

  const activeUser = TIDECLOAK_USERS[activeUserId];
  const selectedExpense = expenses.find((e) => e.id === selectedExpenseId) || expenses[0];

  const appendLog = (
    level: AuditLogEntry['level'],
    actor: string,
    action: string,
    details: string,
    codeSnippet?: string
  ) => {
    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        level,
        actor,
        action,
        details,
        codeSnippet,
      },
      ...prev,
    ]);
  };

  const handleSwitchUser = (uid: UserId) => {
    setActiveUserId(uid);
    const u = TIDECLOAK_USERS[uid];
    appendLog(
      'INFO',
      `${u.label} (${u.name})`,
      'IDENTITY_SESSION_ACTIVE',
      `Switched active TideCloak OIDC/DPoP session to ${u.tidecloakSub} [${u.roles.join(', ')}]`
    );
  };

  // Step 1: Create new expense request as User A
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(newAmount) || 25000;
    const newExp: ExpenseRequest = {
      id: `EXP-2026-0${Math.floor(850 + Math.random() * 140)}`,
      title: newTitle.trim() || 'Critical Vendor Payment',
      vendor: newVendor.trim() || 'Sovereign Vendor Inc.',
      category: newCategory,
      amount: numericAmount,
      currency: 'USDC',
      recipientWallet: newRecipient.trim() || '0x88A...44B1',
      description: newDescription.trim(),
      requesterId: activeUser.id,
      requesterName: activeUser.name,
      requesterSub: activeUser.tidecloakSub,
      createdAt: new Date().toISOString(),
      status: 'PENDING_FIRST_APPROVAL',
      approvals: [],
      violations: [],
    };

    setExpenses((prev) => [newExp, ...prev]);
    setSelectedExpenseId(newExp.id);
    setShowNewExpenseForm(false);
    setStoryStep(2);

    appendLog(
      'INFO',
      `${activeUser.label} (${activeUser.name})`,
      'EXPENSE_INITIALIZED',
      `Initialized ${newExp.id} for $${numericAmount.toLocaleString()} USDC to ${newExp.vendor}. Canonical payload locked for 2-of-N threshold signing.`,
      getCanonicalExpensePayload(newExp)
    );
  };

  // Evaluate approval or malicious constraint violation via TideCloak
  const handleApprovalAction = async (
    expense: ExpenseRequest,
    mode: 'NORMAL_APPROVE' | 'FORCE_ADMIN_BYPASS' = 'NORMAL_APPROVE',
    overrideUser?: UserId
  ) => {
    const actor = overrideUser ? TIDECLOAK_USERS[overrideUser] : activeUser;
    if (overrideUser && overrideUser !== activeUserId) {
      setActiveUserId(overrideUser);
    }

    const result = await evaluateTideCloakApproval(actor, expense, mode);

    if (!result.allowed) {
      const v = result.violation;
      setExpenses((prev) =>
        prev.map((item) =>
          item.id === expense.id ? { ...item, violations: [v, ...item.violations] } : item
        )
      );
      setActiveViolationModal(v);

      appendLog(
        'SECURITY_BLOCK',
        `${actor.label} (${actor.name})`,
        v.errorCode,
        `${v.title} — ${v.reason}`,
        v.technicalDetail
      );

      if (v.attemptType === 'DUPLICATE_APPROVAL' || v.attemptType === 'ADMIN_DB_BYPASS') {
        setStoryStep(4);
      }
      return;
    }

    const { approval, executionCertificate } = result;
    const nextApprovals = [...expense.approvals, approval];
    const isNowExecuted = nextApprovals.length >= 2;

    setExpenses((prev) =>
      prev.map((item) =>
        item.id === expense.id
          ? {
              ...item,
              approvals: nextApprovals,
              status: isNowExecuted ? 'EXECUTED_2_OF_2' : 'PARTIALLY_APPROVED_1_OF_2',
              executionCertificate: executionCertificate || item.executionCertificate,
            }
          : item
      )
    );

    if (isNowExecuted && executionCertificate) {
      setTreasuryBalance((b) => b - expense.amount);
      setStoryStep(5);
      appendLog(
        'SUCCESS',
        'TideCloak Threshold Enclave',
        'CONSENSUS_REACHED_2_OF_2',
        `2/2 distinct cryptographic approvals verified (${nextApprovals
          .map((a) => a.approverName)
          .join(' + ')}). Released $${expense.amount.toLocaleString()} ${expense.currency} to ${
          expense.vendor
        }.`,
        JSON.stringify(executionCertificate, null, 2)
      );
    } else {
      setStoryStep(3);
      appendLog(
        'CRYPTO_VERIFY',
        `${actor.label} (${actor.name})`,
        'APPROVAL_1_OF_2_SIGNED',
        `Verified ECDSA P-256 Share #1 from ${actor.tidecloakSub}. Status: 1/2 Approvals. Funds remain cryptographically locked until a 2nd distinct identity co-signs.`,
        `Sig: ${approval.signatureHex.slice(0, 42)}...\nThumbprint: ${approval.publicKeyThumbprint}`
      );
    }
  };

  // Guided 1-Click Story Runner for effortless live demos
  const handleRunGuidedStoryStep = async () => {
    const exp = selectedExpense;

    if (exp.status === 'EXECUTED_2_OF_2') {
      handleResetDemo();
      return;
    }

    if (exp.approvals.length === 0) {
      setActiveUserId('user-b');
      await handleApprovalAction(exp, 'NORMAL_APPROVE', 'user-b');
      return;
    }

    if (exp.approvals.length === 1 && exp.violations.length === 0) {
      setActiveUserId('user-b');
      await handleApprovalAction(exp, 'NORMAL_APPROVE', 'user-b');
      return;
    }

    if (exp.approvals.length === 1 && exp.violations.length > 0) {
      setActiveViolationModal(null);
      setActiveUserId('user-c');
      await handleApprovalAction(exp, 'NORMAL_APPROVE', 'user-c');
      return;
    }
  };

  const handleResetDemo = () => {
    const freshExpense: ExpenseRequest = {
      ...INITIAL_DEMO_EXPENSE,
      createdAt: new Date().toISOString(),
      status: 'PENDING_FIRST_APPROVAL',
      approvals: [],
      violations: [],
      executionCertificate: undefined,
    };
    setExpenses([freshExpense]);
    setSelectedExpenseId(freshExpense.id);
    setActiveUserId('user-a');
    setActiveViolationModal(null);
    setTreasuryBalance(1250000);
    setStoryStep(2);
    setAuditLogs([
      {
        id: `log-reset-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'INFO',
        actor: 'User A (Alice Vance)',
        action: 'STORY_RESET_STEP_1',
        details:
          'Demo reset to Step 1 Complete: User A submitted EXP-2026-0842 ($48,500 USDC). Ready for Step 2 (User B First Approval).',
      },
    ]);
  };

  // Determine current story phase for the selected expense
  const currentPhase: 1 | 2 | 3 | 4 | 5 =
    selectedExpense.status === 'EXECUTED_2_OF_2'
      ? 5
      : selectedExpense.approvals.length === 1 && selectedExpense.violations.length > 0
      ? 4
      : selectedExpense.approvals.length === 1
      ? 3
      : storyStep;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Honesty banner: this view is the offline simulation, not a live TideCloak session */}
      <div className="bg-amber-500/15 border-b border-amber-500/40 text-amber-200 text-xs px-4 py-1.5 text-center">
        <b>SIMULATION MODE</b> — offline storytelling demo. Personas, keys and the 2-of-2 check are simulated in
        your browser (WebCrypto); "enclave" labels are illustrative.{' '}
        {liveAvailable ? (
          <a href="/" className="underline font-semibold">Switch to LIVE TideCloak mode →</a>
        ) : (
          <span>Add <code>public/tidecloak.json</code> to enable LIVE TideCloak mode (see docs/SETUP.md).</span>
        )}
      </div>
      {/* Glassmorphic Top Header & Identity Switcher */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/80 bg-opacity-80 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Brand Identity & Enclave Status */}
          <div className="flex items-center gap-3.5">
            <div className="relative w-10 h-10 rounded-xl bg-slate-950 border border-emerald-500/50 shadow-glow-emerald flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">
                  Dual-Control Expense Desk
                </h1>
                <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs bg-emerald-400/10 text-emerald-400 border border-emerald-500/40">
                  <Cpu className="w-3 h-3" /> TIDECLOAK_ENCLAVE::2_OF_N
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero-Trust Cryptographic Treasury • Eliminating Single Points of Failure
              </p>
            </div>
          </div>

          {/* Glassmorphic Identity Switcher Deck */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="hidden xl:flex items-center gap-1.5 mr-1 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-xs text-slate-400">SIGNER_NODE:</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
              {(['user-a', 'user-b', 'user-c'] as UserId[]).map((uid) => {
                const u = TIDECLOAK_USERS[uid];
                const isSelected = activeUserId === uid;
                return (
                  <button
                    key={uid}
                    onClick={() => handleSwitchUser(uid)}
                    className={`group relative flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-all border ${
                      isSelected
                        ? 'bg-slate-900 border-emerald-500/50 shadow-glow-emerald'
                        : 'bg-transparent border-transparent hover:bg-slate-900/60 hover:border-slate-800 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg bg-gradient-to-br ${u.colorClass} flex items-center justify-center font-mono text-xs font-bold text-white shadow-sm`}
                    >
                      {u.avatarInitials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-white">{u.label}</span>
                        <span className="text-xs font-medium text-slate-300 hidden sm:inline">
                          {u.name}
                        </span>
                        {u.isSuperAdmin && (
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30">
                            ROOT
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 truncate max-w-[130px]">
                        {u.tidecloakSub.replace('tc:did:enclave:', 'did:')}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleResetDemo}
              title="Reset 4-Step Demo Story"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* 4-Step Cybersecurity Pipeline / Stepper Bar */}
      <section className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5">
          {/* Pipeline Header & 1-Click Guided Controller */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> CONSENSUS_PIPELINE_STEPPER
              </span>
              <span className="text-xs text-slate-400">
                Interactive 4-stage cryptographic verification pipeline. Select a node or trigger the next stage below.
              </span>
            </div>

            {/* Guided Step Action CTA */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunGuidedStoryStep}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  currentPhase === 3
                    ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border-rose-500 animate-rose-pulse'
                    : currentPhase === 4
                    ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/50 shadow-glow-emerald'
                    : currentPhase === 2
                    ? 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border-amber-400/40 shadow-glow-amber'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                {currentPhase === 2 && (
                  <>
                    <span className="font-mono text-xs">[STAGE_02]</span>
                    <span>Execute First Approval (1/2) as User B</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
                {currentPhase === 3 && (
                  <>
                    <span className="font-mono text-xs">[STAGE_03]</span>
                    <span>Simulate Malicious 2nd Approval by User B</span>
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                  </>
                )}
                {currentPhase === 4 && (
                  <>
                    <span className="font-mono text-xs">[STAGE_04]</span>
                    <span>Co-Sign (2/2) as User C & Release Escrowed Funds</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </>
                )}
                {currentPhase === 5 && (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>2/2 Consensus Complete — Replay Pipeline</span>
                  </>
                )}
                {currentPhase === 1 && (
                  <>
                    <span>Proceed to Stage 02: First Approval</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Visual 4-Node Stepper Pipeline */}
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Stage 1: Initialization */}
            <div
              onClick={() => handleSwitchUser('user-a')}
              className="group relative cursor-pointer rounded-xl bg-slate-900 p-4 border border-emerald-500/50 shadow-glow-emerald transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-400/10 border border-emerald-500/50 font-mono text-xs font-bold text-emerald-400 flex items-center justify-center">
                    01
                  </span>
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    INITIALIZATION
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs bg-emerald-400/10 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 className="w-3 h-3" /> LOCKED
                </span>
              </div>
              <p className="text-xs font-semibold text-white">
                User A Submits Vendor Request
              </p>
              <p className="text-xs text-slate-400 mt-1">
                SHA-256 payload digest sealed inside TideCloak enclave.
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between font-mono text-xs text-slate-400">
                <span>ACTOR: USER_A</span>
                <span className="text-emerald-400">0/2 SIGNED</span>
              </div>
            </div>

            {/* Stage 2: First Approval (1/2) */}
            <div
              onClick={() => handleSwitchUser('user-b')}
              className={`group relative cursor-pointer rounded-xl bg-slate-900 p-4 border transition-all ${
                selectedExpense.approvals.length >= 1
                  ? 'border-emerald-500/50 shadow-glow-emerald'
                  : currentPhase === 2
                  ? 'border-amber-400/50 bg-amber-400/5 shadow-glow-amber'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center border ${
                      selectedExpense.approvals.length >= 1
                        ? 'bg-emerald-400/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-amber-400/10 border-amber-400/40 text-amber-400'
                    }`}
                  >
                    02
                  </span>
                  <span
                    className={`font-mono text-xs font-semibold uppercase tracking-wider ${
                      selectedExpense.approvals.length >= 1 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    FIRST_APPROVAL
                  </span>
                </div>
                {selectedExpense.approvals.length >= 1 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs bg-amber-400/10 text-amber-400 border border-amber-400/30">
                    <Clock className="w-3 h-3" /> 1/2 PENDING
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs bg-amber-400/10 text-amber-400 border border-amber-400/30 animate-pulse">
                    AWAITING_SIG_1
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-white">
                User B Signs Share #1 (1/2)
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ECDSA P-256 Share #1 verified; treasury vault remains locked.
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between font-mono text-xs text-slate-400">
                <span>ACTOR: USER_B</span>
                <span className="text-amber-400">1/2 THRESHOLD</span>
              </div>
            </div>

            {/* Stage 3: The Constraint Check (Blocked / Access Denied) */}
            <div
              onClick={() => handleSwitchUser('user-b')}
              className={`group relative cursor-pointer rounded-xl bg-slate-900 p-4 border transition-all ${
                selectedExpense.violations.length > 0
                  ? 'border-rose-500 bg-rose-500/5 animate-rose-pulse'
                  : currentPhase === 3
                  ? 'border-rose-500/80 bg-rose-500/5 animate-rose-pulse'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center border ${
                      selectedExpense.violations.length > 0 || currentPhase === 3
                        ? 'bg-rose-500/15 border-rose-500 text-rose-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    03
                  </span>
                  <span
                    className={`font-mono text-xs font-semibold uppercase tracking-wider ${
                      selectedExpense.violations.length > 0 || currentPhase === 3
                        ? 'text-rose-500'
                        : 'text-slate-400'
                    }`}
                  >
                    CONSTRAINT_CHECK
                  </span>
                </div>
                {selectedExpense.violations.length > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs bg-rose-500/15 text-rose-500 border border-rose-500 font-bold">
                    <Ban className="w-3 h-3" /> BLOCKED
                  </span>
                ) : currentPhase === 3 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs bg-rose-500/15 text-rose-500 border border-rose-500">
                    TEST_ROGUE_ADMIN
                  </span>
                ) : (
                  <span className="font-mono text-xs text-slate-500">STANDBY</span>
                )}
              </div>
              <p className="text-xs font-semibold text-white">
                User B Attempts 2nd Approval
              </p>
              <p className="text-xs text-slate-400 mt-1">
                TideCloak rejects duplicate key share & SysAdmin bypass.
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between font-mono text-xs text-slate-400">
                <span>ACTOR: USER_B</span>
                <span className="text-rose-500 font-semibold">ACCESS_DENIED</span>
              </div>
            </div>

            {/* Stage 4: Consensus (2/2) */}
            <div
              onClick={() => handleSwitchUser('user-c')}
              className={`group relative cursor-pointer rounded-xl bg-slate-900 p-4 border transition-all ${
                selectedExpense.status === 'EXECUTED_2_OF_2'
                  ? 'border-emerald-500/50 bg-emerald-400/5 shadow-glow-emerald'
                  : currentPhase === 4
                  ? 'border-emerald-500/50 bg-emerald-400/5 shadow-glow-emerald'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center border ${
                      selectedExpense.status === 'EXECUTED_2_OF_2' || currentPhase === 4
                        ? 'bg-emerald-400/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    04
                  </span>
                  <span
                    className={`font-mono text-xs font-semibold uppercase tracking-wider ${
                      selectedExpense.status === 'EXECUTED_2_OF_2' || currentPhase === 4
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    CONSENSUS_2_OF_2
                  </span>
                </div>
                {selectedExpense.status === 'EXECUTED_2_OF_2' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs bg-emerald-400/10 text-emerald-400 border border-emerald-500/50 font-bold">
                    <ShieldCheck className="w-3 h-3" /> 2/2 EXECUTED
                  </span>
                ) : currentPhase === 4 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs bg-emerald-400/10 text-emerald-400 border border-emerald-500/50">
                    READY_TO_SEAL
                  </span>
                ) : (
                  <span className="font-mono text-xs text-slate-500">LOCKED</span>
                )}
              </div>
              <p className="text-xs font-semibold text-white">
                User C Co-Signs Independent Share
              </p>
              <p className="text-xs text-slate-400 mt-1">
                2 distinct keys verified → Threshold certificate releases funds.
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between font-mono text-xs text-slate-400">
                <span>ACTOR: USER_C</span>
                <span className="text-emerald-400">2/2 RELEASED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Enterprise Treasury Grid */}
      <main className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left & Center Column (7 cols): Cryptographic Session Telemetry + Expense Desk */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Operator Hardware/Enclave Card */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${activeUser.colorClass} flex items-center justify-center font-mono text-sm font-bold text-white shadow-lg border border-white/10`}
                >
                  {activeUser.avatarInitials}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 text-emerald-400 border border-emerald-500/40 font-semibold">
                      {activeUser.label.toUpperCase()}
                    </span>
                    <h2 className="text-base font-bold text-white">{activeUser.name}</h2>
                    <span className="text-xs text-slate-400">• {activeUser.title}</span>
                  </div>
                  <p className="text-xs text-cyan-400 mt-1 font-medium">{activeUser.storyRole}</p>
                </div>
              </div>

              {/* Multi-Sig Treasury Vault Balance */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-right">
                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400 flex items-center justify-end gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" /> VAULT_LIQUIDITY
                </div>
                <div className="font-mono text-base font-bold text-white mt-0.5">
                  ${treasuryBalance.toLocaleString()}{' '}
                  <span className="font-mono text-xs text-emerald-400">USDC</span>
                </div>
              </div>
            </div>

            {/* Strict Monospace Cryptographic Session Identifiers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-cyan-400" /> TideCloak Subject ID
                </span>
                <div
                  className="font-mono text-xs text-slate-200 truncate mt-1.5"
                  title={activeUser.tidecloakSub}
                >
                  {activeUser.tidecloakSub}
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" /> ECDSA Key Fingerprint
                </span>
                <div
                  className="font-mono text-xs text-amber-400 truncate mt-1.5"
                  title={keyThumbprints[activeUser.id]}
                >
                  {keyThumbprints[activeUser.id]}
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Enclave Capabilities
                </span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {activeUser.roles.map((r) => (
                    <span
                      key={r}
                      className={`font-mono text-xs px-1.5 py-0.2 rounded ${
                        r.includes('superadmin') || r.includes('root')
                          ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                          : 'bg-slate-900 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section Title & New Request Trigger */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-white">
                  Cryptographic Treasury Queue
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                  POLICY::TC-DUAL-CONTROL-2OFN-V1
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Disbursements require k=2 mathematically distinct ECDSA P-256 identity signatures.
              </p>
            </div>

            <button
              onClick={() => {
                if (activeUserId !== 'user-a') {
                  handleSwitchUser('user-a');
                }
                setShowNewExpenseForm((prev) => !prev);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 transition-all cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>{showNewExpenseForm ? 'Close Form' : '+ New Expense (User A)'}</span>
            </button>
          </div>

          {/* Collapsible Step 1 New Expense Form */}
          {showNewExpenseForm && (
            <form
              onSubmit={handleCreateExpense}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-500/40">
                    STAGE_01
                  </span>
                  <h4 className="text-sm font-semibold text-white">
                    Initialize Vendor Payment Request ({activeUser.name})
                  </h4>
                </div>
                <span className="font-mono text-xs text-slate-400">{activeUser.tidecloakSub}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Expense Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Vendor / Counterparty</label>
                  <input
                    type="text"
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Amount (USDC)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Destination Wallet / Vault</label>
                  <input
                    type="text"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Memo / Cryptographic Payload Note</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewExpenseForm(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 shadow-glow-emerald"
                >
                  Seal Payload Digest & Broadcast
                </button>
              </div>
            </form>
          )}

          {/* Expense Request Cards */}
          {expenses.map((expense) => {
            const approvalCount = expense.approvals.length;
            const isExecuted = expense.status === 'EXECUTED_2_OF_2';
            const hasUserBSigned = expense.approvals.some((a) => a.approverId === 'user-b');
            const hasActiveUserSigned = expense.approvals.some((a) => a.approverId === activeUserId);

            return (
              <div
                key={expense.id}
                onClick={() => setSelectedExpenseId(expense.id)}
                className={`rounded-2xl bg-slate-900 border transition-all p-5 sm:p-6 space-y-5 ${
                  isExecuted
                    ? 'border-emerald-500/50 shadow-glow-emerald'
                    : expense.violations.length > 0
                    ? 'border-rose-500 animate-rose-pulse'
                    : approvalCount === 1
                    ? 'border-slate-800 shadow-glow-amber'
                    : 'border-slate-800'
                }`}
              >
                {/* Card Header & Status Badge */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                        {expense.id}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                        {expense.category}
                      </span>

                      {/* Status Badges with Requested Glows */}
                      {isExecuted ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-500/50 shadow-glow-emerald">
                          <ShieldCheck className="w-3.5 h-3.5" /> Approved (2/2) • Consensus Verified
                        </span>
                      ) : expense.violations.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-0.5 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500 animate-rose-pulse">
                          <Ban className="w-3.5 h-3.5" /> Access Denied • Constraint Triggered (1/2)
                        </span>
                      ) : approvalCount === 1 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/30 shadow-glow-amber">
                          <Lock className="w-3.5 h-3.5" /> Pending (1/2) • Awaiting 2nd Signer
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                          <Clock className="w-3.5 h-3.5" /> Initialized (0/2) • Pending Signers
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-bold text-white pt-1">{expense.title}</h4>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap pt-0.5">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Beneficiary:</span>
                        <strong className="text-slate-200">{expense.vendor}</strong>
                      </span>
                      <span className="text-slate-700">|</span>
                      <span className="inline-flex items-center gap-1.5">
                        <span>Initiator:</span>
                        <strong className="text-slate-200">{expense.requesterName}</strong>
                        <span className="font-mono text-xs text-slate-400">
                          ({expense.requesterSub.replace('tc:did:enclave:', '')})
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Amount & Destination Hash Box */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-right min-w-[185px]">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                      DISBURSEMENT_AMOUNT
                    </div>
                    <div className="font-mono text-xl font-extrabold text-white mt-0.5">
                      ${expense.amount.toLocaleString()}{' '}
                      <span className="font-mono text-xs font-semibold text-emerald-400">
                        {expense.currency}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-slate-400 truncate max-w-[200px] mt-0.5">
                      {expense.recipientWallet}
                    </div>
                  </div>
                </div>

                {/* Description & Canonical Hash Strip */}
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 space-y-2">
                  <p className="text-xs text-slate-300 leading-relaxed">{expense.description}</p>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-400">
                      <Hash className="w-3.5 h-3.5 text-cyan-400" />
                      <span>SIGNING_KEY_ID:</span>
                      <span className="text-slate-200">{activeUser.keyId}</span>
                    </span>
                    <span className="font-mono text-xs text-slate-500">
                      CURVE: ECDSA_P256_SHA256
                    </span>
                  </div>
                </div>

                {/* 2-of-N Cryptographic Signature Slots */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-400" />
                      <span>Cryptographic Threshold Slots</span>
                      <span
                        className={`font-mono text-xs px-2 py-0.5 rounded border ${
                          approvalCount >= 2
                            ? 'bg-emerald-400/10 text-emerald-400 border-emerald-500/50'
                            : approvalCount === 1
                            ? 'bg-amber-400/10 text-amber-400 border-amber-400/30'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {approvalCount}/2 VERIFIED
                      </span>
                    </span>
                    <span className="font-mono text-xs text-slate-400 hidden sm:inline">
                      ASSERT(SIGNER_1.KEY != SIGNER_2.KEY)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Slot 1 */}
                    {expense.approvals[0] ? (
                      <div className="rounded-xl bg-slate-950 border border-emerald-500/50 p-4 space-y-2 shadow-glow-emerald">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            SHARE_01 :: VERIFIED
                          </span>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400 border border-emerald-500/40">
                            {TIDECLOAK_USERS[expense.approvals[0].approverId].label}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-white">
                          {expense.approvals[0].approverName}
                        </div>
                        <div className="space-y-1 pt-1 border-t border-slate-800">
                          <div className="font-mono text-xs text-slate-400 truncate">
                            SUB: <span className="text-slate-200">{expense.approvals[0].approverSub}</span>
                          </div>
                          <div className="font-mono text-xs text-slate-400 truncate">
                            FP: <span className="text-amber-400">{expense.approvals[0].publicKeyThumbprint}</span>
                          </div>
                          <div className="font-mono text-xs text-emerald-400 truncate">
                            SIG: {expense.approvals[0].signatureHex.slice(0, 32)}...
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs font-semibold text-slate-400">
                            SHARE_01 :: UNASSIGNED
                          </span>
                          <span className="font-mono text-xs text-slate-500">SLOT_OPEN</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Awaiting first cryptographic signature from an authorized Treasury Approver (User B).
                        </p>
                      </div>
                    )}

                    {/* Slot 2 */}
                    {expense.approvals[1] ? (
                      <div className="rounded-xl bg-slate-950 border border-emerald-500/50 p-4 space-y-2 shadow-glow-emerald">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            SHARE_02 :: VERIFIED
                          </span>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400 border border-emerald-500/40">
                            {TIDECLOAK_USERS[expense.approvals[1].approverId].label}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-white">
                          {expense.approvals[1].approverName}
                        </div>
                        <div className="space-y-1 pt-1 border-t border-slate-800">
                          <div className="font-mono text-xs text-slate-400 truncate">
                            SUB: <span className="text-slate-200">{expense.approvals[1].approverSub}</span>
                          </div>
                          <div className="font-mono text-xs text-slate-400 truncate">
                            FP: <span className="text-amber-400">{expense.approvals[1].publicKeyThumbprint}</span>
                          </div>
                          <div className="font-mono text-xs text-emerald-400 truncate">
                            SIG: {expense.approvals[1].signatureHex.slice(0, 32)}...
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`rounded-xl bg-slate-950 border p-4 flex flex-col justify-center ${
                          approvalCount === 1
                            ? 'border-amber-400/30 bg-amber-400/5'
                            : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-mono text-xs font-semibold ${
                              approvalCount === 1 ? 'text-amber-400' : 'text-slate-400'
                            }`}
                          >
                            SHARE_02 :: DISTINCT_KEY_REQUIRED
                          </span>
                          <Lock
                            className={`w-3.5 h-3.5 ${
                              approvalCount === 1 ? 'text-amber-400' : 'text-slate-500'
                            }`}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {approvalCount === 1
                            ? `Cryptographically locked against ${expense.approvals[0].approverName} (${expense.approvals[0].publicKeyThumbprint}). Requires independent key share (User C).`
                            : 'Awaiting second independent approver signature.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3 Constraint Alert Banner (Pulsating Neon Rose) */}
                {expense.violations.length > 0 && (
                  <div className="rounded-xl bg-slate-950 border border-rose-500 p-4 space-y-2.5 animate-rose-pulse">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
                        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="font-mono text-xs">
                          ENCLAVE_BLOCK :: {expense.violations[0].errorCode}
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveViolationModal(expense.violations[0])}
                        className="font-mono text-xs underline text-rose-400 hover:text-rose-300 cursor-pointer"
                      >
                        [VIEW_FORENSIC_TRACE]
                      </button>
                    </div>
                    <p className="text-xs text-slate-200">{expense.violations[0].reason}</p>
                    <div className="font-mono text-xs text-rose-400 bg-slate-900/90 rounded-lg p-2.5 border border-rose-500/40">
                      {expense.violations[0].technicalDetail}
                    </div>
                  </div>
                )}

                {/* Step 4 Execution Certificate Banner (Neon Emerald Glow) */}
                {isExecuted && expense.executionCertificate && (
                  <div className="rounded-xl bg-slate-950 border border-emerald-500/50 p-4 space-y-2.5 shadow-glow-emerald">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono text-xs">
                          THRESHOLD_EXECUTION_CERTIFICATE :: {expense.executionCertificate.certificateId}
                        </span>
                      </div>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400 border border-emerald-500/40">
                        2/2 CONSENSUS_SEALED
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Two distinct identity signatures verified by TideCloak. Escrowed payout of{' '}
                      <span className="font-mono text-xs text-white font-semibold">
                        ${expense.amount.toLocaleString()} {expense.currency}
                      </span>{' '}
                      settled to {expense.vendor}.
                    </p>
                    <div className="font-mono text-xs text-emerald-400 bg-slate-900 rounded-lg p-2.5 border border-emerald-500/30 break-all">
                      PROOF_HASH: {expense.executionCertificate.combinedThresholdProof}
                    </div>
                  </div>
                )}

                {/* Action Control Bar */}
                {!isExecuted && (
                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Active Signer:</span>
                      <span className="font-mono text-xs text-white font-semibold px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {activeUser.label} ({activeUser.name})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* User A Actions */}
                      {activeUserId === 'user-a' && (
                        <>
                          <button
                            onClick={() => handleApprovalAction(expense, 'NORMAL_APPROVE')}
                            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-950 hover:bg-rose-500/10 text-slate-300 hover:text-rose-500 border border-slate-800 hover:border-rose-500 transition-all cursor-pointer"
                          >
                            Test Self-Approval (Blocked)
                          </button>
                          <button
                            onClick={() => handleSwitchUser('user-b')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/40 shadow-glow-amber transition-all cursor-pointer"
                          >
                            <span>Switch to User B (Stage 02)</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* User B First Approval (Step 2) */}
                      {activeUserId === 'user-b' && !hasUserBSigned && (
                        <button
                          onClick={() => handleApprovalAction(expense, 'NORMAL_APPROVE')}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/50 shadow-glow-amber transition-all cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4" />
                          <span>Stage 02: Sign First Approval (1/2) as User B</span>
                        </button>
                      )}

                      {/* User B Malicious Second Approval Attempt (Step 3) */}
                      {activeUserId === 'user-b' && hasUserBSigned && (
                        <>
                          <button
                            onClick={() => handleApprovalAction(expense, 'NORMAL_APPROVE')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 border border-rose-500 animate-rose-pulse transition-all cursor-pointer"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Stage 03: Attempt 2nd Approval as User B (Rogue Admin)</span>
                          </button>

                          <button
                            onClick={() => handleApprovalAction(expense, 'FORCE_ADMIN_BYPASS')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-rose-500/15 text-amber-400 hover:text-rose-500 border border-slate-800 hover:border-rose-500 transition-all cursor-pointer"
                          >
                            <Database className="w-3.5 h-3.5" />
                            <span>SysAdmin DB Force-Bypass</span>
                          </button>

                          {expense.violations.length > 0 && (
                            <button
                              onClick={() => handleSwitchUser('user-c')}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 border border-emerald-500/50 shadow-glow-emerald transition-all cursor-pointer"
                            >
                              <span>Switch to User C (Stage 04)</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}

                      {/* User C Independent Second Approval (Step 4) */}
                      {activeUserId === 'user-c' && !hasActiveUserSigned && (
                        <button
                          onClick={() => handleApprovalAction(expense, 'NORMAL_APPROVE')}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 border border-emerald-500/50 shadow-glow-emerald transition-all cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>
                            {approvalCount === 1
                              ? 'Stage 04: Co-Sign 2nd Approval (2/2) & Release Funds'
                              : 'Sign First Approval (1/2) as User C'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column (5 cols): TideCloak Enclave Console & Architecture Comparison */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex flex-col h-full max-h-[790px]">
            {/* Console Tab Header */}
            <div className="flex border-b border-slate-800 bg-slate-950 p-1.5 gap-1.5">
              <button
                onClick={() => setActiveTab('enclave')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  activeTab === 'enclave'
                    ? 'bg-slate-900 text-emerald-400 border-emerald-500/50 shadow-glow-emerald'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>TideCloak Enclave Telemetry</span>
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  activeTab === 'comparison'
                    ? 'bg-slate-900 text-emerald-400 border-emerald-500/50 shadow-glow-emerald'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>RBAC vs. TideCloak</span>
              </button>
            </div>

            {activeTab === 'enclave' ? (
              <div className="p-4 flex-1 flex flex-col space-y-4 overflow-hidden">
                {/* Immutable Enclave Policy Box */}
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> ENCLAVE_CONTRACT_SPEC
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400 border border-emerald-500/40">
                      IMMUTABLE
                    </span>
                  </div>
                  <pre className="font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
{`policy_id: "TC-DUAL-CONTROL-2OFN-V1"
threshold: 2_of_n_distinct_ecdsa_p256
constraints:
  - assert(signer.sub != expense.requesterSub)
  - assert(signer_1.sub != signer_2.sub)
  - assert(signer_1.fp  != signer_2.fp)`}
                  </pre>
                </div>

                {/* Live Cryptographic Audit Stream */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Real-Time Verification Stream</span>
                      <span className="font-mono text-xs text-slate-500">({auditLogs.length})</span>
                    </span>
                    <span className="font-mono text-xs text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`rounded-xl p-3.5 border space-y-1.5 transition-all ${
                          log.level === 'SECURITY_BLOCK'
                            ? 'bg-slate-950 border-rose-500 text-rose-400 animate-rose-pulse'
                            : log.level === 'SUCCESS'
                            ? 'bg-slate-950 border-emerald-500/50 text-emerald-300 shadow-glow-emerald'
                            : log.level === 'CRYPTO_VERIFY'
                            ? 'bg-slate-950 border-amber-400/40 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`font-mono text-xs font-bold ${
                              log.level === 'SECURITY_BLOCK'
                                ? 'text-rose-500'
                                : log.level === 'SUCCESS'
                                ? 'text-emerald-400'
                                : log.level === 'CRYPTO_VERIFY'
                                ? 'text-amber-400'
                                : 'text-cyan-400'
                            }`}
                          >
                            [{log.action}]
                          </span>
                          <span className="font-mono text-xs text-slate-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="font-mono text-xs text-slate-400">
                          NODE: <span className="text-slate-200">{log.actor}</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-300">{log.details}</p>
                        {log.codeSnippet && (
                          <pre className="font-mono text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800 overflow-x-auto text-slate-300 mt-1">
                            {log.codeSnippet}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Architectural Comparison Tab */
              <div className="p-4 space-y-4 overflow-y-auto">
                <div className="rounded-xl bg-slate-950 border border-rose-500/50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Legacy RBAC Vulnerability (Mutable DB State)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Traditional enterprise apps store approvals as database rows (`status = 'APPROVED'`). A
                    rogue SysAdmin can unilaterally bypass controls:
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc">
                    <li>Modify approval counts directly inside the database.</li>
                    <li>Grant temporary role escalations or spoof secondary accounts.</li>
                    <li>Trigger backend payout webhooks without cryptographic proof.</li>
                  </ul>
                </div>

                <div className="rounded-xl bg-slate-950 border border-emerald-500/50 p-4 space-y-2 shadow-glow-emerald">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>TideCloak Cryptographic Dual-Control</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    TideCloak replaces administrative trust with mathematical verification:
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc">
                    <li>
                      <strong className="text-emerald-400">Identity-Bound Key Shares:</strong> Approvals
                      are ECDSA signatures tied to distinct TideCloak enclave subjects.
                    </li>
                    <li>
                      <strong className="text-emerald-400">Collision Rejection:</strong> Signing twice with
                      User B's key fails Lagrange threshold interpolation (`DUPLICATE_IDENTITY_SHARE`).
                    </li>
                    <li>
                      <strong className="text-emerald-400">Zero Backend Trust:</strong> Even with `db:root`
                      access, funds cannot move without 2 valid, independent cryptographic signatures.
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-cyan-400" />
                    <span>Threat Mitigation Matrix</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs pt-2">
                    <div className="font-mono text-xs text-slate-400">VECTOR</div>
                    <div className="font-mono text-xs text-rose-500">LEGACY_RBAC</div>
                    <div className="font-mono text-xs text-emerald-400">TIDECLOAK</div>

                    <div className="text-slate-300 py-1.5 border-t border-slate-800">Double Approve</div>
                    <div className="font-mono text-xs text-rose-500 py-1.5 border-t border-slate-800">
                      VULNERABLE
                    </div>
                    <div className="font-mono text-xs text-emerald-400 py-1.5 border-t border-slate-800">
                      BLOCKED_KEY_FP
                    </div>

                    <div className="text-slate-300 py-1.5 border-t border-slate-800">Root DB Override</div>
                    <div className="font-mono text-xs text-rose-500 py-1.5 border-t border-slate-800">
                      COMPROMISED
                    </div>
                    <div className="font-mono text-xs text-emerald-400 py-1.5 border-t border-slate-800">
                      ENCLAVE_DENIED
                    </div>

                    <div className="text-slate-300 py-1.5 border-t border-slate-800">Self-Approval</div>
                    <div className="font-mono text-xs text-rose-500 py-1.5 border-t border-slate-800">
                      ROLE_MUTABLE
                    </div>
                    <div className="font-mono text-xs text-emerald-400 py-1.5 border-t border-slate-800">
                      SUB_COLLISION
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Step 3 Modal: Neon Rose Pulsating Access Denied Enclave Intercept */}
      {activeViolationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full rounded-2xl bg-slate-900 border-2 border-rose-500 animate-rose-pulse overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 border-b border-rose-500/50 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500 flex items-center justify-center text-rose-500">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-500 border border-rose-500/50 font-bold">
                    ACCESS_DENIED :: TIDECLOAK_ENCLAVE_INTERCEPT
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">
                    {activeViolationModal.title}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/40 p-3.5 text-xs text-slate-100 leading-relaxed">
                {activeViolationModal.reason}
              </div>

              <div className="space-y-2">
                <div className="font-mono text-xs uppercase tracking-wider text-slate-400">
                  CRYPTOGRAPHIC_FORENSIC_TELEMETRY
                </div>
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 space-y-1.5">
                  <div>
                    <span className="text-slate-500">ERR_CODE:</span>{' '}
                    <span className="text-rose-500 font-bold">{activeViolationModal.errorCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">ACTOR_SUB:</span>{' '}
                    <span className="text-amber-400">
                      {activeViolationModal.actorName} ({activeViolationModal.actorSub})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">KEY_ID:</span>{' '}
                    <span className="text-slate-200">{activeViolationModal.actorKeyId}</span>
                  </div>
                  <div className="pt-2.5 text-xs text-rose-400 border-t border-slate-800 mt-2 leading-relaxed">
                    {activeViolationModal.technicalDetail}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setActiveViolationModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                >
                  Dismiss Intercept
                </button>

                <button
                  onClick={() => {
                    setActiveViolationModal(null);
                    handleSwitchUser('user-c');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-400/15 hover:bg-emerald-400/25 text-emerald-400 border border-emerald-500/50 shadow-glow-emerald cursor-pointer"
                >
                  <span>Proceed to Stage 04: Switch to User C (2/2 Consensus)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
