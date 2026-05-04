import { useState } from "react";
import { Link } from "react-router-dom";
import { FiDatabase, FiGitBranch, FiCheckCircle, FiSearch, FiSliders, FiChevronDown, FiChevronRight } from "react-icons/fi";

function Expandable({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-md border mt-3"
      style={{ backgroundColor: "var(--panel-2)", borderColor: "var(--border)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left"
        style={{ color: "var(--accent)" }}
      >
        {open ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
        {title}
      </button>
      {open && (
        <div className="px-3 pb-3 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

const STEPS = [
  {
    number: 1,
    icon: FiDatabase,
    title: "Seed the Demo Data",
    whatToDo: (
      <>
        Click the <strong>"Seed demos"</strong> button in the top-right corner of the header.
      </>
    ),
    whatHappens:
      "Three payment requests are submitted to the system simultaneously. Each follows a different path based on the governance rules:",
    outcomes: [
      { label: "$350 purchase", result: "Passes validation, pauses for your approval", color: "var(--warn)" },
      { label: "$600 purchase", result: "Blocked automatically \u2014 exceeds the $500 budget", color: "var(--danger)" },
      { label: "$200 purchase", result: "Rejected instantly \u2014 the agent's access was revoked", color: "var(--danger)" },
    ],
    deeper: null,
  },
  {
    number: 2,
    icon: FiGitBranch,
    title: "See the Chain of Trust",
    nav: { label: "Trust Graph", to: "/trust" },
    whatToDo: (
      <>
        Click <strong>"Trust Graph"</strong> in the sidebar.
      </>
    ),
    whatHappens:
      "You'll see a hierarchy showing who authorized whom. At the top is the Root Authorization Service \u2014 think of it as the company's finance department. Below it are the agents that have been granted permission to spend.",
    lookFor: [
      "The authority bars show how much spending power each agent has left (like a budget meter)",
      "One token is marked REVOKED in red \u2014 that agent's access has been cut off",
      "Each level in the tree represents a delegation of authority: the root trusts the principal, who trusts the agent",
    ],
    deeper: {
      title: "What are delegation tokens?",
      content: "A delegation token is like a corporate credit card with built-in limits. It specifies: who can spend (the agent), how much they can spend (spend limit), which merchants they can pay (allowlist), and how deep they can delegate to sub-agents. Unlike a credit card, tokens can be revoked instantly and the revocation takes effect system-wide.",
    },
  },
  {
    number: 3,
    icon: FiCheckCircle,
    title: "Approve a Payment",
    nav: { label: "Approval Queue", to: "/approve" },
    whatToDo: (
      <>
        Click <strong>"Approval Queue"</strong> in the sidebar. You'll see the $350 payment waiting for your decision.
      </>
    ),
    whatHappens:
      "This payment is paused because $350 exceeds the $250 auto-approval threshold. The system is asking you, the human operator: \"This amount is significant \u2014 should we proceed?\"",
    action: (
      <>
        Click <strong>"Approve"</strong> and watch the payment complete. Behind the scenes, the system re-validates the policy one more time, releases the funds, settles the transaction, and begins reconciliation.
      </>
    ),
    deeper: {
      title: "Why does the system pause here?",
      content: "The approval threshold ($250) is a configurable rule in the Control Plane. Any payment above this amount requires explicit human sign-off. The system doesn't bypass you or make the call on its own \u2014 it waits. This is the \"human-in-the-loop\" pattern: AI handles the routine work, humans make the high-stakes decisions. The approval (or rejection) is recorded in the provenance log as evidence.",
    },
  },
  {
    number: 4,
    icon: FiSearch,
    title: "Inspect the Evidence Trail",
    nav: { label: "Task Explorer", to: "/explorer" },
    whatToDo: (
      <>
        Click <strong>"Task Explorer"</strong> in the sidebar. Select each of the three tasks on the left to compare their outcomes.
      </>
    ),
    whatHappens: "Each task tells a different story through its state and evidence trail:",
    outcomes: [
      { label: "$350 task", result: "Full lifecycle: approved \u2192 released \u2192 settled \u2192 reconciled", color: "var(--success)" },
      { label: "$600 task", result: "Failed at validation \u2014 policy blocked it for exceeding spend limit", color: "var(--danger)" },
      { label: "$200 task", result: "Failed immediately \u2014 the delegation token was revoked", color: "var(--danger)" },
    ],
    deeper: {
      title: "What's in the provenance log?",
      content: "The provenance log is an append-only record of everything that happened to a task. Each entry shows: what happened (state transition, policy decision, or delegation), who did it (an agent, the system, or a human), and when. Click \"raw\" on any entry to see the full data. Nothing in this log can be edited or deleted \u2014 it's designed to be tamper-evident, like a receipt you can't throw away.",
    },
  },
  {
    number: 5,
    icon: FiSliders,
    title: "See the System Controls",
    nav: { label: "Control Plane", to: "/control-plane" },
    whatToDo: (
      <>
        Click <strong>"Control Plane"</strong> in the sidebar.
      </>
    ),
    whatHappens:
      "This is the central configuration that governs everything. You'll see the rules: maximum payment amount ($1,000), approval threshold ($250), supported currencies, and timeout settings. You'll also see which agents and capabilities are registered in the system.",
    action: (
      <>
        <strong>Try the kill switch:</strong> Toggle it to ACTIVE. This is the emergency stop \u2014 it blocks all new payments system-wide. Toggle it back off to resume. In a real system, this is the red button you'd press if something went wrong.
      </>
    ),
    deeper: {
      title: "Who controls the Control Plane?",
      content: "In this prototype, the Control Plane is configured at startup. In a production system, it would be managed by platform administrators \u2014 not by the AI agents themselves. Agents read from the Control Plane (to know their limits) but can never write to it. This separation ensures that an agent can't raise its own spending limit or grant itself new permissions.",
    },
  },
];

export default function Guide() {
  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
          Step-by-Step Guide
        </h2>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>
          Follow these five steps to simulate three real payment scenarios and see AI governance
          in action. The whole walkthrough takes about two minutes.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-5 mb-10">
        {STEPS.map((step) => (
          <div
            key={step.number}
            className="rounded-lg border p-5"
            style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
          >
            {/* Step header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#042b27" }}
              >
                {step.number}
              </div>
              <div className="flex items-center gap-2">
                <step.icon size={16} style={{ color: "var(--accent)" }} />
                <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                  {step.title}
                </h3>
              </div>
              {step.nav && (
                <Link
                  to={step.nav.to}
                  className="ml-auto text-xs font-medium px-2.5 py-1 rounded-md transition-all hover:opacity-80"
                  style={{ backgroundColor: "var(--panel-2)", color: "var(--accent)", border: "1px solid var(--border)" }}
                >
                  Open {step.nav.label} &rarr;
                </Link>
              )}
            </div>

            {/* What to do */}
            <div className="mb-3">
              <div className="text-[11px] uppercase tracking-wide font-medium mb-1" style={{ color: "var(--accent-2)" }}>
                What to do
              </div>
              <p className="text-sm" style={{ color: "var(--text)" }}>{step.whatToDo}</p>
            </div>

            {/* What happens */}
            <div className="mb-1">
              <div className="text-[11px] uppercase tracking-wide font-medium mb-1" style={{ color: "var(--warn)" }}>
                What happens
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{step.whatHappens}</p>
            </div>

            {/* Outcomes list */}
            {step.outcomes && (
              <div className="mt-2 space-y-1.5">
                {step.outcomes.map((o) => (
                  <div key={o.label} className="flex items-start gap-2.5 text-sm">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase shrink-0 mt-0.5"
                      style={{ color: o.color, border: `1px solid ${o.color}` }}
                    >
                      {o.label}
                    </span>
                    <span style={{ color: "var(--text)" }}>{o.result}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Look for */}
            {step.lookFor && (
              <div className="mt-3">
                <div className="text-[11px] uppercase tracking-wide font-medium mb-1.5" style={{ color: "var(--muted)" }}>
                  What to look for
                </div>
                <ul className="space-y-1">
                  {step.lookFor.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text)" }}>
                      <span style={{ color: "var(--accent)" }}>&#8250;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action */}
            {step.action && (
              <div
                className="mt-3 rounded-md px-3 py-2.5 text-sm"
                style={{ backgroundColor: "rgba(94, 234, 212, 0.06)", border: "1px solid rgba(94, 234, 212, 0.15)" }}
              >
                {step.action}
              </div>
            )}

            {/* Expandable deeper section */}
            {step.deeper && (
              <Expandable title={step.deeper.title}>
                {step.deeper.content}
              </Expandable>
            )}
          </div>
        ))}
      </div>

      {/* What Just Happened */}
      <div
        className="rounded-lg border p-6 mb-6"
        style={{ backgroundColor: "var(--panel)", borderColor: "var(--accent)", borderWidth: "1px" }}
      >
        <h3 className="text-base font-semibold mb-3" style={{ color: "var(--text)" }}>
          What Just Happened?
        </h3>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
          You just watched three payments flow through an AI-governed system. Each one hit a different
          governance boundary:
        </p>
        <ul className="space-y-2 text-sm" style={{ color: "var(--text)" }}>
          <li className="flex items-start gap-2">
            <span style={{ color: "var(--success)" }}>&#10003;</span>
            The $350 payment was <strong>within budget but significant</strong> \u2014 so the system
            asked a human to approve it before releasing funds.
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: "var(--danger)" }}>&#10007;</span>
            The $600 payment <strong>exceeded the agent's spending limit</strong> \u2014 the policy
            engine blocked it automatically, no human needed.
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: "var(--danger)" }}>&#10007;</span>
            The $200 payment used a <strong>revoked access token</strong> \u2014 the agent's authority
            had been cut off, and the system enforced it instantly.
          </li>
        </ul>
        <p className="text-sm leading-relaxed mt-3" style={{ color: "var(--muted)" }}>
          Together, these scenarios demonstrate the core principle: AI agents can operate autonomously
          within clear boundaries, but governance ensures they can never overstep.
        </p>
      </div>
    </div>
  );
}
