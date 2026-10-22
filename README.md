[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

## Project overview

_A treasury desk where nobody (requester, approver or sysadmin) can release a large payment alone._

Built with [TideCloak](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked).

### 1. Vision & originality
Every "four-eyes" payment control today ends in a database row the platform operator can edit. Insider fraud succeeds because one superuser can flip `approved=true` or make themselves an approver. We make dual control a property of identity, not of the app: release authority belongs to people whose logins and roles no operator can forge. Small finance teams, NGOs and startups get bank-grade separation of duties without trusting their IT admin, their SaaS vendor, or us.

### 2. Trust constraint insight
Today you must trust whoever runs the server: an admin can impersonate an approver, grant themselves the role, or skip the check. Remove that constraint and finance tooling can be run by an admin who has nothing to steal.

### 3. Value & impact
Example: someone with root access pushes a $48,500 "vendor" payment during a holiday. One approval leaves the funds locked. A duplicate approval, a self-approval or an admin force-release is refused. Only a second, different approver releases the payment.

### 4. Why TideCloak matters
Tide logins mean no admin holds passwords to impersonate anyone. The `expense-approver` role sits under TideCloak Quorum-Enforced Governance, so an admin who grants it only creates a change request for the quorum to approve. With ordinary RBAC, one admin can do both. Honest scope: the two-distinct-approvers check runs in our client today. The next step is a Forseti policy on Tide's ORKs.

### 5. Prototype & storytelling
(1) Alice submits; (2) Bob approves, 1/2; (3) Bob's re-approval and his SysAdmin force-release are both blocked; (4) Clara approves and the payment is released. LIVE mode uses `@tidecloak/react`. Without `public/tidecloak.json`, a labelled offline simulation runs. Video: [demo/demo.mp4](demo/demo.mp4).

## Setup
`npm install && npm run dev`. LIVE mode: [docs/SETUP.md](docs/SETUP.md).
