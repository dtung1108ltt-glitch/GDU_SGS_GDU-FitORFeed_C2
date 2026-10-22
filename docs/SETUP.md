# Setup

## 1. Run (simulation mode, no server needed)

```bash
npm install
npm run dev        # http://localhost:5173
```

Without `public/tidecloak.json` the app starts in **SIMULATION MODE** (amber banner). Everything in that
mode (personas, ECDSA keys, the 2-of-2 check, the "enclave" telemetry) is simulated in the browser with
WebCrypto ([`src/lib/tidecloakEngine.ts`](../src/lib/tidecloakEngine.ts)).

## 2. LIVE mode (real TideCloak)

Uses the official [`@tidecloak/react`](https://www.npmjs.com/package/@tidecloak/react) SDK, wired the same
way as Tide's `react-vite-internal-dashboard` template ([`src/main.tsx`](../src/main.tsx),
[`src/tide/LiveRoot.tsx`](../src/tide/LiveRoot.tsx)).

1. Run a TideCloak realm (official quickstart: https://docs.tide.org/get-started/Tidecloak%20Quickstart), e.g.
   ```bash
   docker run --name mytidecloak -d -v .:/opt/keycloak/data/h2 -p 8080:8080 \
     -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=<choose-one> \
     tideorg/tidecloak-dev:latest
   ```
   License the realm, link the first admin's Tide account and **enable Quorum-Enforced Governance (IGA)**.
   Add a **second** `tide-realm-admin` so role changes need a real quorum.
2. Client: public OIDC client, redirect URI + web origin `http://localhost:5173`.
3. Realm roles: `expense-requester`, `expense-approver`. Users: `alice` (requester),
   `bob` (approver + admin), `clara` (approver). Approve/commit each role-grant change request.
4. Export the adapter JSON (provider `keycloak-oidc-keycloak-json`) to **`public/tidecloak.json`**
   (git-ignored), then `npm run dev`. The banner turns green: **LIVE MODE**.

Append `?mode=simulation` to the URL to open the offline demo while LIVE mode is configured.

## What LIVE mode enforces and where

| Guarantee | Enforced by |
|---|---|
| Users log in with Tide (no admin-held password, no impersonation) | TideCloak / Tide network |
| `expense-approver` role only via a quorum-approved change request | TideCloak IGA |
| 2 distinct approvers, no self-approval, no admin force-release | This prototype's client code ([`livePolicy.ts`](../src/tide/livePolicy.ts)) — production: backend JWT verification (`@tidecloak/verify`) or a Forseti contract on the ORKs |
| Payment rail, shared state | Mocked (`localStorage`) |

