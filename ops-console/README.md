# Governed Payments — Operator Console

A React/Vite operator console for the AI-governed agentic payments prototype. Provides real-time visibility into the delegation chain, approval workflows, task lifecycle, and control plane configuration.

Built with React 19, Vite 7, Tailwind CSS 4, React Router, and React Icons.

---

## Quick Start

### Prerequisites

- Node.js >= 20
- Python 3.10+ (for the FastAPI backend)
- The backend must be running before the frontend can fetch data

### 1. Start the Backend (FastAPI)

From the project root (`governed_payments/`):

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

uvicorn api_server:app --reload --port 8000
```

Verify it's running:

```sh
curl http://localhost:8000/api/health
# → {"ok": true, "version": "2026-04-25.1"}
```

### 2. Start the Frontend (Vite)

In a second terminal, from the `ops-console/` directory:

```sh
cd ops-console
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

The Vite dev server proxies all `/api/*` requests to the FastAPI backend on port 8000.

---

## Running the Demo

### Step 1 — Seed demo scenarios

Click the **"Seed demos"** button in the top-right header bar. This submits three pre-built payment scenarios from `demo.py`:

| Scenario | Amount | Behavior |
|----------|--------|----------|
| Happy path | $350 USD | Passes validation, pauses at `awaiting_approval` for operator sign-off |
| Authority violation | $600 USD | Exceeds the delegation token's spend limit, fails at policy check |
| Revoked token | $200 USD | Uses a revoked delegation token, blocked immediately |

### Step 2 — Trust Graph

Navigate to **Trust Graph** in the sidebar. This view shows the full delegation chain:

```
Root (authorization issuer)
  └── Principal (token holder)
        └── Parent Agent (orchestrator)
              └── Sub-Agent (worker)
                    └── Tools (capabilities)
```

Each delegation token displays an **authority bar** showing spent vs. spend_limit (Article 3 / MDP). Revoked tokens appear in red.

### Step 3 — Approval Queue

Navigate to **Approval Queue**. The $350 happy-path task is paused at `awaiting_approval`.

1. Enter an operator name (defaults to `ops_admin`)
2. Click **Approve**
3. The system re-validates release policy and resumes the workflow through releasing, settlement, and reconciliation

### Step 4 — Task Explorer

Navigate to **Task Explorer**. Select any task from the left panel to inspect:

- **Snapshot** — current state from `context_memory_service` (amount, merchant, wallets, token, liability owner)
- **Delegated Work** — work records showing which agent delegated what action to which sub-agent
- **Provenance Log** — the full append-only evidence chain with state transitions, policy decisions, capability results, and delegation records. Expand any record to see raw JSON.

### Step 5 — Control Plane

Navigate to **Control Plane** to see the system configuration:

- **Status** — API version and kill switch state
- **Rail Controls** — max amount, approval threshold, supported currencies, timeouts
- **Capabilities Registry** — all registered capabilities with side-effect and idempotency flags
- **Agents Registry** — registered agents, their roles, and permitted actions

Toggle the **kill switch** to block all new payment intake. Disable it to resume processing.

---

## Architecture

### System Overview

The operator console is the UI layer (Level 2) over a 7-service Python prototype that implements AI-governed agentic payments with deterministic policy enforcement, delegation-based authority, and append-only provenance.

```
┌─────────────────────────────────────────────────────────────┐
│                    Operator Console (React)                  │
│   Trust Graph │ Approval Queue │ Task Explorer │ Ctrl Plane  │
└──────────────────────────┬──────────────────────────────────┘
                           │  /api/*  (HTTP)
┌──────────────────────────▼──────────────────────────────────┐
│                   API Server (FastAPI)                        │
│              Thin wrapper — no business logic                │
└──┬───────┬──────────┬───────────┬────────┬──────────┬───────┘
   │       │          │           │        │          │
   ▼       ▼          ▼           ▼        ▼          ▼
Control  Policy   Capability   Context  Provenance  Workflow
 Plane   Engine    Gateway     Memory    Service     Worker
```

### Service Boundaries

| Service | File | Responsibility |
|---------|------|----------------|
| **Control Plane** | `control_plane.py` | System-wide configuration, capability and agent registries, kill switch. Read-only source of truth consumed by all other services. |
| **Policy Engine** | `policy_engine.py` | Deterministic policy decisions — validates amounts, currencies, token authority, beneficiary status. No side effects. |
| **Capability Gateway** | `capability_gateway.py` | Typed wrappers around external capabilities (beneficiary check, release funds, reconcile). Enforces idempotency, retry logic, and side-effect tracking. |
| **Context Memory** | `context_memory.py` | Current task state snapshot and outbox. Single source of truth for "where is this task right now." |
| **Provenance** | `provenance.py` | Append-only evidence log. Every state transition, policy decision, capability result, and delegation is recorded immutably. |
| **Workflow Worker** | `workflow_worker.py` | Lifecycle execution — drives a task through its state machine (validate → approve → release → settle → reconcile). |
| **Orchestrator** | `orchestrator.py` | Intake and coordination — receives payment requests, validates against control plane, creates tasks, and dispatches to the workflow worker. |
| **API Server** | `api_server.py` | FastAPI HTTP layer exposing all services to the operator console. Intentionally thin — delegates all logic to the service modules. |

### Key Concepts

**Delegation Tokens (Article 3 / MDP)**
Authority flows from Root → Principal → Agent → Sub-Agent via delegation tokens. Each token carries:
- `spend_limit` — maximum cumulative amount
- `spent` — amount consumed so far
- `depth_remaining` — how many more levels of delegation are allowed
- `currency_restriction` — which currencies the token permits
- `revoked` — whether the token has been invalidated

**State Machine**
Each payment task follows a deterministic state machine:
```
received → awaiting_validation → awaiting_approval → approved
  → releasing → settlement_pending → settled → pending_reconcile
```
Tasks can transition to `failed` or `exception` from any state.

**Provenance Records**
Three types of evidence are recorded:
- `state_transition` — from/to state with liability assignment
- `artifact` — policy decisions, capability results
- `delegation` — agent-to-agent work delegation with status

### API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Liveness check + control plane version |
| GET | `/api/control-plane` | Full snapshot (rails + registries) |
| POST | `/api/control-plane/kill-switch` | Toggle the kill switch |
| GET | `/api/tokens` | Delegation tokens + remaining authority |
| GET | `/api/trust-graph` | Root → Principal → Agent → Sub-Agent chain |
| GET | `/api/tasks` | All tasks (current snapshot) |
| GET | `/api/tasks/awaiting-approval` | Filtered queue for operator approval |
| GET | `/api/tasks/{id}` | Snapshot + provenance + delegations |
| POST | `/api/tasks/{id}/approve` | Operator resume (re-validates policy) |
| POST | `/api/payments/submit` | Submit a new payment |
| POST | `/api/seed` | Submit the three demo scenarios |

### Frontend Structure

```
ops-console/
├── index.html                    HTML shell with Inter font
├── package.json                  React 19, Vite 7, Tailwind 4, React Router
├── vite.config.js                Dev server + /api proxy to :8000
├── tailwind.config.js            Dark theme color palette
├── postcss.config.js             Tailwind PostCSS plugin
└── src/
    ├── main.jsx                  App bootstrap with BrowserRouter
    ├── App.jsx                   Layout: Header + Sidebar + routed views
    ├── index.css                 Tailwind imports + CSS custom properties
    ├── api.js                    Typed client for all FastAPI endpoints
    ├── components/
    │   ├── Header.jsx            Top bar: branding, health status, seed button
    │   ├── Sidebar.jsx           Left nav with route links and icons
    │   ├── StateBadge.jsx        Color-coded state pill (maps state → color)
    │   └── AuthorityBar.jsx      Spend vs limit progress bar per token
    └── views/
        ├── TrustGraph.jsx        Delegation tree with authority visualization
        ├── ApprovalQueue.jsx     Task approval table with operator input
        ├── TaskExplorer.jsx      Task list + detail panel + provenance timeline
        └── ControlPlaneSummary.jsx  Registries, rail controls, kill switch

Routes:
  /                → Trust Graph
  /approve         → Approval Queue
  /explorer        → Task Explorer
  /control-plane   → Control Plane
```

### Architecture Mapping (vs nkhatu/control-architecture)

| Reference repo | This prototype |
|----------------|----------------|
| `apps/control-plane` | `control_plane.py` |
| `apps/policy-engine` | `policy_engine.py` |
| `apps/orchestrator-api` | `orchestrator.py` + `api_server.py` |
| `apps/capability-gateway` | `capability_gateway.py` |
| `services/context-memory-service` | `context_memory.py` |
| `services/provenance-service` | `provenance.py` |
| `services/workflow-worker` | `workflow_worker.py` |
| `packages/shared-contracts` | `models.py` |
| `apps/operator-console` (UI) | `ops-console/` |
