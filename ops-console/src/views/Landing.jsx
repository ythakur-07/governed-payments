import { Link } from "react-router-dom";
import { FiArrowRight, FiShield, FiEye, FiUserCheck, FiXOctagon } from "react-icons/fi";

const SCENARIOS = [
  {
    number: "01",
    title: "The Approved Purchase",
    amount: "$350",
    outcome: "Approved by human",
    outcomeColor: "var(--success)",
    story:
      "An AI procurement agent needs to buy $350 of supplies from TechSupplies Inc. It has a budget of $500. The system validates the request automatically, but because $350 exceeds the $250 auto-approval threshold, it pauses and asks a human operator: \"Should we proceed?\"",
    agentDecides: "Route the payment, validate the merchant, check the budget",
    humanDecides: "Whether to approve the final release of funds",
    takeaway: "The AI handles the routine work. The human makes the judgment call on significant amounts.",
  },
  {
    number: "02",
    title: "The Blocked Overspend",
    amount: "$600",
    outcome: "Blocked by policy",
    outcomeColor: "var(--danger)",
    story:
      "The same agent tries to buy $600 of supplies \u2014 but its budget only allows $500 total. The policy engine catches this instantly and blocks the payment. No human intervention needed. The rules are clear, and they\u2019re enforced automatically.",
    agentDecides: "Nothing \u2014 the system blocks it before the agent can act",
    humanDecides: "Nothing needed \u2014 the spending limit is enforced automatically",
    takeaway: "Hard spending limits prevent runaway AI spending, even if the agent \"wants\" to proceed.",
  },
  {
    number: "03",
    title: "The Revoked Access",
    amount: "$200",
    outcome: "Rejected instantly",
    outcomeColor: "var(--danger)",
    story:
      "An agent tries to make a perfectly reasonable $200 purchase, but its access has been revoked \u2014 perhaps the agent was decommissioned, or a security concern was raised. The payment is rejected instantly, before any money moves.",
    agentDecides: "Nothing \u2014 rejected before any action is taken",
    humanDecides: "The revocation was a prior human decision that propagates automatically",
    takeaway: "You can cut off an AI agent\u2019s authority instantly, and it takes effect system-wide.",
  },
];

const TAKEAWAYS = [
  {
    icon: FiShield,
    title: "Explicit Budgets, Not Open Authority",
    description: "Every AI agent operates within a defined spending limit. No blank checks, no ambiguity.",
  },
  {
    icon: FiEye,
    title: "Every Action is Recorded",
    description: "An immutable audit trail captures every decision, every state change, every approval \u2014 who did what, when, and why.",
  },
  {
    icon: FiUserCheck,
    title: "Humans Stay in the Loop",
    description: "High-value decisions automatically pause for human review. The system doesn\u2019t bypass you \u2014 it waits.",
  },
  {
    icon: FiXOctagon,
    title: "Instant Revocation",
    description: "Access can be cut off immediately. One action revokes authority across the entire system.",
  },
];

export default function Landing() {
  return (
    <div className="max-w-4xl">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-bold leading-tight" style={{ color: "var(--text)" }}>
          What Happens When AI Agents Handle Money?
        </h1>
        <p className="text-base mt-4 leading-relaxed max-w-2xl" style={{ color: "var(--muted)" }}>
          This prototype shows how autonomous AI agents can make payments \u2014 and what governance
          keeps them in check. Explore three real scenarios to see authorization in action.
        </p>
      </div>

      {/* The Problem */}
      <div
        className="rounded-lg border p-6 mb-8"
        style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
      >
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--text)" }}>
          The Problem
        </h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
          AI agents are increasingly being trusted to take actions on behalf of humans \u2014
          including spending money. But unlike a human employee, an AI agent can operate at machine
          speed, 24/7, across thousands of transactions simultaneously.
        </p>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
          Without proper governance, a single misconfigured agent could drain an account in seconds.
          A compromised agent could redirect payments. An over-permissioned agent could approve its own
          transactions with no oversight.
        </p>
        <p className="text-sm leading-relaxed font-medium" style={{ color: "var(--accent)" }}>
          The question: How do you give an AI agent the authority to pay, while making sure it can't
          overstep?
        </p>
      </div>

      {/* Three Scenarios */}
      <h2
        className="text-[11px] uppercase tracking-widest font-medium mb-5 px-1"
        style={{ color: "var(--muted)" }}
      >
        Three Scenarios, Three Outcomes
      </h2>

      <div className="space-y-5 mb-10">
        {SCENARIOS.map((s) => (
          <div
            key={s.number}
            className="rounded-lg border p-6"
            style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
          >
            {/* Scenario header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span
                  className="text-2xl font-bold"
                  style={{ color: "var(--border)" }}
                >
                  {s.number}
                </span>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                    {s.title}
                  </h3>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    Payment amount: {s.amount}
                  </span>
                </div>
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase"
                style={{ color: s.outcomeColor, border: `1px solid ${s.outcomeColor}` }}
              >
                {s.outcome}
              </span>
            </div>

            {/* Story */}
            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--muted)" }}>
              {s.story}
            </p>

            {/* Agent vs Human decisions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div
                className="rounded-md px-4 py-3"
                style={{ backgroundColor: "var(--panel-2)", border: "1px solid var(--border)" }}
              >
                <div className="text-[11px] uppercase tracking-wide font-medium mb-1" style={{ color: "var(--accent-2)" }}>
                  What the AI agent does
                </div>
                <p className="text-sm" style={{ color: "var(--text)" }}>{s.agentDecides}</p>
              </div>
              <div
                className="rounded-md px-4 py-3"
                style={{ backgroundColor: "var(--panel-2)", border: "1px solid var(--border)" }}
              >
                <div className="text-[11px] uppercase tracking-wide font-medium mb-1" style={{ color: "var(--warn)" }}>
                  What the human decides
                </div>
                <p className="text-sm" style={{ color: "var(--text)" }}>{s.humanDecides}</p>
              </div>
            </div>

            {/* Takeaway */}
            <div
              className="rounded-md px-4 py-2.5 text-sm"
              style={{ backgroundColor: "rgba(94, 234, 212, 0.06)", border: "1px solid rgba(94, 234, 212, 0.15)" }}
            >
              <span className="font-medium" style={{ color: "var(--accent)" }}>Takeaway: </span>
              <span style={{ color: "var(--text)" }}>{s.takeaway}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Key Takeaways */}
      <h2
        className="text-[11px] uppercase tracking-widest font-medium mb-5 px-1"
        style={{ color: "var(--muted)" }}
      >
        Key Takeaways
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {TAKEAWAYS.map((t) => (
          <div
            key={t.title}
            className="rounded-lg border p-5 flex items-start gap-4"
            style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--panel-2)", border: "1px solid var(--border)" }}
            >
              <t.icon size={16} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                {t.title}
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                {t.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        className="rounded-lg border p-6 text-center"
        style={{
          backgroundColor: "var(--panel)",
          borderColor: "var(--accent)",
          borderWidth: "1px",
        }}
      >
        <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text)" }}>
          Ready to try it yourself?
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Follow the step-by-step guide to simulate all three scenarios and see governance in action.
        </p>
        <Link
          to="/guide"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
            color: "#042b27",
          }}
        >
          Start the Guide
          <FiArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
