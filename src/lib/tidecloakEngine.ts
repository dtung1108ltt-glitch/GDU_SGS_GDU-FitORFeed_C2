export type UserId = 'user-a' | 'user-b' | 'user-c';

export interface TideCloakUser {
  id: UserId;
  label: string;
  name: string;
  title: string;
  avatarInitials: string;
  colorClass: string;
  badgeColor: string;
  tidecloakSub: string;
  keyId: string;
  roles: string[];
  canSubmit: boolean;
  canApprove: boolean;
  isSuperAdmin?: boolean;
  storyRole: string;
}

export interface CryptographicApproval {
  approverId: UserId;
  approverName: string;
  approverSub: string;
  keyId: string;
  publicKeyThumbprint: string;
  signatureHex: string;
  payloadHashHex: string;
  timestamp: string;
  tidecloakShareIndex: number;
}

export interface PolicyViolationEvent {
  id: string;
  expenseId: string;
  actorId: UserId;
  actorName: string;
  actorSub: string;
  actorKeyId: string;
  attemptType: 'DUPLICATE_APPROVAL' | 'ADMIN_DB_BYPASS' | 'SELF_APPROVAL' | 'UNAUTHORIZED_ROLE';
  errorCode: string;
  title: string;
  reason: string;
  technicalDetail: string;
  timestamp: string;
}

export interface ExpenseRequest {
  id: string;
  title: string;
  vendor: string;
  category: string;
  amount: number;
  currency: string;
  recipientWallet: string;
  description: string;
  requesterId: UserId;
  requesterName: string;
  requesterSub: string;
  createdAt: string;
  status: 'PENDING_FIRST_APPROVAL' | 'PARTIALLY_APPROVED_1_OF_2' | 'EXECUTED_2_OF_2';
  approvals: CryptographicApproval[];
  violations: PolicyViolationEvent[];
  executionCertificate?: {
    certificateId: string;
    combinedThresholdProof: string;
    executedAt: string;
    signers: string[];
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'SECURITY_BLOCK' | 'CRYPTO_VERIFY';
  actor: string;
  action: string;
  details: string;
  codeSnippet?: string;
}

export const TIDECLOAK_USERS: Record<UserId, TideCloakUser> = {
  'user-a': {
    id: 'user-a',
    label: 'User A',
    name: 'Alice Vance',
    title: 'Operations Lead',
    avatarInitials: 'AV',
    colorClass: 'from-sky-500 to-blue-600',
    badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    tidecloakSub: 'tc:did:enclave:9f82a10c-alice-v',
    keyId: 'tc-key-ecdsa-p256-alice-01',
    roles: ['expense:requester', 'treasury:viewer'],
    canSubmit: true,
    canApprove: false,
    storyRole: 'Step 1: Submits Expense Request',
  },
  'user-b': {
    id: 'user-b',
    label: 'User B',
    name: 'Bob Sterling',
    title: 'Treasury Signer & SysAdmin',
    avatarInitials: 'BS',
    colorClass: 'from-amber-500 to-orange-600',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    tidecloakSub: 'tc:did:enclave:4b71e92d-bob-s',
    keyId: 'tc-key-ecdsa-p256-bob-02',
    roles: ['expense:approver', 'system:superadmin', 'db:root'],
    canSubmit: true,
    canApprove: true,
    isSuperAdmin: true,
    storyRole: 'Step 2 & 3: Approves 1/2, Then Attempts 2nd Approval',
  },
  'user-c': {
    id: 'user-c',
    label: 'User C',
    name: 'Clara Chen',
    title: 'Chief Financial Officer (CFO)',
    avatarInitials: 'CC',
    colorClass: 'from-emerald-500 to-teal-600',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    tidecloakSub: 'tc:did:enclave:7c39d44f-clara-c',
    keyId: 'tc-key-ecdsa-p256-clara-03',
    roles: ['expense:approver', 'treasury:executive'],
    canSubmit: false,
    canApprove: true,
    storyRole: 'Step 4: Provides Independent 2/2 Consensus',
  },
};

interface KeyMaterial {
  keyPair: CryptoKeyPair;
  thumbprint: string;
  jwkPublic: JsonWebKey;
}

const userKeyStore: Partial<Record<UserId, KeyMaterial>> = {};

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function initializeTideCloakKeys(): Promise<Record<UserId, { thumbprint: string; jwkPublic: JsonWebKey }>> {
  const result = {} as Record<UserId, { thumbprint: string; jwkPublic: JsonWebKey }>;
  const userIds: UserId[] = ['user-a', 'user-b', 'user-c'];

  for (const uid of userIds) {
    if (!userKeyStore[uid]) {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        true,
        ['sign', 'verify']
      );
      const jwkPublic = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
      const rawPub = new TextEncoder().encode(`${uid}:${jwkPublic.x}:${jwkPublic.y}`);
      const hashBuf = await window.crypto.subtle.digest('SHA-256', rawPub);
      const thumbprint = `tc-fp:${bufferToHex(hashBuf).slice(0, 24)}`;
      userKeyStore[uid] = { keyPair, thumbprint, jwkPublic };
    }
    result[uid] = {
      thumbprint: userKeyStore[uid]!.thumbprint,
      jwkPublic: userKeyStore[uid]!.jwkPublic,
    };
  }
  return result;
}

export function getCanonicalExpensePayload(expense: Pick<ExpenseRequest, 'id' | 'vendor' | 'amount' | 'currency' | 'recipientWallet' | 'requesterSub'>): string {
  return JSON.stringify({
    policy: 'TC-DUAL-CONTROL-2OFN-V1',
    expenseId: expense.id,
    vendor: expense.vendor,
    amount: expense.amount,
    currency: expense.currency,
    recipientWallet: expense.recipientWallet,
    requesterSub: expense.requesterSub,
  });
}

export async function evaluateTideCloakApproval(
  user: TideCloakUser,
  expense: ExpenseRequest,
  attemptMode: 'NORMAL_APPROVE' | 'FORCE_ADMIN_BYPASS' = 'NORMAL_APPROVE'
): Promise<
  | {
      allowed: true;
      approval: CryptographicApproval;
      executionCertificate?: ExpenseRequest['executionCertificate'];
    }
  | {
      allowed: false;
      violation: PolicyViolationEvent;
    }
> {
  await initializeTideCloakKeys();
  const keyMat = userKeyStore[user.id]!;
  const now = new Date().toISOString();

  // Check 1: Does the user hold the approver role?
  if (!user.canApprove && attemptMode === 'NORMAL_APPROVE') {
    return {
      allowed: false,
      violation: {
        id: `viol-${Date.now()}`,
        expenseId: expense.id,
        actorId: user.id,
        actorName: user.name,
        actorSub: user.tidecloakSub,
        actorKeyId: user.keyId,
        attemptType: 'UNAUTHORIZED_ROLE',
        errorCode: 'TIDECLOAK_ERR_MISSING_CAPABILITY',
        title: 'Access Denied: Missing Cryptographic Approver Capability',
        reason: `${user.name} (${user.label}) only holds [expense:requester] credentials and does not possess a TideCloak threshold signing share.`,
        technicalDetail: `Policy TC-DUAL-CONTROL-2OFN-V1 requires capability "expense:approver" bound to an active enclave key share. Subject ${user.tidecloakSub} rejected.`,
        timestamp: now,
      },
    };
  }

  // Check 2: Separation of duties (Requester cannot approve their own request)
  if (expense.requesterSub === user.tidecloakSub) {
    return {
      allowed: false,
      violation: {
        id: `viol-${Date.now()}`,
        expenseId: expense.id,
        actorId: user.id,
        actorName: user.name,
        actorSub: user.tidecloakSub,
        actorKeyId: user.keyId,
        attemptType: 'SELF_APPROVAL',
        errorCode: 'TIDECLOAK_ERR_SEPARATION_OF_DUTIES',
        title: 'Access Denied: Self-Approval Prohibited',
        reason: `Initiator (${user.name}) cannot cryptographically co-sign their own expense request.`,
        technicalDetail: `Enclave assertion failed: signer.sub (${user.tidecloakSub}) === payload.requesterSub (${expense.requesterSub}).`,
        timestamp: now,
      },
    };
  }

  // Check 3: Admin Force Bypass attempt
  if (attemptMode === 'FORCE_ADMIN_BYPASS') {
    return {
      allowed: false,
      violation: {
        id: `viol-${Date.now()}`,
        expenseId: expense.id,
        actorId: user.id,
        actorName: user.name,
        actorSub: user.tidecloakSub,
        actorKeyId: user.keyId,
        attemptType: 'ADMIN_DB_BYPASS',
        errorCode: 'TIDECLOAK_ERR_UNILATERAL_ADMIN_OVERRIDE_BLOCKED',
        title: 'Access Denied: SuperAdmin Unilateral Override Blocked by TideCloak',
        reason: `${user.name} (${user.label}) attempted to use [system:superadmin / db:root] privileges to force-execute the payout without a 2nd distinct cryptographic approval.`,
        technicalDetail: `Database status flags cannot release funds. TideCloak Threshold Enclave requires k=2 distinct ECDSA/Threshold key shares over digest(payload). Current valid shares: ${expense.approvals.length}/2 (only [${user.keyId}] present). Missing 2nd independent identity key share.`,
        timestamp: now,
      },
    };
  }

  // Check 4: Duplicate Approval / Constraint Check (Step 3 in Storytelling!)
  const existingFromSameIdentity = expense.approvals.find(
    (a) => a.approverSub === user.tidecloakSub || a.publicKeyThumbprint === keyMat.thumbprint
  );

  if (existingFromSameIdentity) {
    return {
      allowed: false,
      violation: {
        id: `viol-${Date.now()}`,
        expenseId: expense.id,
        actorId: user.id,
        actorName: user.name,
        actorSub: user.tidecloakSub,
        actorKeyId: user.keyId,
        attemptType: 'DUPLICATE_APPROVAL',
        errorCode: 'TIDECLOAK_ERR_DUPLICATE_IDENTITY_SHARE',
        title: 'Access Denied: Duplicate Identity Signature Rejected (Dual-Control Constraint)',
        reason: `${user.name} (${user.label}) has already signed this request (1/2). TideCloak strictly blocks the same identity from supplying the second approval share.`,
        technicalDetail: `Cryptographic collision detected in Policy [TC-DUAL-CONTROL-2OFN-V1]: Signer sub "${user.tidecloakSub}" (Key Thumbprint ${keyMat.thumbprint}) already contributed Share #1 (${existingFromSameIdentity.signatureHex.slice(0, 20)}...). Threshold reconstruction requires 2 mathematically distinct identity keys (Lagrange interpolation fails on identical x-coordinates).`,
        timestamp: now,
      },
    };
  }

  // Perform real Web Crypto ECDSA P-256 signing & verification
  const canonicalPayload = getCanonicalExpensePayload(expense);
  const payloadBytes = new TextEncoder().encode(canonicalPayload);
  const payloadHashBuffer = await window.crypto.subtle.digest('SHA-256', payloadBytes);
  const payloadHashHex = bufferToHex(payloadHashBuffer);

  const signatureBuffer = await window.crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    keyMat.keyPair.privateKey,
    payloadBytes
  );

  // Verify the signature inside the simulated TideCloak Enclave
  const isVerified = await window.crypto.subtle.verify(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    keyMat.keyPair.publicKey,
    signatureBuffer,
    payloadBytes
  );

  if (!isVerified) {
    throw new Error('Cryptographic signature verification failed.');
  }

  const signatureHex = bufferToHex(signatureBuffer);
  const shareIndex = expense.approvals.length + 1;

  const newApproval: CryptographicApproval = {
    approverId: user.id,
    approverName: user.name,
    approverSub: user.tidecloakSub,
    keyId: user.keyId,
    publicKeyThumbprint: keyMat.thumbprint,
    signatureHex: `0x${signatureHex}`,
    payloadHashHex: `0x${payloadHashHex}`,
    timestamp: now,
    tidecloakShareIndex: shareIndex,
  };

  const allApprovals = [...expense.approvals, newApproval];
  let executionCertificate: ExpenseRequest['executionCertificate'] | undefined;

  if (allApprovals.length >= 2) {
    // Combine both distinct signatures to produce the final TideCloak Threshold Execution Certificate
    const combinedInput = new TextEncoder().encode(
      `${payloadHashHex}:${allApprovals[0].signatureHex}:${allApprovals[1].signatureHex}`
    );
    const certBuffer = await window.crypto.subtle.digest('SHA-256', combinedInput);
    const certHex = bufferToHex(certBuffer);

    executionCertificate = {
      certificateId: `TC-EXEC-${certHex.slice(0, 12).toUpperCase()}`,
      combinedThresholdProof: `0x${certHex}`,
      executedAt: now,
      signers: allApprovals.map((a) => `${a.approverName} (${a.approverSub})`),
    };
  }

  return {
    allowed: true,
    approval: newApproval,
    executionCertificate,
  };
}
