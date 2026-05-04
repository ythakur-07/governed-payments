import { useState } from "react";
import { FiSearch } from "react-icons/fi";

const TERMS = [
  {
    term: "Agent",
    definition: "An AI program that can take actions autonomously \u2014 in this case, initiating and managing payments on behalf of a human or organization.",
    inPrototype: "Visible in the Trust Graph as nodes in the delegation hierarchy. The procurement agent initiates all three demo payments.",
  },
  {
    term: "Sub-Agent",
    definition: "An AI agent that works under another agent with a narrower set of permissions. It can only do what the parent agent explicitly allows.",
    inPrototype: "Shown as child nodes under the parent agent in the Trust Graph. Sub-agents handle specific tasks like validating merchants.",
  },
  {
    term: "Principal",
    definition: "The entity (person or organization) on whose behalf agents act. The principal grants authority to agents through delegation tokens.",
    inPrototype: "Shown in the Trust Graph between the Root and the agents. The principal holds the delegation tokens.",
  },
  {
    term: "Delegation Token",
    definition: "A digital credential that grants an agent specific, limited authority to act \u2014 like a corporate credit card with built-in spending limits, merchant restrictions, and an expiry date.",
    inPrototype: "Visible in the Trust Graph with authority bars showing spent vs. limit. tok_agent_001 has a $500 limit; tok_agent_002 is revoked.",
  },
  {
    term: "Spend Limit",
    definition: "The maximum total amount an agent is allowed to spend using a delegation token. Once reached, no more payments can be made with that token.",
    inPrototype: "Shown as the authority bar in the Trust Graph. The $600 payment fails because it would exceed the $500 spend limit.",
  },
  {
    term: "Revocation",
    definition: "Immediately canceling an agent's authority to act. Once revoked, the agent cannot make any more payments, regardless of remaining budget.",
    inPrototype: "tok_agent_002 is marked REVOKED in red in the Trust Graph. The $200 payment fails because it uses this revoked token.",
  },
  {
    term: "Policy Engine",
    definition: "The component that checks every payment against a set of rules (spending limits, merchant restrictions, etc.) and makes a pass/fail decision. Fully automatic, no AI judgment involved.",
    inPrototype: "Its decisions appear as provenance records in the Task Explorer. You can see exactly why each payment was approved or rejected.",
  },
  {
    term: "Approval Threshold",
    definition: "A dollar amount above which payments require explicit human approval before being released. Payments below this amount can proceed automatically.",
    inPrototype: "Set to $250 in the Control Plane. The $350 payment exceeds this, which is why it pauses for your approval.",
  },
  {
    term: "Human-in-the-Loop",
    definition: "A design pattern where the system pauses at critical decision points and waits for a human to approve before proceeding. The human's decision is recorded as evidence.",
    inPrototype: "The Approval Queue is where you act as the human-in-the-loop, reviewing and approving payments above the threshold.",
  },
  {
    term: "Provenance",
    definition: "A complete, tamper-proof record of everything that happened \u2014 every decision, every state change, every approval. Like a receipt that can't be altered or thrown away.",
    inPrototype: "The provenance log appears in the Task Explorer when you select a task. Each entry shows what happened, who did it, and when.",
  },
  {
    term: "Audit Trail",
    definition: "A chronological record that traces every action back to its origin. Used to answer: \"What happened, who authorized it, and can we prove it?\"",
    inPrototype: "The provenance log in Task Explorer serves as the audit trail. Click \"raw\" on any entry to see the full evidence.",
  },
  {
    term: "State Machine",
    definition: "A predefined sequence of states that every payment must follow in order. A payment can only move forward through specific transitions \u2014 it can't skip steps or go backward.",
    inPrototype: "Visible in the Task Explorer via the state badges: received \u2192 validating \u2192 awaiting approval \u2192 approved \u2192 releasing \u2192 settled.",
  },
  {
    term: "Kill Switch",
    definition: "An emergency control that immediately blocks all new payments system-wide. Used when something goes wrong and you need to stop everything instantly.",
    inPrototype: "Toggle it in the Control Plane view. When active, it blocks all new payment intake at the orchestrator level.",
  },
  {
    term: "Capability",
    definition: "A specific action the system can perform, like validating a merchant, releasing funds, or checking payment status. Each capability is registered with metadata about its side effects.",
    inPrototype: "Listed in the Capabilities Registry table in the Control Plane view, with flags for side effects and idempotency.",
  },
  {
    term: "Side Effect",
    definition: "When an action changes something in the outside world (like actually moving money), rather than just reading data. Side effects are flagged because they can't be easily undone.",
    inPrototype: "Capabilities with side effects are marked with a warning icon (\u26A0) in the Trust Graph tool chips and the Control Plane registry.",
  },
  {
    term: "Idempotency",
    definition: "The guarantee that performing the same action twice produces the same result. This prevents accidental duplicate payments if a request is retried.",
    inPrototype: "Each payment has a unique idempotency key (visible in Task Explorer). The capability gateway enforces this.",
  },
  {
    term: "Control Plane",
    definition: "The central configuration hub that defines all the rules: who can do what, spending limits, approval thresholds, and registered capabilities. Agents read from it but can never change it.",
    inPrototype: "The entire Control Plane view shows this configuration. Notice that agents cannot modify these settings.",
  },
  {
    term: "Liability Owner",
    definition: "The entity responsible if something goes wrong with a payment. Liability shifts as a payment moves through its lifecycle \u2014 from the initiator to the operator to the system.",
    inPrototype: "Shown in the Task Explorer snapshot for each task. Liability assignment is also recorded in provenance state transitions.",
  },
  {
    term: "Orchestrator",
    definition: "The component that receives incoming payment requests, performs initial checks (like the kill switch), and routes them to the right workflow for processing.",
    inPrototype: "Works behind the scenes. When you click \"Seed demos\", the orchestrator receives and routes all three payment requests.",
  },
];

export default function Glossary() {
  const [search, setSearch] = useState("");

  const filtered = TERMS.filter(
    (t) =>
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
          Glossary
        </h2>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>
          Plain-language definitions of the key terms used in this prototype.
          Each entry explains where you can see the concept in action.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <FiSearch
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--muted)" }}
        />
        <input
          type="text"
          placeholder="Search terms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--panel)",
            color: "var(--text)",
            border: "1px solid var(--border)",
          }}
        />
      </div>

      {/* Terms */}
      <div className="space-y-3">
        {filtered.map((t) => (
          <div
            key={t.term}
            className="rounded-lg border p-4"
            style={{ backgroundColor: "var(--panel)", borderColor: "var(--border)" }}
          >
            <h4 className="text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>
              {t.term}
            </h4>
            <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--muted)" }}>
              {t.definition}
            </p>
            <div
              className="text-xs px-3 py-2 rounded-md"
              style={{ backgroundColor: "var(--panel-2)", border: "1px solid var(--border)" }}
            >
              <span className="font-medium" style={{ color: "var(--accent)" }}>In this prototype: </span>
              <span style={{ color: "var(--text)" }}>{t.inPrototype}</span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-8 text-center rounded-lg border border-dashed" style={{ color: "var(--muted)", borderColor: "var(--border)" }}>
            No terms match "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
