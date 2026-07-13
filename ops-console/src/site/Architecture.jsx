import { Link } from "react-router-dom";
import { FiArrowRight, FiGithub } from "react-icons/fi";
import { FLOW } from "./data/architecture.js";

const TOC = [
  { id: "introduction", label: "Introduction" },
  { id: "diagram", label: "Architecture diagram" },
  { id: "components", label: "Component details" },
  { id: "sequence", label: "Sequence" },
  { id: "trust-boundaries", label: "Trust boundaries" },
  { id: "walkthrough", label: "Transaction walkthrough" },
  { id: "standards", label: "Future standards" },
  { id: "questions", label: "Open questions" },
];

const SEQUENCE = [
  { from: "Merchant", to: "Intent Engine", msg: "Payment request ($350) + the user’s goal" },
  { from: "Intent Engine", to: "Control Plane", msg: "Capture, sign, and bind intent to the request" },
  { from: "Delegation Manager", to: "Control Plane", msg: "Verify authority token — limit $500, merchant allowed" },
  { from: "Policy Engine", to: "Control Plane", msg: "Evaluate → allow, but requires approval ($350 > $250)" },
  { from: "Risk Engine", to: "Operator", msg: "Score low, action = escalate to a human" },
  { from: "Operator", to: "Payment Orchestrator", msg: "Approve the release" },
  { from: "Payment Orchestrator", to: "Wallet", msg: "Idempotent release instruction" },
  { from: "Wallet", to: "Network → Issuer", msg: "Authorize and settle" },
  { from: "Audit Engine", to: "Ledger", msg: "Every step recorded, append-only" },
];

const BOUNDARIES = [
  {
    zone: "Untrusted",
    tone: "danger",
    members: ["Merchant", "AI Agent"],
    note: "Everything here is an assertion, never an authorization. Requests are re-validated on entry; nothing is taken on trust.",
  },
  {
    zone: "Control Plane — governance boundary",
    tone: "accent",
    members: ["Intent Engine", "Policy Engine", "Delegation Manager", "Risk Engine", "Payment Orchestrator", "Audit Engine"],
    note: "The trusted decision layer. Authority is verified, policy is enforced deterministically, risk is scored, and every decision is recorded before any money can move.",
  },
  {
    zone: "Rails",
    tone: "muted",
    members: ["Wallet", "Network", "Issuer"],
    note: "Existing payment systems that execute the cleared instruction. They trust the orchestrator today; over time they can verify governance attestations themselves.",
  },
];

function toneColor(tone) {
  return tone === "danger"
    ? "var(--gp-danger)"
    : tone === "accent"
    ? "var(--gp-accent)"
    : "var(--gp-faint)";
}

function SectionHeading({ id, eyebrow, children }) {
  return (
    <div id={id} className="scroll-mt-24">
      {eyebrow && <div className="gp-eyebrow mb-3">{eyebrow}</div>}
      <h2 className="gp-display text-3xl mb-4" style={{ color: "var(--gp-text)" }}>
        {children}
      </h2>
    </div>
  );
}

function Field({ label, children, mono }) {
  return (
    <div>
      <div className="gp-eyebrow mb-1" style={{ color: "var(--gp-faint)" }}>
        {label}
      </div>
      <div
        className="text-sm leading-relaxed"
        style={{ color: "var(--gp-text-2)", fontFamily: mono ? "var(--gp-mono)" : "inherit" }}
      >
        {children}
      </div>
    </div>
  );
}

export default function Architecture() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Page header */}
      <header className="max-w-3xl mb-12">
        <div className="gp-eyebrow mb-4">Reference Architecture</div>
        <h1 className="gp-display text-4xl sm:text-5xl mb-6" style={{ color: "var(--gp-text)" }}>
          The Governed Payments Control Plane
        </h1>
        <p className="text-lg leading-relaxed" style={{ color: "var(--gp-text-2)" }}>
          A governance layer that sits between an autonomous agent and the payment rails —
          verifying authority, binding intent, enforcing policy, scoring risk, and recording
          every decision before a payment is authorized.
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-12">
        {/* Sticky TOC */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24">
            <div className="gp-eyebrow mb-3" style={{ color: "var(--gp-faint)" }}>
              On this page
            </div>
            <ul className="space-y-2">
              {TOC.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className="text-sm no-underline"
                    style={{ color: "var(--gp-muted)" }}
                  >
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          {/* Introduction */}
          <section>
            <SectionHeading id="introduction" eyebrow="01 — Introduction">
              What the Control Plane does
            </SectionHeading>
            <div className="gp-prose text-base">
              <p>
                The Control Plane is the set of components a payment request must pass through
                before it reaches existing rails. Each one answers a single governance question
                and produces an auditable result. Together they let an agent transact
                autonomously without ever holding unchecked authority.
              </p>
              <p className="mt-4">
                The design favors deterministic enforcement over model judgment on the critical
                path, scoped and revocable authority over ambient permission, and complete
                provenance over after-the-fact reconstruction.
              </p>
            </div>
          </section>

          {/* Diagram */}
          <section className="mt-16">
            <SectionHeading id="diagram" eyebrow="02 — Architecture diagram">
              The request flow
            </SectionHeading>
            <div
              className="rounded-2xl p-6 sm:p-8"
              style={{ backgroundColor: "var(--gp-bg-subtle)", border: "1px solid var(--gp-border)" }}
            >
              <div className="flex flex-col items-center">
                {FLOW.map((c, i) => (
                  <div key={c.key} className="flex flex-col items-center w-full">
                    <a
                      href={`#c-${c.key}`}
                      className="w-full max-w-[300px] no-underline rounded-lg px-4 py-3"
                      style={{
                        backgroundColor: c.governance ? "var(--gp-panel)" : "var(--gp-bg-inset)",
                        border: `1px solid ${c.governance ? "var(--gp-border-strong)" : "var(--gp-border)"}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold" style={{ color: "var(--gp-text)" }}>
                          {c.name}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: c.governance ? "var(--gp-accent)" : "var(--gp-faint)" }}
                        >
                          {c.layer}
                        </span>
                      </div>
                    </a>
                    {i < FLOW.length - 1 && (
                      <div className="py-1.5 text-lg leading-none gp-flow-arrow">↓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--gp-faint)" }}>
              Select any component to jump to its detail below.
            </p>
            <div className="mt-5">
              <Link
                to="/architecture/explore"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold no-underline"
                style={{ color: "var(--gp-text)", border: "1px solid var(--gp-border-strong)" }}
              >
                Open the interactive Explorer <FiArrowRight size={16} />
              </Link>
            </div>
          </section>

          {/* Component details */}
          <section className="mt-16">
            <SectionHeading id="components" eyebrow="03 — Component details">
              Every component, in detail
            </SectionHeading>
            <div className="space-y-5">
              {FLOW.map((c) => (
                <div
                  key={c.key}
                  id={`c-${c.key}`}
                  className="scroll-mt-24 rounded-xl p-6"
                  style={{ backgroundColor: "var(--gp-panel)", border: "1px solid var(--gp-border)" }}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold" style={{ color: "var(--gp-text)" }}>
                      {c.name}
                    </h3>
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        color: c.governance ? "var(--gp-accent)" : "var(--gp-faint)",
                        border: `1px solid ${c.governance ? "var(--gp-accent)" : "var(--gp-border)"}`,
                      }}
                    >
                      {c.layer}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--gp-text-2)" }}>
                    {c.purpose}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Responsibilities">
                      <ul className="space-y-1">
                        {c.responsibilities.map((r, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span style={{ color: "var(--gp-accent)" }}>›</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </Field>
                    <div className="space-y-4">
                      <Field label="Inputs">{c.inputs}</Field>
                      <Field label="Outputs">{c.outputs}</Field>
                      <Field label="Example APIs" mono>
                        {c.apis}
                      </Field>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="gp-eyebrow mb-1" style={{ color: "var(--gp-faint)" }}>
                      Example payload
                    </div>
                    <pre
                      className="text-xs leading-relaxed rounded-lg p-4 overflow-x-auto"
                      style={{
                        backgroundColor: "var(--gp-bg-inset)",
                        border: "1px solid var(--gp-border)",
                        color: "var(--gp-text-2)",
                        fontFamily: "var(--gp-mono)",
                      }}
                    >
                      {c.payload}
                    </pre>
                  </div>

                  <div className="mt-5">
                    <Field label="Design considerations">{c.considerations}</Field>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Sequence */}
          <section className="mt-16">
            <SectionHeading id="sequence" eyebrow="04 — Sequence">
              A payment, step by step
            </SectionHeading>
            <p className="gp-prose text-base mb-6">
              The message flow for a $350 purchase that is within budget but above the
              auto-approval threshold — so it is escalated to a human before release.
            </p>
            <ol
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--gp-border)" }}
            >
              {SEQUENCE.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-4 px-5 py-4"
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid var(--gp-border)",
                    backgroundColor: "var(--gp-panel)",
                  }}
                >
                  <span
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{ backgroundColor: "var(--gp-accent-soft)", color: "var(--gp-accent-strong)" }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--gp-text)" }}>
                      {s.from} <span style={{ color: "var(--gp-faint)" }}>→</span> {s.to}
                    </div>
                    <div className="text-sm" style={{ color: "var(--gp-muted)" }}>
                      {s.msg}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Trust boundaries */}
          <section className="mt-16">
            <SectionHeading id="trust-boundaries" eyebrow="05 — Trust boundaries">
              What is trusted, and where
            </SectionHeading>
            <div className="space-y-4">
              {BOUNDARIES.map((b) => (
                <div
                  key={b.zone}
                  className="rounded-xl p-6"
                  style={{
                    backgroundColor: "var(--gp-panel)",
                    border: `1px solid var(--gp-border)`,
                    borderLeft: `3px solid ${toneColor(b.tone)}`,
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h3 className="text-base font-semibold" style={{ color: "var(--gp-text)" }}>
                      {b.zone}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {b.members.map((m) => (
                      <span
                        key={m}
                        className="text-xs px-2.5 py-1 rounded-md"
                        style={{ backgroundColor: "var(--gp-bg-inset)", color: "var(--gp-text-2)" }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--gp-muted)" }}>
                    {b.note}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Walkthrough */}
          <section className="mt-16">
            <SectionHeading id="walkthrough" eyebrow="06 — Transaction walkthrough">
              The approved purchase, narrated
            </SectionHeading>
            <div className="gp-prose text-base space-y-4">
              <p>
                A procurement agent needs to buy $350 of supplies from an approved merchant. It
                holds a delegation token with a $500 limit. The purchase is legitimate — but
                large enough that the framework should not let the agent complete it alone.
              </p>
              <p>
                The <strong>Intent Engine</strong> captures the user’s goal and binds it to the
                request. The <strong>Delegation Manager</strong> confirms the token is valid,
                unrevoked, and covers both the amount and the merchant. The{" "}
                <strong>Policy Engine</strong> returns <em>allow</em> — but flags that $350
                exceeds the $250 auto-approval threshold. The <strong>Risk Engine</strong>{" "}
                scores the transaction low, and, seeing the threshold flag, escalates to a human
                operator rather than proceeding.
              </p>
              <p>
                The operator approves. Only then does the{" "}
                <strong>Payment Orchestrator</strong> issue an idempotent release to the{" "}
                <strong>Wallet</strong>, which authorizes through the{" "}
                <strong>Network</strong> and <strong>Issuer</strong>. Throughout, the
                provenance ledger records each decision — authority, intent, policy, risk, the
                human approval, and settlement — so the entire transaction can be replayed and
                its liability attributed at every step.
              </p>
              <p>
                Two sibling scenarios show the boundaries: a $600 request is blocked
                deterministically by policy for exceeding the limit, and a $200 request on a
                revoked token is rejected instantly — neither reaches the rails.
              </p>
            </div>
            <div className="mt-6">
              <Link
                to="/guide"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold no-underline"
                style={{ backgroundColor: "var(--gp-text)", color: "#fff" }}
              >
                Run this in the Reference Implementation <FiArrowRight size={16} />
              </Link>
            </div>
          </section>

          {/* Future standards */}
          <section className="mt-16">
            <SectionHeading id="standards" eyebrow="07 — Future standards">
              Where standardization could help
            </SectionHeading>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--gp-border)" }}>
              {FLOW.filter((c) => c.governance).map((c, i) => (
                <div
                  key={c.key}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 px-5 py-4"
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid var(--gp-border)",
                    backgroundColor: "var(--gp-panel)",
                  }}
                >
                  <span className="text-sm font-semibold w-48 shrink-0" style={{ color: "var(--gp-text)" }}>
                    {c.name}
                  </span>
                  <span className="text-sm" style={{ color: "var(--gp-muted)" }}>
                    {c.standards}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Open questions */}
          <section className="mt-16">
            <SectionHeading id="questions" eyebrow="08 — Open questions">
              Unsettled by design
            </SectionHeading>
            <p className="gp-prose text-base mb-5">
              The architecture is deliberately incomplete where the industry has not yet
              agreed. Standardizing delegation, making intent a network primitive, deciding
              where AI identity lives, and assigning liability are open — and best worked out in
              the open.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/#open-questions"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold no-underline"
                style={{ color: "var(--gp-text)", border: "1px solid var(--gp-border-strong)" }}
              >
                Read the open questions <FiArrowRight size={16} />
              </Link>
              <a
                href="https://github.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold no-underline"
                style={{ color: "var(--gp-text)", border: "1px solid var(--gp-border-strong)" }}
              >
                <FiGithub size={15} /> Discuss on GitHub
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
