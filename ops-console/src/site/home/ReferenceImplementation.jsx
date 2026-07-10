import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

const OBSERVE = [
  "Delegated authority verified through scoped tokens",
  "Intent captured and bound to the transaction",
  "Policy evaluated deterministically, with recorded reasons",
  "Risk assessed, with high-value payments escalated to a human",
  "Every decision written to an append-only audit trail",
];

export default function ReferenceImplementation() {
  return (
    <section id="reference-implementation" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div
          className="rounded-2xl px-6 sm:px-12 py-12 sm:py-14"
          style={{
            backgroundColor: "var(--gp-text)",
            color: "#fff",
          }}
        >
          <div className="max-w-2xl">
            <div className="gp-eyebrow mb-3" style={{ color: "#5eead4" }}>
              Reference Implementation
            </div>
            <h2 className="gp-display text-3xl sm:text-4xl mb-4" style={{ color: "#fff" }}>
              See the Control Plane make a decision
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
              This interactive reference implementation demonstrates how the Governed Payments
              Control Plane evaluates delegated authority, intent, policy, and risk before
              authorizing payments.
            </p>

            <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
              {OBSERVE.map((o) => (
                <li key={o} className="flex items-start gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>
                  <span style={{ color: "#5eead4" }}>›</span>
                  {o}
                </li>
              ))}
            </ul>

            <div className="mt-9">
              <Link
                to="/guide"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold no-underline"
                style={{ backgroundColor: "#fff", color: "var(--gp-text)" }}
              >
                Launch Reference Implementation <FiArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
