import { useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import Modal from "../Modal.jsx";

const CHALLENGES = [
  {
    key: "delegated-authority",
    n: "01",
    title: "Delegated Authority",
    subtitle: "Who gave the AI permission?",
    problem:
      "An agent acting on a user’s behalf must carry proof of the authority it was granted — how much it may spend, with whom, and for how long. Today that authority is implicit at best.",
    whyFail:
      "Card networks and wallets authenticate an account holder, not a delegated agent. There is no standard way to express “this agent may spend up to $500 with these merchants until Friday,” nor to revoke that grant instantly across the ecosystem.",
    solution:
      "A Delegation Manager issues scoped, verifiable authority tokens with explicit spend limits, merchant allowlists, delegation depth, and expiry. Authority flows through a verifiable chain, and revocation propagates system-wide the moment it is issued.",
    research:
      "Standardizing delegation tokens as a network primitive; cryptographic chains of delegation; cross-issuer revocation and portable authority.",
  },
  {
    key: "intent-verification",
    n: "02",
    title: "Intent Verification",
    subtitle: "Did the AI correctly understand the user?",
    problem:
      "A payment should reflect what the user actually asked for. When an agent translates a natural-language goal into a transaction, that translation can drift or be manipulated.",
    whyFail:
      "Payment rails receive an amount and a payee — never the intent behind them. There is no field that captures “the user wanted a flight under $400,” so a mistaken or hijacked agent looks identical to a correct one.",
    solution:
      "An Intent Engine captures the user’s goal as structured, signed intent and binds it to the resulting transaction. Downstream components can verify that what is being paid for matches what was authorized.",
    research:
      "Making payment intent a first-class network primitive; intent attestation formats; binding intent to authority and to settlement.",
  },
  {
    key: "policy-evaluation",
    n: "03",
    title: "Policy Evaluation",
    subtitle: "Is this purchase allowed?",
    problem:
      "Organizations and individuals have rules about what may be bought, from whom, and under what conditions. Those rules must be enforced deterministically at the moment of payment.",
    whyFail:
      "Policy today lives in scattered, after-the-fact controls — card blocks, expense reviews, manual approvals. None of it evaluates an agent’s request in real time against a portable, auditable rule set.",
    solution:
      "A Policy Engine makes binary, deterministic decisions against explicit rules — spend limits, merchant restrictions, currency and threshold checks — and records the reason for every decision. No probabilistic judgment sits on the critical path.",
    research:
      "Portable, interoperable payment policies; policy expression standards; separating deterministic enforcement from probabilistic risk.",
  },
  {
    key: "risk-assessment",
    n: "04",
    title: "Risk Assessment",
    subtitle: "Should this transaction proceed?",
    problem:
      "Even a permitted transaction may be unwise: unusual velocity, an anomalous counterparty, or a pattern that suggests compromise. Someone must decide whether to proceed, pause, or escalate.",
    whyFail:
      "Existing fraud systems are tuned for human cardholders and reactive by design. They were not built for agents acting at machine speed across thousands of concurrent decisions.",
    solution:
      "A Risk Engine scores each transaction in context and routes high-stakes or anomalous requests to human review — the human-in-the-loop boundary — rather than silently approving or blocking them.",
    research:
      "Risk models for autonomous agents; standard escalation and human-in-the-loop protocols; shared signals across the ecosystem.",
  },
  {
    key: "auditability",
    n: "05",
    title: "Auditability",
    subtitle: "Can every decision be reconstructed?",
    problem:
      "When an agent spends money, every party — user, merchant, issuer, regulator — needs to reconstruct exactly what happened, who authorized it, and why it was allowed.",
    whyFail:
      "Transaction logs record that money moved, not the authority, intent, policy decisions, and risk evaluation behind it. The reasoning is lost, making disputes and liability assignment intractable.",
    solution:
      "An append-only provenance ledger records every state transition, policy decision, risk outcome, and delegation immutably. Any decision can be replayed end to end, with liability attributed at each step.",
    research:
      "Standard provenance formats; tamper-evident, portable audit trails; liability assignment models for agentic transactions.",
  },
];

function DetailBlock({ label, children, accent }) {
  return (
    <div className="mt-5">
      <div className="gp-eyebrow mb-1.5" style={accent ? undefined : { color: "var(--gp-faint)" }}>
        {label}
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--gp-text-2)" }}>
        {children}
      </p>
    </div>
  );
}

export default function Challenges() {
  const [active, setActive] = useState(null);
  const item = CHALLENGES.find((c) => c.key === active) || null;

  return (
    <section id="challenges" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl mb-12">
          <div className="gp-eyebrow mb-3">Core Challenges</div>
          <h2 className="gp-display text-3xl sm:text-4xl mb-4" style={{ color: "var(--gp-text)" }}>
            Five questions payments can’t yet answer
          </h2>
          <p className="gp-prose text-base">
            Autonomous commerce raises five architectural problems. Each must be answered
            before an agent can be trusted to move money.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHALLENGES.map((c) => (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className="text-left rounded-xl p-6 transition-all group"
              style={{ backgroundColor: "var(--gp-panel)", border: "1px solid var(--gp-border)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--gp-border-strong)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(22,25,31,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--gp-border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                className="text-xs font-semibold mb-4"
                style={{ color: "var(--gp-faint)", fontVariantNumeric: "tabular-nums" }}
              >
                {c.n}
              </div>
              <h3 className="text-base font-semibold mb-1" style={{ color: "var(--gp-text)" }}>
                {c.title}
              </h3>
              <p className="text-sm mb-4" style={{ color: "var(--gp-muted)" }}>
                {c.subtitle}
              </p>
              <span
                className="inline-flex items-center gap-1 text-sm font-medium"
                style={{ color: "var(--gp-accent)" }}
              >
                Learn more <FiArrowRight size={14} />
              </span>
            </button>
          ))}
        </div>
      </div>

      <Modal open={!!item} onClose={() => setActive(null)} labelledBy="challenge-title">
        {item && (
          <div>
            <div className="gp-eyebrow mb-2">Core Challenge {item.n}</div>
            <h3 id="challenge-title" className="gp-display text-2xl mb-1" style={{ color: "var(--gp-text)" }}>
              {item.title}
            </h3>
            <p className="text-sm" style={{ color: "var(--gp-muted)" }}>
              {item.subtitle}
            </p>
            <DetailBlock label="The Problem">{item.problem}</DetailBlock>
            <DetailBlock label="Why today’s systems fail">{item.whyFail}</DetailBlock>
            <DetailBlock label="How Governed Payments solves it">{item.solution}</DetailBlock>
            <DetailBlock label="Future research">{item.research}</DetailBlock>
          </div>
        )}
      </Modal>
    </section>
  );
}
