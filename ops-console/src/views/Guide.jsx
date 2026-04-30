import { FiDatabase, FiGitBranch, FiCheckCircle, FiSearch, FiSliders } from "react-icons/fi";

const VIEWS = [
  {
    icon: FiGitBranch,
    title: "Trust Graph",
    route: "/",
    color: "var(--accent-2)",
    description:
      "Visualizes the full delegation chain from the Root Authorization Service down through Principals, Parent Agents, Sub-Agents, and their Tools. Each delegation token displays an authority bar showing how much of its spend limit has been consumed (spent vs. spend_limit). Revoked tokens appear in red.",
    tryIt:
      "After seeding, observe the hierarchy. Notice how tok_agent_001 has a $500 limit and tok_agent_002 is marked REVOKED.",
  },
  {
    icon: FiCheckCircle,
    title: "Approval Queue",
    route: "/approve",
    color: "var(--warn)",
    description:
      "Shows all tasks paused at the awaiting_approval state. When a payment exceeds the approval threshold ($250), the workflow halts and waits for an operator to explicitly approve it. Approval re-validates release policy before resuming.",
    tryIt:
      'Enter an operator name (or keep "ops_admin") and click Approve on the $350 task. Watch it progress through releasing, settlement, and reconciliation.',
  },
  {
    icon: FiSearch,
    title: "Task Explorer",
    route: "/explorer",
    color: "var(--accent)",
    description:
      "A two-panel inspector. The left panel lists all tasks with their current state. Select any task to see its full snapshot from context_memory (amount, merchant, wallets, token, liability owner) plus the append-only provenance log showing every state transition, policy decision, capability result, and delegation record.",
    tryIt:
      "Click on different tasks to compare outcomes. Expand the \"raw\" toggle on any provenance record to see the full evidence payload.",
  },
  {
    icon: FiSliders,
    title: "Control Plane",
    route: "/control-plane",
    color: "var(--accent-2)",
    description:
      "The system's read-only configuration registry. Shows rail controls (max amount, approval threshold, supported currencies, timeouts), the capabilities registry (what each rail can do, side effects, idempotency), and the agents registry (who can do what).",
    tryIt:
      "Toggle the kill switch to ACTIVE \u2014 this blocks all new payment intake. Disable it to resume. This demonstrates the control plane's system-wide authority.",
  },
];

const CONCEPTS = [
  {
    title: "Delegation Tokens (Article 3 / MDP)",
    description:
      "Authority flows via delegation tokens from Root \u2192 Principal \u2192 Agent \u2192 Sub-Agent. Each token carries a spend_limit, tracks spent amount, restricts currencies, and limits delegation depth. Tokens can be revoked instantly, cutting off all downstream authority.",
  },
  {
    title: "State Machine",
    description:
      "Every payment follows a deterministic state machine: received \u2192 awaiting_validation \u2192 awaiting_approval \u2192 approved \u2192 releasing \u2192 settlement_pending \u2192 settled \u2192 pending_reconcile. Tasks can transition to failed or exception from any state. Each transition is recorded in provenance.",
  },
  {
    title: "Append-Only Provenance",
    description:
      "Every action is recorded immutably \u2014 state transitions, policy decisions, capability results, and delegations. Nothing is overwritten or deleted. This creates a complete audit trail that proves exactly what happened, when, and why.",
  },
  {
    title: "Deterministic Policy",
    description:
      "The policy engine makes binary decisions based on rules \u2014 no probabilistic reasoning, no AI judgment calls. It checks token validity, spend limits, merchant allowlists, currency restrictions, and beneficiary status. Policy outcomes are recorded as provenance artifacts.",
  },
];

export default function Guide() {
  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
          How to Use the Operator Console
        </h2>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>
          The Governed Payments Operator Console gives you real-time visibility and control over
          an AI-governed agentic payment system. It surfaces the delegation chain, approval workflows,
          task lifecycle, and system configuration \u2014 everything an operator needs to monitor,
          approve, and audit autonomous payment actions.
        </p>
      </div>

      {/* Getting Started */}
      <div
        className="rounded-lg border p-5 mb-6"
        style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
      >
        <h3 className="text-[11px] uppercase tracking-wide font-medium mb-3" style={{ color: "var(--muted)" }}>
          Getting Started
        </h3>
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: "var(--panel-2)", border: "1px solid var(--border)" }}
          >
            <FiDatabase size={18} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Click "Seed demos" in the top-right header
            </p>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>
              This submits three pre-built payment scenarios that demonstrate different outcomes:
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-3">
                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase"
                  style={{ color: "var(--warn)", border: "1px solid var(--warn)" }}>
                  $350
                </span>
                <span className="text-sm" style={{ color: "var(--text)" }}>
                  Happy path \u2014 passes validation, pauses at awaiting_approval for your sign-off
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase"
                  style={{ color: "var(--danger)", border: "1px solid var(--danger)" }}>
                  $600
                </span>
                <span className="text-sm" style={{ color: "var(--text)" }}>
                  Authority violation \u2014 exceeds the token's $500 spend limit, blocked by policy
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase"
                  style={{ color: "var(--danger)", border: "1px solid var(--danger)" }}>
                  $200
                </span>
                <span className="text-sm" style={{ color: "var(--text)" }}>
                  Revoked token \u2014 uses a revoked delegation token, rejected immediately
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Walkthroughs */}
      <h3
        className="text-[11px] uppercase tracking-wide font-medium mb-4 px-1"
        style={{ color: "var(--muted)" }}
      >
        Console Views
      </h3>

      <div className="space-y-4 mb-8">
        {VIEWS.map((v) => (
          <div
            key={v.route}
            className="rounded-lg border p-5"
            style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <v.icon size={18} style={{ color: v.color }} />
              <h4 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {v.title}
              </h4>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {v.description}
            </p>
            <div
              className="mt-3 px-3 py-2 rounded-md text-sm"
              style={{ backgroundColor: "var(--panel-2)", border: "1px solid var(--border)" }}
            >
              <span className="font-medium" style={{ color: "var(--accent)" }}>Try it: </span>
              <span style={{ color: "var(--text)" }}>{v.tryIt}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Key Concepts */}
      <h3
        className="text-[11px] uppercase tracking-wide font-medium mb-4 px-1"
        style={{ color: "var(--muted)" }}
      >
        Key Concepts
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CONCEPTS.map((c) => (
          <div
            key={c.title}
            className="rounded-lg border p-4"
            style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
          >
            <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--text)" }}>
              {c.title}
            </h4>
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
              {c.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
