# Governed Agentic Payments — Level 2 Operator Console

A live operator console over the existing 7-service Python prototype. Mirrors the
service-boundary structure of [nkhatu/control-architecture](https://github.com/nkhatu/control-architecture).

```
governed_payments/                ← this directory (project root)
├── control_plane.py              ← config + registry publisher
├── policy_engine.py              ← deterministic decisions
├── capability_gateway.py         ← typed rail wrappers
├── context_memory.py             ← current task snapshot + outbox
├── provenance.py                 ← append-only evidence + delegations
├── workflow_worker.py            ← lifecycle execution
├── orchestrator.py               ← intake / coordination
├── models.py                     ← shared contracts
├── demo.py                       ← Level 1 console demo
│
├── api_server.py                 ← Level 2: FastAPI wrapper exposing services to UI
├── requirements.txt              ← FastAPI + uvicorn + pydantic
│
└── ops-console/                  ← Level 2: React/Vite operator console
    ├── package.json
    └── src/
        ├── App.jsx               ← shell + sidebar navigation
        ├── api.js                ← typed client for the FastAPI backend
        ├── views/
        │   ├── TrustGraph.jsx          ← Root → Principal → Agent → Sub-Agent → Tool
        │   ├── ApprovalQueue.jsx       ← awaiting_approval + Approve action
        │   ├── TaskExplorer.jsx        ← snapshot + delegations + provenance log
        │   └── ControlPlaneSummary.jsx ← registry + kill switch + rail controls
        └── components/
            ├── StateBadge.jsx
            └── AuthorityBar.jsx        ← spent vs spend_limit (Article 3 / MDP)
```

## Run

### 1. Backend — FastAPI

```sh
# from inside governed_payments/
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

uvicorn api_server:app --reload --port 8000
```

Smoke test:

```sh
curl http://localhost:8000/api/health
curl -X POST http://localhost:8000/api/seed | python3 -m json.tool
```

### 2. Frontend — React/Vite

In a second terminal:

```sh
cd ops-console
npm install
npm run dev
```

Then open http://localhost:5173. The Vite dev server proxies `/api/*` to the FastAPI
backend on port 8000.

### 3. Demo flow

1. **Sidebar → "Seed demo scenarios"** — submits the three scenarios from `demo.py`
   (happy path $350, authority violation $600, revoked-token $200).
2. **Trust Graph** — see the delegation chain with live authority bars on each token.
3. **Approval Queue** — the $350 task is paused at `awaiting_approval`; click
   **Approve** to resume the workflow (re-runs release policy, releases via the
   capability gateway with retry).
4. **Task Explorer** — pick any task to see its current snapshot, delegated work
   records, and the full append-only provenance log.
5. **Control Plane** — flip the kill switch to confirm intake-time blocking; review
   the capability and agent registries.

## Endpoints

| Method | Path                                  | Purpose                                |
| ------ | ------------------------------------- | -------------------------------------- |
| GET    | `/api/health`                         | liveness + control plane version       |
| GET    | `/api/control-plane`                  | full snapshot (rails + registries)     |
| POST   | `/api/control-plane/kill-switch`      | toggle the kill switch                 |
| GET    | `/api/tokens`                         | delegation tokens + remaining authority|
| GET    | `/api/trust-graph`                    | Root → Principal → Agent → Sub-Agent   |
| GET    | `/api/tasks`                          | all tasks (current snapshot)           |
| GET    | `/api/tasks/awaiting-approval`        | filtered queue                         |
| GET    | `/api/tasks/{id}`                     | snapshot + provenance + delegations    |
| POST   | `/api/tasks/{id}/approve`             | operator resume (re-validates policy)  |
| POST   | `/api/payments/submit`                | submit a new payment                   |
| POST   | `/api/seed`                           | submit the three demo scenarios        |

## Architecture mapping (vs nkhatu/control-architecture)

| Reference repo                     | This prototype                    |
| ---------------------------------- | --------------------------------- |
| `apps/control-plane`               | `control_plane.py`                |
| `apps/policy-engine`               | `policy_engine.py`                |
| `apps/orchestrator-api`            | `orchestrator.py` + `api_server.py` |
| `apps/capability-gateway`          | `capability_gateway.py`           |
| `services/context-memory-service`  | `context_memory.py`               |
| `services/provenance-service`      | `provenance.py`                   |
| `services/workflow-worker`         | `workflow_worker.py`              |
| `packages/shared-contracts`        | `models.py`                       |
| `apps/operator-console` (UI)       | `ops-console/`                    |

The FastAPI server is intentionally thin — it wraps the existing service modules
without adding business logic. Policy still lives in `policy_engine`. State writes
still go through `context_memory`. Evidence is still append-only in `provenance`.
