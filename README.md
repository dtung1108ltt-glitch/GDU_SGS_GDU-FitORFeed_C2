# Dual-Control Expense Desk (Powered by TideCloak)

> **Cryptographically Enforced Treasury Consensus — Eliminating the "Rogue Admin" Single Point of Failure**

## Vision & Originality
Corporate treasuries, startups, and DAOs face a critical vulnerability: single points of failure in expense management. Traditional Role-Based Access Control (RBAC) systems store approval states as mutable database flags that a super-administrator or compromised backend can easily bypass.

The **Dual-Control Expense Desk** decentralizes financial approvals so that **no single entity—not even a system administrator—holds unilateral power to release funds**. Every transaction mathematically requires **two independent, cryptographically verified approvals (`2/2`)** from distinct TideCloak identities before execution.

---

## The 4-Step Interactive Storytelling Prototype

The web application includes a guided 4-step storytelling bar and instant persona switching between **User A**, **User B**, and **User C**:

1. **Step 1 — Initialization (`User A: Alice Vance, Operations Lead`)**
   - User A submits a critical vendor expense request (e.g., `$48,500 USDC` to *CloudScale Sovereign Compute Ltd.*).
   - The canonical expense payload digest (SHA-256) is locked for threshold signing (`0/2 approvals`).
2. **Step 2 — First Approval (`User B: Bob Sterling, Treasury Signer & SysAdmin`)**
   - User B reviews the request and signs the first approval using their WebCrypto ECDSA P-256 key bound to their TideCloak identity (`1/2 approvals`).
3. **Step 3 — The Constraint Check (`Malicious Double-Approve / Rogue Admin Attempt`)**
   - User B attempts to approve the request a second time (or use `SysAdmin DB Bypass`) to force the payout through unilaterally.
   - **TideCloak immediately blocks the action (`TIDECLOAK_ERR_DUPLICATE_IDENTITY_SHARE` / `TIDECLOAK_ERR_UNILATERAL_ADMIN_OVERRIDE_BLOCKED`)** because the signing key thumbprint and subject DID collide with Share #1.
4. **Step 4 — Consensus (`User C: Clara Chen, CFO`)**
   - User C logs in and provides the independent second cryptographic approval (`2/2 approvals`).
   - TideCloak verifies both distinct ECDSA signatures over the canonical expense digest, mints the **Threshold Execution Certificate**, and releases the treasury funds.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build
```

## Key Prototype Files
- [`src/lib/tidecloakEngine.ts`](src/lib/tidecloakEngine.ts) — WebCrypto ECDSA P-256 key generation, canonical expense digest hashing, and TideCloak 2-of-N dual-control policy enforcement engine.
- [`src/App.tsx`](src/App.tsx) — Interactive Dual-Control Expense Desk UI, 4-step storytelling walkthrough bar, persona switcher, cryptographic violation inspector, and live TideCloak Enclave telemetry stream.
