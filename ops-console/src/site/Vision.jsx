import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

const PRINCIPLES = [
  {
    title: "Deterministic enforcement",
    body: "Permission decisions are made against explicit rules, not model judgment. When policy says no, it means no — and the reason is recorded.",
  },
  {
    title: "Scoped, revocable authority",
    body: "Agents hold no ambient permission. Authority is delegated with explicit limits and can be revoked system-wide the instant it is withdrawn.",
  },
  {
    title: "Intent bound to money",
    body: "What the user asked for travels with the transaction, so every party can verify that what is paid for matches what was authorized.",
  },
  {
    title: "Reconstructable by default",
    body: "Every decision — authority, intent, policy, risk — is written to an append-only record, so any transaction can be replayed end to end.",
  },
];

const CHALLENGES = [
  ["Delegated Authority", "Who gave the AI permission?"],
  ["Intent Verification", "Did the AI correctly understand the user?"],
  ["Policy Evaluation", "Is this purchase allowed?"],
  ["Risk Assessment", "Should this transaction proceed?"],
  ["Auditability", "Can every decision be reconstructed?"],
];

function Lead({ children }) {
  return (
    <p className="text-lg leading-relaxed" style={{ color: "var(--gp-text-2)" }}>
      {children}
    </p>
  );
}

function Body({ children }) {
  return (
    <p className="text-base leading-relaxed mt-4" style={{ color: "var(--gp-text-2)" }}>
      {children}
    </p>
  );
}

function H2({ children }) {
  return (
    <h2 className="gp-display text-3xl mt-16 mb-4" style={{ color: "var(--gp-text)" }}>
      {children}
    </h2>
  );
}

export default function Vision() {
  return (
    <article>
      {/* Header */}
      <header className="mx-auto max-w-3xl px-6 pt-20 pb-4">
        <div className="gp-eyebrow mb-4">Vision</div>
        <h1 className="gp-display text-4xl sm:text-5xl mb-6" style={{ color: "var(--gp-text)" }}>
          Payments need a governance layer before agents can spend
        </h1>
        <Lead>
          AI agents can already browse, reason, and decide. The last thing they cannot do
          safely is spend money — because the systems that move money were designed for a
          human at the moment of decision. Governed Payments proposes the missing layer.
        </Lead>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-6 pb-20">
        <H2>Payments were built for humans</H2>
        <Body>
          Every payment rail in use today assumes a person is present and accountable at the
          point of purchase. Authentication proves who holds an account. Fraud systems are
          tuned to human behavior. Disputes assume a human intent behind each charge. The
          entire stack is optimized for one actor making one decision at human speed.
        </Body>
        <Body>
          An autonomous agent breaks every one of those assumptions. It acts on someone
          else’s behalf, at machine speed, across many transactions at once. Nothing in the
          existing flow can express the questions this raises — let alone answer them.
        </Body>

        <H2>The missing layer is governance</H2>
        <Body>
          Between the agent and the rails sits a gap. Something must decide whether an agent
          is permitted to act, whether it understood the user, whether a purchase is allowed,
          whether it should proceed, and whether the whole decision can later be
          reconstructed. Governed Payments names this layer the <strong>Control Plane</strong>{" "}
          and treats it as first-class infrastructure rather than an afterthought bolted onto
          each application.
        </Body>

        {/* Five challenges */}
        <div
          className="mt-8 rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--gp-border)" }}
        >
          {CHALLENGES.map(([title, q], i) => (
            <div
              key={title}
              className="flex items-baseline gap-4 px-5 py-4"
              style={{
                borderTop: i === 0 ? "none" : "1px solid var(--gp-border)",
                backgroundColor: "var(--gp-panel)",
              }}
            >
              <span
                className="text-xs font-semibold shrink-0 w-6"
                style={{ color: "var(--gp-faint)", fontVariantNumeric: "tabular-nums" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-semibold w-44 shrink-0" style={{ color: "var(--gp-text)" }}>
                {title}
              </span>
              <span className="text-sm" style={{ color: "var(--gp-muted)" }}>
                {q}
              </span>
            </div>
          ))}
        </div>

        <H2>A control plane, not a walled garden</H2>
        <Body>
          The goal is not another proprietary payment product. It is a reference architecture
          the industry can adopt, critique, and standardize — so that governance travels with
          the transaction rather than being re-invented behind every wall. Four principles
          shape it.
        </Body>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRINCIPLES.map((p) => (
            <div
              key={p.title}
              className="rounded-xl p-5"
              style={{ backgroundColor: "var(--gp-bg-subtle)", border: "1px solid var(--gp-border)" }}
            >
              <h3 className="text-base font-semibold mb-1.5" style={{ color: "var(--gp-text)" }}>
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--gp-muted)" }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>

        <H2>An open inquiry</H2>
        <Body>
          Governed Payments is an independent research initiative, not a finished standard. It
          proposes an architecture and a working reference implementation as a concrete
          starting point — and puts the hard questions in the open: how authority should be
          delegated, where AI identity should live, and how liability should be assigned when
          an agent moves money.
        </Body>

        {/* CTAs */}
        <div className="mt-12 flex flex-col sm:flex-row gap-3">
          <Link
            to="/architecture"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold no-underline"
            style={{ backgroundColor: "var(--gp-text)", color: "#fff" }}
          >
            Explore the Architecture <FiArrowRight size={16} />
          </Link>
          <Link
            to="/guide"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold no-underline"
            style={{ color: "var(--gp-text)", border: "1px solid var(--gp-border-strong)" }}
          >
            Launch the Reference Implementation
          </Link>
        </div>
      </div>
    </article>
  );
}
