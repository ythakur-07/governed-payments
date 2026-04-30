const SERVICES = [
  {
    name: "Control Plane",
    file: "control_plane.py",
    role: "Configuration Authority",
    color: "var(--accent-2)",
    responsibility:
      "System-wide configuration hub. Publishes the capability registry, agent registry, rail controls (max amounts, approval thresholds, timeouts), and the kill switch. Every other service reads from the control plane \u2014 it never reads from them.",
    enforces: "System boundaries, capability permissions, agent roles, emergency shutdown",
    impact: "Single source of truth. If the control plane says stop, everything stops.",
  },
  {
    name: "Policy Engine",
    file: "policy_engine.py",
    role: "Deterministic Decision Maker",
    color: "var(--accent)",
    responsibility:
      "Makes binary pass/fail decisions on payment requests. Validates token authority (spend limits, delegation depth, revocation status), merchant allowlists, currency restrictions, and amount thresholds. Purely deterministic \u2014 no AI, no probabilistic reasoning.",
    enforces: "Spend limits, merchant restrictions, currency constraints, approval thresholds",
    impact: "Every payment must pass policy. Rejected payments cannot proceed regardless of any other system state.",
  },
  {
    name: "Capability Gateway",
    file: "capability_gateway.py",
    role: "External Rail Interface",
    color: "var(--warn)",
    responsibility:
      "Typed wrappers around external capabilities: beneficiary validation, payment release (with retry and idempotency), reconciliation, and status checks. Tracks which capabilities have side effects and enforces idempotency keys to prevent duplicate operations.",
    enforces: "Idempotency, retry logic, side-effect tracking, capability type safety",
    impact: "The only component that touches external systems. All side effects are controlled and recorded here.",
  },
  {
    name: "Context Memory",
    file: "context_memory.py",
    role: "Current State Store",
    color: "var(--accent-2)",
    responsibility:
      "Maintains the current snapshot of every task \u2014 its state, amount, merchant, wallets, assigned agent, token, and liability owner. Provides the \"where is this task right now\" answer. Supports an outbox pattern for reliable state publication.",
    enforces: "State consistency, single source of current task truth",
    impact: "The Task Explorer reads directly from context memory. Every state write goes through this service.",
  },
  {
    name: "Provenance Service",
    file: "provenance.py",
    role: "Append-Only Evidence Ledger",
    color: "var(--accent)",
    responsibility:
      "Records every action immutably: state transitions (with liability assignment), policy decisions (with reasons), capability results (with outcomes), and agent-to-agent delegations. Nothing is overwritten or deleted \u2014 the log only grows.",
    enforces: "Immutability, complete audit trail, non-repudiation",
    impact: "The provenance log in Task Explorer comes from this service. It proves exactly what happened, when, by whom, and why.",
  },
  {
    name: "Workflow Worker",
    file: "workflow_worker.py",
    role: "Lifecycle Executor",
    color: "var(--warn)",
    responsibility:
      "Drives each task through its state machine: validate \u2192 approve \u2192 release \u2192 settle \u2192 reconcile. Orchestrates calls to the policy engine, capability gateway, context memory, and provenance at each step. Handles the pause-and-resume pattern for human approval.",
    enforces: "State machine integrity, correct sequencing of operations",
    impact: "The engine that moves payments forward. When you click Approve, the workflow worker resumes execution.",
  },
  {
    name: "Orchestrator",
    file: "orchestrator.py",
    role: "Intake & Coordination",
    color: "var(--accent-2)",
    responsibility:
      "Receives payment requests, checks the kill switch, validates against the control plane, creates tasks in context memory, mints delegation records, and dispatches to the workflow worker. Also handles the resume-after-approval flow.",
    enforces: "Intake validation, kill switch blocking, task creation",
    impact: "The front door. Every payment enters through the orchestrator. If the kill switch is active, payments are rejected here.",
  },
  {
    name: "API Server",
    file: "api_server.py",
    role: "HTTP Interface Layer",
    color: "var(--muted)",
    responsibility:
      "FastAPI wrapper that exposes all service boundaries as REST endpoints. Intentionally thin \u2014 it serializes data and delegates all logic to the service modules. Provides the operator console's read and write APIs.",
    enforces: "HTTP contract, CORS, request validation",
    impact: "Everything you see in this console comes through the API server. It adds no business logic of its own.",
  },
];

const PRINCIPLES = [
  {
    title: "Deterministic Policy, Not AI Judgment",
    description:
      "The policy engine makes binary decisions based on explicit rules. No LLM, no probabilistic reasoning. When policy says no, it means no \u2014 and the reason is recorded in provenance.",
  },
  {
    title: "Append-Only Evidence",
    description:
      "Every state transition, policy decision, capability result, and delegation is recorded immutably. The provenance log cannot be edited or deleted, creating a complete, tamper-evident audit trail.",
  },
  {
    title: "Delegation-Based Authority (Article 3 / MDP)",
    description:
      "Agents don't have inherent permissions. Authority flows through delegation tokens with explicit spend limits, merchant restrictions, and depth constraints. Revoking a token instantly cuts off all downstream authority.",
  },
  {
    title: "Human-in-the-Loop at Boundaries",
    description:
      "High-value payments automatically pause for operator approval. The system doesn't bypass the human \u2014 it waits, and the approval (or lack thereof) is recorded as evidence.",
  },
  {
    title: "Thin API, Thick Services",
    description:
      "The API server is intentionally stateless and logic-free. All business rules live in the service modules. This means the same policy engine that governs API requests could govern a CLI, a batch job, or an agent swarm.",
  },
];

const MAPPING = [
  { reference: "apps/control-plane", prototype: "control_plane.py" },
  { reference: "apps/policy-engine", prototype: "policy_engine.py" },
  { reference: "apps/orchestrator-api", prototype: "orchestrator.py + api_server.py" },
  { reference: "apps/capability-gateway", prototype: "capability_gateway.py" },
  { reference: "services/context-memory-service", prototype: "context_memory.py" },
  { reference: "services/provenance-service", prototype: "provenance.py" },
  { reference: "services/workflow-worker", prototype: "workflow_worker.py" },
  { reference: "packages/shared-contracts", prototype: "models.py" },
  { reference: "apps/operator-console (UI)", prototype: "ops-console/" },
];

export default function Architecture() {
  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
          System Architecture
        </h2>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>
          The governed payments system is a 7-service prototype implementing AI-governed agentic
          payments with deterministic policy enforcement, delegation-based authority, and append-only
          provenance. Each service owns a single responsibility and communicates through explicit contracts.
        </p>
      </div>

      {/* System Overview Diagram */}
      <div
        className="rounded-lg border p-5 mb-6"
        style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
      >
        <h3 className="text-[11px] uppercase tracking-wide font-medium mb-4" style={{ color: "var(--muted)" }}>
          System Overview
        </h3>

        {/* Visual Architecture */}
        <div className="space-y-3">
          {/* UI Layer */}
          <div
            className="rounded-lg p-3 text-center text-sm font-medium"
            style={{ backgroundColor: "var(--panel-2)", border: "1px solid var(--accent-2)", color: "var(--accent-2)" }}
          >
            Operator Console (React/Vite) — Trust Graph | Approval Queue | Task Explorer | Control Plane
          </div>

          {/* Arrow */}
          <div className="text-center text-xs font-mono" style={{ color: "var(--muted)" }}>
            /api/* (HTTP)
          </div>

          {/* API Layer */}
          <div
            className="rounded-lg p-3 text-center text-sm font-medium"
            style={{ backgroundColor: "var(--panel-2)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            API Server (FastAPI) — thin wrapper, no business logic
          </div>

          {/* Arrow */}
          <div className="text-center text-xs font-mono" style={{ color: "var(--muted)" }}>
            in-process calls
          </div>

          {/* Service Layer */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {[
              { name: "Control\nPlane", color: "var(--accent-2)" },
              { name: "Policy\nEngine", color: "var(--accent)" },
              { name: "Capability\nGateway", color: "var(--warn)" },
              { name: "Orchestrator", color: "var(--accent-2)" },
              { name: "Context\nMemory", color: "var(--accent-2)" },
              { name: "Provenance\nService", color: "var(--accent)" },
              { name: "Workflow\nWorker", color: "var(--warn)" },
            ].map((s) => (
              <div
                key={s.name}
                className="rounded-md p-2.5 text-center text-xs font-medium whitespace-pre-line"
                style={{ backgroundColor: "var(--panel-2)", border: `1px solid ${s.color}`, color: s.color }}
              >
                {s.name}
              </div>
            ))}
          </div>

          {/* Data Layer */}
          <div className="text-center text-xs font-mono" style={{ color: "var(--muted)" }}>
            shared contracts (models.py)
          </div>
        </div>
      </div>

      {/* Service Breakdown */}
      <h3
        className="text-[11px] uppercase tracking-wide font-medium mb-4 px-1"
        style={{ color: "var(--muted)" }}
      >
        Service Boundaries
      </h3>

      <div className="space-y-4 mb-8">
        {SERVICES.map((s) => (
          <div
            key={s.name}
            className="rounded-lg border p-5"
            style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <h4 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {s.name}
                </h4>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{ color: s.color, border: `1px solid ${s.color}` }}>
                  {s.role}
                </span>
              </div>
              <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>{s.file}</span>
            </div>

            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
              {s.responsibility}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                className="rounded-md px-3 py-2 text-xs"
                style={{ backgroundColor: "var(--panel-2)", border: "1px solid var(--border)" }}
              >
                <span className="font-medium" style={{ color: "var(--text)" }}>Enforces: </span>
                <span style={{ color: "var(--muted)" }}>{s.enforces}</span>
              </div>
              <div
                className="rounded-md px-3 py-2 text-xs"
                style={{ backgroundColor: "var(--panel-2)", border: "1px solid var(--border)" }}
              >
                <span className="font-medium" style={{ color: "var(--text)" }}>Impact: </span>
                <span style={{ color: "var(--muted)" }}>{s.impact}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Design Principles */}
      <h3
        className="text-[11px] uppercase tracking-wide font-medium mb-4 px-1"
        style={{ color: "var(--muted)" }}
      >
        Design Principles
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {PRINCIPLES.map((p, i) => (
          <div
            key={i}
            className="rounded-lg border p-4"
            style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
          >
            <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>
              {p.title}
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
              {p.description}
            </p>
          </div>
        ))}
      </div>

      {/* Architecture Mapping */}
      <div
        className="rounded-lg border p-5 mb-4"
        style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
      >
        <h3 className="text-[11px] uppercase tracking-wide font-medium mb-3" style={{ color: "var(--muted)" }}>
          Architecture Mapping (vs nkhatu/control-architecture)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wide font-medium"
                  style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                  Reference Repo
                </th>
                <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wide font-medium"
                  style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                  This Prototype
                </th>
              </tr>
            </thead>
            <tbody>
              {MAPPING.map((m) => (
                <tr key={m.reference} className="transition-colors hover:bg-[--panel-2]">
                  <td className="px-3 py-2 font-mono text-sm" style={{ borderBottom: "1px solid var(--border)" }}>
                    {m.reference}
                  </td>
                  <td className="px-3 py-2 font-mono text-sm" style={{ color: "var(--accent)", borderBottom: "1px solid var(--border)" }}>
                    {m.prototype}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
